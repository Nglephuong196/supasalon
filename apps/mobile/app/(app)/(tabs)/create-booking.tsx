import { router } from "expo-router";
import { CalendarPlus } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, fontSize, fontWeight, spacing } from "../../../lib/theme";

export default function CreateBookingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CalendarPlus size={48} color={colors.info} />
        </View>
        <Text style={styles.title}>Tạo lịch hẹn</Text>
        <Text style={styles.subtitle}>Tính năng đang phát triển</Text>
        <Text style={styles.description}>
          Tính năng tạo lịch hẹn mới sẽ cho phép bạn đặt lịch cho khách hàng, chọn dịch vụ, nhân
          viên phụ trách và thời gian hẹn.
        </Text>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
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
    backgroundColor: colors.infoLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
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
    color: colors.info,
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    color: "#fff",
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
