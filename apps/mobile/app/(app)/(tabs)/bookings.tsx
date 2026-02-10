import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Clock } from "lucide-react-native";
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

interface Booking {
  id: number;
  date: string;
  customer?: { name: string; phone?: string };
  guestCount: number;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "checkin";
  notes?: string;
  services?: { name: string }[];
}

const statusLabels: Record<string, string> = {
  confirmed: "Đã xác nhận",
  pending: "Chờ xác nhận",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  checkin: "Đã check-in",
};

const statusFilters = [
  { id: "all", label: "Tất cả" },
  { id: "pending", label: "Chờ xác nhận" },
  { id: "confirmed", label: "Đã xác nhận" },
  { id: "completed", label: "Hoàn thành" },
  { id: "cancelled", label: "Đã hủy" },
];

export default function BookingsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Use React Query for bookings
  const {
    data: bookings = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery<Booking[]>({
    queryKey: ["bookings"],
    queryFn: () => api.getBookings({ simple: "true" }),
  });

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const generateCode = (id: number) => `LH${String(id).padStart(6, "0")}`;

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      // Status filter
      if (statusFilter && statusFilter !== "all" && booking.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        booking.id.toString().includes(query) ||
        booking.customer?.name?.toLowerCase().includes(query) ||
        booking.customer?.phone?.toLowerCase().includes(query)
      );
    });
  }, [bookings, searchQuery, statusFilter]);

  const handleEdit = (id: number) => {
    // Navigate to edit screen
    Alert.alert("Chỉnh sửa", `Chỉnh sửa lịch hẹn #${id}`);
  };

  const handleDelete = (id: number) => {
    Alert.alert("Xác nhận xóa", "Bạn có chắc chắn muốn xóa lịch hẹn này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          // Delete booking
          console.log("Delete booking:", id);
        },
      },
    ]);
  };

  const handleAdd = () => {
    router.push("/(app)/(tabs)/create-booking");
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.customerName}>{item.customer?.name || "Khách vãng lai"}</Text>
          <CardMenu onEdit={() => handleEdit(item.id)} onDelete={() => handleDelete(item.id)} />
        </View>
        <Text style={styles.code}>{generateCode(item.id)}</Text>
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Clock size={14} color={colors.textMuted} />
          <Text style={styles.infoText}>
            {formatDate(item.date)} | {formatTime(item.date)}
          </Text>
        </View>
        {item.customer?.phone && <Text style={styles.phone}>{item.customer.phone}</Text>}
      </View>

      <View style={styles.cardFooter}>
        {item.guestCount > 1 && <Text style={styles.guestCount}>{item.guestCount} khách</Text>}
        <View style={{ flex: 1 }} />
        <Badge variant={item.status as any}>{statusLabels[item.status] || item.status}</Badge>
      </View>
    </View>
  );

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
          placeholder="Tìm kiếm lịch hẹn..."
        />
      </View>
      <View style={styles.filterContainer}>
        <FilterChips chips={statusFilters} selectedId={statusFilter} onSelect={setStatusFilter} />
      </View>

      <FlatList
        data={filteredBookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={<EmptyState type="bookings" message="Không có lịch hẹn nào" />}
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
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    marginBottom: spacing.sm,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  customerName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  code: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  cardInfo: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  phone: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  guestCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
