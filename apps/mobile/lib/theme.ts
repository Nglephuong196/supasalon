// Shared theme constants matching web app design
export const colors = {
  primary: "#9333ea",
  primaryLight: "#a855f7",
  primaryDark: "#7e22ce",

  background: "#ffffff",
  card: "#ffffff",
  border: "#e5e7eb",
  borderLight: "#f3f4f6",

  text: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",

  // Status colors
  success: "#10b981",
  successLight: "#d1fae5",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  error: "#ef4444",
  errorLight: "#fee2e2",
  info: "#3b82f6",
  infoLight: "#dbeafe",

  // Status badge colors
  paid: { bg: "#dcfce7", text: "#16a34a" },
  pending: { bg: "#fef9c3", text: "#ca8a04" },
  cancelled: { bg: "#fee2e2", text: "#dc2626" },
  confirmed: { bg: "#d1fae5", text: "#059669" },
  completed: { bg: "#dbeafe", text: "#2563eb" },
  checkin: { bg: "#f3e8ff", text: "#9333ea" },

  // Role colors
  owner: { bg: "#ffedd5", text: "#ea580c" },
  admin: { bg: "#f3e8ff", text: "#9333ea" },
  member: { bg: "#dbeafe", text: "#2563eb" },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 28,
};

export const fontWeight = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};
