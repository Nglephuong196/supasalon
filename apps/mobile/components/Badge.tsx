import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../lib/theme";

type BadgeVariant =
  | "paid"
  | "pending"
  | "cancelled"
  | "confirmed"
  | "completed"
  | "checkin"
  | "owner"
  | "admin"
  | "member"
  | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: string;
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  paid: colors.paid,
  pending: colors.pending,
  cancelled: colors.cancelled,
  confirmed: colors.confirmed,
  completed: colors.completed,
  checkin: colors.checkin,
  owner: colors.owner,
  admin: colors.admin,
  member: colors.member,
  default: { bg: colors.borderLight, text: colors.textSecondary },
};

export default function Badge({ variant = "default", children, style }: BadgeProps) {
  const variantStyle = variantStyles[variant] || variantStyles.default;

  return (
    <View style={[styles.container, { backgroundColor: variantStyle.bg }, style]}>
      <Text style={[styles.text, { color: variantStyle.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
