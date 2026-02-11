import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react-native";
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Badge from "../../../components/Badge";
import CardMenu from "../../../components/CardMenu";
import EmptyState from "../../../components/EmptyState";
import FilterChips from "../../../components/FilterChips";
import FloatingAddButton from "../../../components/FloatingAddButton";
import SearchBar from "../../../components/SearchBar";
import api from "../../../lib/api";
import { borderRadius, colors, fontSize, fontWeight, spacing } from "../../../lib/theme";

interface Employee {
  id: number;
  user?: { name: string; email: string; image?: string };
  role: "owner" | "admin" | "member";
}

const roleLabels: Record<string, string> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị viên",
  member: "Thành viên",
};

const roleFilters = [
  { id: "all", label: "Tất cả" },
  { id: "owner", label: "Chủ sở hữu" },
  { id: "admin", label: "Quản trị viên" },
  { id: "member", label: "Thành viên" },
];

const avatarColors = [colors.primary, "#9333ea", "#ec4899", "#3b82f6", "#22c55e"];

export default function EmployeesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  // Use React Query for employees
  const {
    data: employees = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => api.getMembers(),
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      // Role filter
      if (roleFilter && roleFilter !== "all" && employee.role !== roleFilter) {
        return false;
      }

      // Search filter
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const name = employee.user?.name || "";
      const email = employee.user?.email || "";
      return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
    });
  }, [employees, searchQuery, roleFilter]);

  const handleEdit = (id: number) => {
    Alert.alert("Chỉnh sửa", `Chỉnh sửa nhân viên #${id}`);
  };

  const handleDelete = (id: number) => {
    Alert.alert("Xác nhận xóa", "Bạn có chắc chắn muốn xóa nhân viên này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          console.log("Delete employee:", id);
        },
      },
    ]);
  };

  const handleAdd = () => {
    Alert.alert("Thêm mới", "Thêm nhân viên mới");
  };

  const renderEmployee = ({ item, index }: { item: Employee; index: number }) => {
    const name = item.user?.name || "Unknown";
    const email = item.user?.email || "No email";
    const avatarColor = avatarColors[index % avatarColors.length];

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: avatarColor + "20" }]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>{getInitials(name)}</Text>
          </View>
          <View style={styles.cardTitleSection}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.name}>{name}</Text>
              <CardMenu onEdit={() => handleEdit(item.id)} onDelete={() => handleDelete(item.id)} />
            </View>
            <View style={styles.emailRow}>
              <Mail size={12} color={colors.textMuted} />
              <Text style={styles.email} numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Badge variant={item.role as any}>{roleLabels[item.role] || item.role}</Badge>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with search and filters */}
      <View style={styles.header}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm kiếm nhân viên..."
        />
      </View>
      <View style={styles.filterContainer}>
        <FilterChips chips={roleFilters} selectedId={roleFilter} onSelect={setRoleFilter} />
      </View>
      <Text style={styles.count}>{filteredEmployees.length} nhân viên</Text>

      <FlatList
        data={filteredEmployees}
        renderItem={renderEmployee}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            type="employees"
            message={searchQuery ? "Không tìm thấy nhân viên" : undefined}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.borderLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.borderLight,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  filterContainer: {
    backgroundColor: colors.background,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  count: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  cardTitleSection: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.success,
  },
});
