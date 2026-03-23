import { redis } from "./redis";
import fs from "fs";
import path from "path";

export interface ListenBrainzStats {
  listenCount: number;
  lastSynced: number;
}

async function fetchListenBrainzStats(): Promise<ListenBrainzStats> {
  const username = process.env.LISTENBRAINZ_USERNAME || "p0ntus";
  const email = process.env.CONTACT_EMAIL || "aidan@p0ntus.com";

  let version = "1.0.0";
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    version = pkg.version;
  } catch {
    console.error("Could not read package.json version");
  }

  const userAgent = `aidan.so/${version} ( ${email} )`;
  const url = `https://api.listenbrainz.org/1/user/${encodeURIComponent(username)}/listen-count`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        Accept: "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch ListenBrainz stats");
    const data = await res.json();

    return {
      listenCount: data.payload.count || 0,
      lastSynced: Date.now(),
    };
  } catch (error) {
    console.error("ListenBrainz API fetch error:", error);
    return { listenCount: 0, lastSynced: Date.now() };
  }
}

export async function getListenBrainzStats(): Promise<ListenBrainzStats> {
  const CACHE_KEY = "listenbrainz:stats";

  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...parsed, lastSynced: parsed.lastSynced || Date.now() };
    }
  } catch (err) {
    console.error("Valkey GET error:", err);
  }

  const stats = await fetchListenBrainzStats();

  if (stats.listenCount > 0) {
    try {
      await redis.set(CACHE_KEY, JSON.stringify(stats), "EX", 3600);
    } catch (err) {
      console.error("Valkey SET error:", err);
    }
  }

  return stats;
}
