import { redis } from "./redis";

export interface GithubStats {
  commits: number;
  repos: number;
  stars: number;
  lastSynced: number;
}

async function fetchGithubStats(): Promise<GithubStats> {
  const token = process.env.GITHUB_PAT;
  if (!token) {
    console.warn("No GITHUB_PAT configured");
    return { commits: 0, repos: 0, stars: 0, lastSynced: Date.now() };
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  try {
    // 1. Repos
    const userRes = await fetch("https://api.github.com/user", { headers });
    if (!userRes.ok) throw new Error("Failed to fetch user repos");
    const userData = await userRes.json();
    const repos =
      (userData.public_repos || 0) + (userData.total_private_repos || 0);

    // 2. Stars
    let stars = 0;
    let page = 1;
    while (true) {
      const reposRes = await fetch(
        `https://api.github.com/user/repos?affiliation=owner,collaborator&per_page=100&page=${page}`,
        { headers },
      );
      if (!reposRes.ok) throw new Error("Failed to fetch repos for stars");
      const reposData: Array<{ stargazers_count?: number }> =
        await reposRes.json();
      if (reposData.length === 0) break;

      stars += reposData.reduce(
        (acc, repo) => acc + (repo.stargazers_count || 0),
        0,
      );

      const linkHeader = reposRes.headers.get("link");
      if (!linkHeader || !linkHeader.includes('rel="next"')) {
        break;
      }
      page++;
    }

    // 3. Commits
    let commits = 0;
    const currentYear = new Date().getFullYear();
    const startYear = 2024;

    for (let year = startYear; year <= currentYear; year++) {
      const from = `${year}-01-01T00:00:00Z`;
      const to = `${year}-12-31T23:59:59Z`;

      const graphqlQuery = `
        query {
          user(login: "ihatenodejs") {
            contributionsCollection(from: "${from}", to: "${to}") {
              totalCommitContributions
              restrictedContributionsCount
            }
          }
        }
      `;

      const graphqlRes = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers,
        body: JSON.stringify({ query: graphqlQuery }),
      });

      if (graphqlRes.ok) {
        const gqlData = await graphqlRes.json();
        const collection = gqlData?.data?.user?.contributionsCollection;
        if (collection) {
          commits +=
            (collection.totalCommitContributions || 0) +
            (collection.restrictedContributionsCount || 0);
        }
      }
    }

    return { commits, repos, stars, lastSynced: Date.now() };
  } catch (error) {
    console.error("GitHub API fetch error:", error);
    return { commits: 0, repos: 0, stars: 0, lastSynced: Date.now() };
  }
}

export async function getGithubStats(): Promise<GithubStats> {
  const CACHE_KEY = "github:stats";

  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...parsed, lastSynced: parsed.lastSynced || Date.now() };
    }
  } catch (err) {
    console.error("Valkey GET error:", err);
  }

  const stats = await fetchGithubStats();

  if (stats.commits > 0 || stats.repos > 0 || stats.stars > 0) {
    try {
      await redis.set(CACHE_KEY, JSON.stringify(stats), "EX", 3600);
    } catch (err) {
      console.error("Valkey SET error:", err);
    }
  }

  return stats;
}
