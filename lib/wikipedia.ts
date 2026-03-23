import { redis } from "./redis";

export interface WikipediaStats {
  editCount: number;
  timeSinceRegistration: string;
  lastSynced: number;
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

async function fetchWikipediaStats(): Promise<WikipediaStats> {
  const username = process.env.WIKIPEDIA_USERNAME || "OnlyNano";
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=users&ususers=${encodeURIComponent(username)}&usprop=editcount|registration`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch Wikipedia stats");
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
  } catch (error) {
    console.error("Wikipedia API fetch error:", error);
    return {
      editCount: 0,
      timeSinceRegistration: "Error loading",
      lastSynced: Date.now(),
    };
  }
}

export async function getWikipediaStats(): Promise<WikipediaStats> {
  const CACHE_KEY = "wikipedia:stats";

  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...parsed, lastSynced: parsed.lastSynced || Date.now() };
    }
  } catch (err) {
    console.error("Valkey GET error:", err);
  }

  const stats = await fetchWikipediaStats();

  if (stats.editCount > 0) {
    try {
      await redis.set(CACHE_KEY, JSON.stringify(stats), "EX", 3600);
    } catch (err) {
      console.error("Valkey SET error:", err);
    }
  }

  return stats;
}
