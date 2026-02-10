import { router } from "expo-router";
import { UserPlus } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, fontSize, fontWeight, spacing } from "../../../lib/theme";

export default function CreateCustomerScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <UserPlus size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>Tạo khách hàng</Text>
        <Text style={styles.subtitle}>Tính năng đang phát triển</Text>
        <Text style={styles.description}>
          Tính năng thêm khách hàng mới sẽ cho phép bạn nhập thông tin cá nhân, phân loại VIP và lưu
          trữ lịch sử giao dịch.
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
    backgroundColor: colors.primaryLight + "30",
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
    color: colors.primary,
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
