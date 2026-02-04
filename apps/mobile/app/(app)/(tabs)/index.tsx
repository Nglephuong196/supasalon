import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
    DollarSign,
    Calendar,
    Users,
    TrendingUp,
    Plus,
    Clock,
    LogOut
} from 'lucide-react-native';
import { signOut } from '../../../lib/auth-client';
import api from '../../../lib/api';
import StatsCard from '../../../components/StatsCard';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../../lib/theme';

interface DashboardStats {
    totalRevenue: number;
    todayAppointments: number;
    newCustomers: number;
    avgInvoice: number;
}

interface Booking {
    id: number;
    date: string;
    customer?: { name: string };
    status: string;
}

export default function DashboardScreen() {
    // Use React Query for stats
    const {
        data: stats,
        isLoading: statsLoading,
        refetch: refetchStats,
    } = useQuery<DashboardStats>({
        queryKey: ['dashboardStats'],
        queryFn: () => api.getDashboardStats(),
    });

    // Use React Query for today's bookings
    const {
        data: todayBookings = [],
        isLoading: bookingsLoading,
        refetch: refetchBookings,
    } = useQuery<Booking[]>({
        queryKey: ['todayBookings'],
        queryFn: async () => {
            const bookings = await api.getTodayBookings();
            return bookings.slice(0, 5); // Show max 5
        },
    });

    const isLoading = statsLoading || bookingsLoading;

    const onRefresh = async () => {
        await Promise.all([refetchStats(), refetchBookings()]);
    };

    const handleLogout = async () => {
        await signOut();
        router.replace('/(auth)/login');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getFormattedDate = () => {
        return new Date().toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={false} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Tổng quan</Text>
                    <Text style={styles.date}>{getFormattedDate()}</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.newBookingButton}
                        onPress={() => router.push('/(app)/(tabs)/bookings')}
                    >
                        <Plus size={18} color="#fff" />
                        <Text style={styles.newBookingText}>Đặt lịch</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <LogOut size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsGrid}>
                <View style={styles.statsRow}>
                    <View style={styles.statsCardWrapper}>
                        <StatsCard
                            title="Tổng doanh thu"
                            value={formatCurrency(stats?.totalRevenue || 0)}
                            icon={<DollarSign size={20} color={colors.success} />}
                            iconBgColor={colors.successLight}
                        />
                    </View>
                    <View style={styles.statsCardWrapper}>
                        <StatsCard
                            title="Cuộc hẹn hôm nay"
                            value={stats?.todayAppointments || 0}
                            icon={<Calendar size={20} color={colors.info} />}
                            iconBgColor={colors.infoLight}
                        />
                    </View>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.statsCardWrapper}>
                        <StatsCard
                            title="Khách hàng"
                            value={stats?.newCustomers || 0}
                            icon={<Users size={20} color={colors.primary} />}
                            iconBgColor={colors.primaryLight + '30'}
                        />
                    </View>
                    <View style={styles.statsCardWrapper}>
                        <StatsCard
                            title="HĐ trung bình"
                            value={formatCurrency(stats?.avgInvoice || 0)}
                            icon={<TrendingUp size={20} color={colors.warning} />}
                            iconBgColor={colors.warningLight}
                        />
                    </View>
                </View>
            </View>

            {/* Today's Schedule */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Lịch hẹn hôm nay</Text>
                <View style={styles.scheduleCard}>
                    {todayBookings.length === 0 ? (
                        <View style={styles.emptySchedule}>
                            <Calendar size={24} color={colors.textMuted} />
                            <Text style={styles.emptyText}>Không có lịch hẹn nào hôm nay</Text>
                        </View>
                    ) : (
                        todayBookings.map((booking, index) => (
                            <View
                                key={booking.id}
                                style={[
                                    styles.scheduleItem,
                                    index < todayBookings.length - 1 && styles.scheduleItemBorder
                                ]}
                            >
                                <View style={styles.scheduleTime}>
                                    <Clock size={14} color={colors.primary} />
                                    <Text style={styles.timeText}>{formatTime(booking.date)}</Text>
                                </View>
                                <Text style={styles.customerName}>
                                    {booking.customer?.name || 'Khách vãng lai'}
                                </Text>
                            </View>
                        ))
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.borderLight,
    },
    content: {
        padding: spacing.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.borderLight,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    date: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    newBookingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    newBookingText: {
        color: '#fff',
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
    },
    logoutButton: {
        padding: spacing.sm,
    },
    statsGrid: {
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    statsCardWrapper: {
        flex: 1,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        marginBottom: spacing.md,
    },
    scheduleCard: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    emptySchedule: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        gap: spacing.sm,
    },
    emptyText: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
    scheduleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    scheduleItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    scheduleTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        width: 80,
    },
    timeText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.text,
    },
    customerName: {
        flex: 1,
        fontSize: fontSize.md,
        color: colors.text,
    },
});
