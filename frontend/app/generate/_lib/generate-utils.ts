export function formatTime(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return String(dateStr);

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;

  return date.toLocaleDateString();
}

export function formatScheduledDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function toDateTimeLocalValue(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function extractEmailAddress(from: string): string {
  if (!from) return "";
  const match = from.match(/<([^>]+)>/);
  if (match?.[1]) return match[1].trim().toLowerCase();
  if (from.includes("@")) return from.trim().toLowerCase();
  return "";
}

export function getSenderDisplayName(from: string): string {
  if (!from) return "Unknown";
  return from.split("<")[0].trim() || from;
}

export function getSenderInitial(from: string): string {
  const name = getSenderDisplayName(from);
  return name.charAt(0).toUpperCase() || "?";
}

export function getLetterAvatarColors(letter: string) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    A: { bg: "#9d390a", text: "#ffffff" },
    B: { bg: "#006cef", text: "#ffffff" },
    C: { bg: "#021d8c", text: "#ffffff" },
    D: { bg: "#730443", text: "#ffffff" },
    E: { bg: "#004927", text: "#ffffff" },
    F: { bg: "#2a234a", text: "#ffffff" },
    G: { bg: "#ff8800", text: "#ffffff" },
    H: { bg: "#ff0000", text: "#ffffff" },
    I: { bg: "#008b31", text: "#ffffff" },
    J: { bg: "#b175f0", text: "#ffffff" },
    K: { bg: "#0076b5", text: "#ffffff" },
    L: { bg: "#2b2200", text: "#ffffff" },
    M: { bg: "#610b3c", text: "#ffffff" },
    N: { bg: "#00e3f8", text: "#ffffff" },
    O: { bg: "#3b540c", text: "#ffffff" },
    P: { bg: "#3e5582", text: "#ffffff" },
    Q: { bg: "#3d3a3e", text: "#ffffff" },
    R: { bg: "#352b03", text: "#ffffff" },
    S: { bg: "#0e2a4b", text: "#ffffff" },
    T: { bg: "#58d198", text: "#ffffff" },
    U: { bg: "#000000", text: "#ffffff" },
    V: { bg: "#864e12", text: "#ffffff" },
    W: { bg: "#6b0000", text: "#ffffff" },
    X: { bg: "#0a2213", text: "#ffffff" },
    Y: { bg: "#343a40", text: "#ffffff" },
    Z: { bg: "#2f071d", text: "#ffffff" },
    "?": { bg: "#E5E7EB", text: "#fbfdff" },
  };

  return colorMap[letter] || colorMap["?"];
}