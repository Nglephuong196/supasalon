import { FolderTree } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, fontWeight, spacing } from "../../../lib/theme";

export default function ServiceCategoriesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FolderTree size={48} color={colors.textMuted} />
        </View>
        <Text style={styles.title}>Danh mục dịch vụ</Text>
        <Text style={styles.subtitle}>Tính năng đang phát triển</Text>
        <Text style={styles.description}>
          Quản lý các nhóm dịch vụ của salon như: Cắt tóc, Nhuộm, Gội đầu, Spa...
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
