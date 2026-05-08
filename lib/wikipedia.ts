import { connection } from "next/server";

import { redisLogger, wikipediaLogger } from "@/lib/logger";
import { redis } from "./redis";

export interface WikipediaStats {
  editCount: number;
  timeSinceRegistration: string;
  lastSynced: number;
}

const CACHE_KEY = "wikipedia:stats";
const ERROR_CACHE_KEY = "wikipedia:stats:error";
const CACHE_TTL = 3600;
const ERROR_TTL = 300;

let pendingFetch: Promise<WikipediaStats> | null = null;

function sanitizeErrorDetail(value: string, maxLength = 160): string {
  if (!value) return "";
  const withoutTags = value.replace(/<[^>]*>/g, " ");
  const collapsed = withoutTags.replace(/\s+/g, " ").trim();
  if (collapsed.length <= maxLength) return collapsed;
  return `${collapsed.slice(0, maxLength)}...`;
}

function calculateTimeSince(dateString: string): string {
  const regDate = new Date(dateString);
  const now = new Date();

  let years = now.getFullYear() - regDate.getFullYear();
  let months = now.getMonth() - regDate.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} month${months !== 1 ? "s" : ""}`);

  return parts.length > 0 ? parts.join(", ") : "Just joined";
}

async function getCachedError(): Promise<boolean> {
  try {
    const cached = await redis.get(ERROR_CACHE_KEY);
    return cached !== null;
  } catch {
    return false;
  }
}

async function setErrorCache(): Promise<void> {
  try {
    await redis.set(ERROR_CACHE_KEY, "1", "EX", ERROR_TTL);
  } catch (err) {
    redisLogger.error("Valkey error cache SET error", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function getStaleCache(): Promise<WikipediaStats | null> {
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...parsed, lastSynced: parsed.lastSynced || Date.now() };
    }
  } catch (err) {
    redisLogger.error("Valkey stale cache GET error", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return null;
}

async function doFetch(): Promise<WikipediaStats> {
  const username = process.env.WIKIPEDIA_USERNAME || "OnlyNano";
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=users&ususers=${encodeURIComponent(username)}&usprop=editcount|registration`;

  const res = await fetch(url);
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    let detail = "";
    try {
      const parsed = JSON.parse(errorBody);
      detail = parsed?.error?.info || parsed?.error?.code || "";
      detail = sanitizeErrorDetail(detail || errorBody);
    } catch {
      detail = sanitizeErrorDetail(errorBody);
    }
    throw new Error(
      `Wikipedia API error ${res.status}${res.statusText ? ` ${res.statusText}` : ""}${detail ? `: ${detail}` : ""}`,
    );
  }
  const data = await res.json();

  const user = data?.query?.users?.[0];
  if (!user || user.missing !== undefined) {
    throw new Error(`User ${username} not found`);
  }

  return {
    editCount: user.editcount || 0,
    timeSinceRegistration: user.registration
      ? calculateTimeSince(user.registration)
      : "Unknown",
    lastSynced: Date.now(),
  };
}

async function fetchWikipediaStats(): Promise<WikipediaStats> {
  if (pendingFetch) return pendingFetch;
  pendingFetch = doFetch();
  try {
    return await pendingFetch;
  } finally {
    pendingFetch = null;
  }
}

export async function getWikipediaStats(): Promise<WikipediaStats> {
  await connection();

  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...parsed, lastSynced: parsed.lastSynced || Date.now() };
    }
  } catch (err) {
    redisLogger.error("Valkey GET error", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const hasErrorCache = await getCachedError();
  if (hasErrorCache) {
    const stale = await getStaleCache();
    if (stale) {
      wikipediaLogger.warn(
        "Wikipedia API: Serving stale cache due to recent error",
      );
      return stale;
    }
    return {
      editCount: 0,
      timeSinceRegistration: "Error loading",
      lastSynced: Date.now(),
    };
  }

  try {
    const stats = await fetchWikipediaStats();

    if (stats.editCount > 0) {
      try {
        await redis.set(CACHE_KEY, JSON.stringify(stats), "EX", CACHE_TTL);
      } catch (err) {
        redisLogger.error("Valkey SET error", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return stats;
  } catch (error) {
    if (error instanceof Error) {
      wikipediaLogger.error("Wikipedia API fetch error", {
        error: error.message,
      });
    } else {
      wikipediaLogger.error("Wikipedia API fetch error", {
        error: String(error),
      });
    }

    await setErrorCache();

    const stale = await getStaleCache();
    if (stale) {
      wikipediaLogger.warn(
        "Wikipedia API: Serving stale cache due to fetch error",
      );
      return stale;
    }

    return {
      editCount: 0,
      timeSinceRegistration: "Error loading",
      lastSynced: Date.now(),
    };
  }
}
