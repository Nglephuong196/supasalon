import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Search, Calendar, Users, FileText } from "lucide-react-native";
import { colors, spacing, fontSize, fontWeight } from "../lib/theme";

type EmptyStateType = "search" | "bookings" | "customers" | "invoices" | "employees";

interface EmptyStateProps {
  type?: EmptyStateType;
  message?: string;
  submessage?: string;
}

const icons: Record<EmptyStateType, React.ReactNode> = {
  search: <Search size={32} color={colors.textMuted} />,
  bookings: <Calendar size={32} color={colors.textMuted} />,
  customers: <Users size={32} color={colors.textMuted} />,
  invoices: <FileText size={32} color={colors.textMuted} />,
  employees: <Users size={32} color={colors.textMuted} />,
};

const defaultMessages: Record<EmptyStateType, string> = {
  search: "Không tìm thấy kết quả",
  bookings: "Chưa có lịch hẹn nào",
  customers: "Chưa có khách hàng nào",
  invoices: "Chưa có hóa đơn nào",
  employees: "Chưa có nhân viên nào",
};

export default function EmptyState({ type = "search", message, submessage }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{icons[type]}</View>
      <Text style={styles.message}>{message || defaultMessages[type]}</Text>
      {submessage && <Text style={styles.submessage}>{submessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl * 2,
  },
  iconContainer: {
    backgroundColor: colors.borderLight,
    padding: spacing.lg,
    borderRadius: 999,
    marginBottom: spacing.lg,
  },
  message: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    textAlign: "center",
  },
  submessage: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
