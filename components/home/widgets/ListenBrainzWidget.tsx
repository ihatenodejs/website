import { getListenBrainzStats } from "@/lib/listenbrainz";
import { formatTimeAgo } from "@/lib/format-time-ago";
import { TbMusic, TbLoader } from "react-icons/tb";
import { Suspense } from "react";

export default function ListenBrainzWidget() {
  return (
    <div className="border border-gray-200 p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <TbMusic size={14} className="text-black" />
        <h3 className="font-bold text-lg leading-none">Music</h3>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TbLoader className="animate-spin" />
            Loading stats...
          </div>
        }
      >
        <ListenBrainzFetcher />
      </Suspense>
    </div>
  );
}

async function ListenBrainzFetcher() {
  let stats;
  try {
    stats = await getListenBrainzStats();
  } catch {
    return <div className="text-sm text-red-600">Failed to load stats.</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Listens All-Time</span>
        <span className="font-semibold">
          {stats.listenCount.toLocaleString()}
        </span>
      </div>
      <div className="text-xs text-gray-400 mt-2 flex justify-between items-end gap-2 text-right">
        <span className="text-left">Data fetched from ListenBrainz</span>
        <span>Last synced {formatTimeAgo(stats.lastSynced)}</span>
      </div>
    </div>
  );
}
