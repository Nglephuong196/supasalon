import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { borderRadius, colors, fontSize, fontWeight, spacing } from "../lib/theme";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  iconBgColor?: string;
  trend?: "up" | "down";
  trendValue?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBgColor = colors.primaryLight + "20",
  trend,
  trendValue,
}: StatsCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>{icon}</View>
        )}
      </View>
      {trend && trendValue && (
        <View style={styles.trendContainer}>
          <Text
            style={[styles.trendText, { color: trend === "up" ? colors.success : colors.error }]}
          >
            {trend === "up" ? "↑" : "↓"} {trendValue}
          </Text>
          <Text style={styles.trendLabel}>so với kỳ trước</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  iconContainer: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  trendText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  trendLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
