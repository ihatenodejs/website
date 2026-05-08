const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return rtf.format(-seconds, "second");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.floor(hours / 24), "day");
}
