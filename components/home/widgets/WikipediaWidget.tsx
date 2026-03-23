import { getWikipediaStats } from "@/lib/wikipedia";
import { SiWikipedia } from "react-icons/si";
import { Suspense } from "react";

export default function WikipediaWidget() {
  return (
    <div className="border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <SiWikipedia size={14} className="text-black" />
        <h3 className="font-bold text-lg leading-none">Wikipedia</h3>
      </div>
      <Suspense
        fallback={<div className="text-sm text-gray-500">Loading stats...</div>}
      >
        <WikipediaStatsFetcher />
      </Suspense>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function WikipediaStatsFetcher() {
  let stats;
  try {
    stats = await getWikipediaStats();
  } catch {
    return <div className="text-sm text-red-600">Failed to load stats.</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Contributions</span>
        <span className="font-semibold">
          {stats.editCount.toLocaleString()}
        </span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Active For</span>
        <span className="font-semibold text-right max-w-[120px]">
          {stats.timeSinceRegistration}
        </span>
      </div>
      <div className="text-xs text-gray-400 mt-2 text-right">
        Last synced {formatTimeAgo(stats.lastSynced)}
      </div>
    </div>
  );
}
