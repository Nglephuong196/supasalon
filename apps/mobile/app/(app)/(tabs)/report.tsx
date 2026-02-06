import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BarChart3 } from "lucide-react-native";
import { colors, spacing, fontSize, fontWeight } from "../../../lib/theme";

export default function ReportScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <BarChart3 size={48} color={colors.textMuted} />
        </View>
        <Text style={styles.title}>Báo cáo</Text>
        <Text style={styles.subtitle}>Tính năng đang được phát triển</Text>
        <Text style={styles.description}>
          Trang báo cáo sẽ sớm được cập nhật với các biểu đồ doanh thu, thống kê khách hàng và phân
          tích kinh doanh.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.borderLight,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
