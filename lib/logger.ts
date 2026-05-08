import { getLogger } from "@logtape/logtape";

const baseCategory = ["app"] as const;

export const appLogger = getLogger([...baseCategory]);
export const redisLogger = getLogger([...baseCategory, "redis"]);
export const wikipediaLogger = getLogger([...baseCategory, "wikipedia"]);
export const githubLogger = getLogger([...baseCategory, "github"]);
export const listenBrainzLogger = getLogger([...baseCategory, "listenbrainz"]);
