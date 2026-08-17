export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 45) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'Yesterday';
  if (day < 7) return `${day} days ago`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week} week${week > 1 ? 's' : ''} ago`;
  const month = Math.floor(day / 30);
  return `${month} month${month > 1 ? 's' : ''} ago`;
}
