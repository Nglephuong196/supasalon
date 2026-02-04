import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import api from '../../../lib/api';
import SearchBar from '../../../components/SearchBar';
import FilterChips from '../../../components/FilterChips';
import CardMenu from '../../../components/CardMenu';
import FloatingAddButton from '../../../components/FloatingAddButton';
import Badge from '../../../components/Badge';
import EmptyState from '../../../components/EmptyState';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../../lib/theme';

interface Invoice {
    id: number;
    customerId: number;
    customer?: { name: string };
    total: number;
    status: 'paid' | 'pending' | 'cancelled';
    createdAt: string;
}

const statusLabels: Record<string, string> = {
    paid: 'Đã thanh toán',
    pending: 'Chờ thanh toán',
    cancelled: 'Đã hủy',
};

const statusFilters = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ thanh toán' },
    { id: 'paid', label: 'Đã thanh toán' },
    { id: 'cancelled', label: 'Đã hủy' },
];

export default function InvoicesScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Use React Query for invoices
    const {
        data: invoices = [],
        isLoading,
        refetch,
        isFetching,
    } = useQuery<Invoice[]>({
        queryKey: ['invoices'],
        queryFn: () => api.getInvoices(),
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            // Status filter
            if (statusFilter && statusFilter !== 'all' && invoice.status !== statusFilter) {
                return false;
            }

            // Search filter
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                invoice.id.toString().includes(query) ||
                invoice.customer?.name?.toLowerCase().includes(query)
            );
        });
    }, [invoices, searchQuery, statusFilter]);

    const handleEdit = (id: number) => {
        Alert.alert('Chỉnh sửa', `Chỉnh sửa hóa đơn #${id}`);
    };

    const handleDelete = (id: number) => {
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa hóa đơn này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa', style: 'destructive', onPress: () => {
                        console.log('Delete invoice:', id);
                    }
                },
            ]
        );
    };

    const handleAdd = () => {
        router.push('/(app)/(tabs)/create-invoice');
    };

    const renderInvoice = ({ item }: { item: Invoice }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                    <Text style={styles.customerName}>
                        {item.customer?.name || 'Khách vãng lai'}
                    </Text>
                    <CardMenu
                        onEdit={() => handleEdit(item.id)}
                        onDelete={() => handleDelete(item.id)}
                    />
                </View>
                <Text style={styles.invoiceId}>Hóa đơn #{item.id}</Text>
            </View>

            <View style={styles.cardInfo}>
                <View style={styles.infoRow}>
                    <Calendar size={14} color={colors.textMuted} />
                    <Text style={styles.infoText}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text style={styles.total}>{formatCurrency(item.total)}</Text>
            </View>

            <View style={styles.cardFooter}>
                <Badge variant={item.status}>
                    {statusLabels[item.status] || item.status}
                </Badge>
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
                    placeholder="Tìm mã HĐ, tên khách..."
                />
            </View>
            <View style={styles.filterContainer}>
                <FilterChips
                    chips={statusFilters}
                    selectedId={statusFilter}
                    onSelect={setStatusFilter}
                />
            </View>

            <FlatList
                data={filteredInvoices}
                renderItem={renderInvoice}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={isFetching} onRefresh={refetch} />
                }
                ListEmptyComponent={
                    <EmptyState
                        type="invoices"
                        message={searchQuery ? 'Không tìm thấy hóa đơn' : undefined}
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
        justifyContent: 'center',
        alignItems: 'center',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        marginBottom: spacing.sm,
    },
    cardTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    customerName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        flex: 1,
    },
    invoiceId: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
    cardInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    infoText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    total: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
