import { Plus } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { colors, spacing } from "../lib/theme";

interface FloatingAddButtonProps {
  onPress: () => void;
}

export default function FloatingAddButton({ onPress }: FloatingAddButtonProps) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.85}>
      <Plus size={28} color="#fff" strokeWidth={2.5} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
