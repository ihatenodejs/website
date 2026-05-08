import Redis from "ioredis";
import { redisLogger } from "@/lib/logger";

const globalForRedis = global as unknown as { redis: Redis | null };

let redisInstance: Redis | null = null;

function getRedis(): Redis {
  if (globalForRedis.redis) return globalForRedis.redis;
  if (redisInstance) return redisInstance;

  const url = process.env.VALKEY_URL || "redis://localhost:6379";
  redisInstance = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 100, 2000);
    },
  });

  redisInstance.on("error", (err) => {
    redisLogger.error("[ioredis] Connection error: {message}", {
      message: err.message,
    });
  });

  if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = redisInstance;
  }

  return redisInstance;
}

export const redis = {
  async get(key: string): Promise<string | null> {
    try {
      return await getRedis().get(key);
    } catch {
      return null;
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async set(key: string, value: string, ...args: any[]): Promise<"OK" | null> {
    try {
      return await getRedis().set(key, value, ...args);
    } catch {
      return null;
    }
  },
};
