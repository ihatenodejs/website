import { getWikipediaStats } from "@/lib/wikipedia";
import { formatTimeAgo } from "@/lib/format-time-ago";
import { SiWikipedia } from "react-icons/si";
import { TbLoader } from "react-icons/tb";
import { Suspense } from "react";

export default function WikipediaWidget() {
  return (
    <div className="border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <SiWikipedia size={14} className="text-black" />
        <h3 className="font-bold text-lg leading-none">Wikipedia</h3>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TbLoader className="animate-spin" />
            Loading stats...
          </div>
        }
      >
        <WikipediaStatsFetcher />
      </Suspense>
    </div>
  );
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
