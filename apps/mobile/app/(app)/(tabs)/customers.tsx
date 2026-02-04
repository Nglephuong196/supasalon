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
import { Phone, Crown, Mail } from 'lucide-react-native';
import api from '../../../lib/api';
import SearchBar from '../../../components/SearchBar';
import FilterChips from '../../../components/FilterChips';
import CardMenu from '../../../components/CardMenu';
import FloatingAddButton from '../../../components/FloatingAddButton';
import Badge from '../../../components/Badge';
import EmptyState from '../../../components/EmptyState';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../../lib/theme';

interface Customer {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    gender?: string;
    location?: string;
    membershipTier?: { name: string };
    totalSpent?: number;
}

const avatarGradients = [
    '#9333ea',
    '#ec4899',
    '#3b82f6',
    '#22c55e',
    '#f97316',
];

const membershipFilters = [
    { id: 'all', label: 'Tất cả' },
    { id: 'vip', label: 'VIP' },
    { id: 'regular', label: 'Thường' },
];

export default function CustomersScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [membershipFilter, setMembershipFilter] = useState<string | null>(null);

    // Use React Query for customers
    const {
        data: customers = [],
        isLoading,
        refetch,
        isFetching,
    } = useQuery<Customer[]>({
        queryKey: ['customers'],
        queryFn: () => api.getCustomers(),
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter(customer => {
            // Membership filter
            if (membershipFilter === 'vip' && !customer.membershipTier) {
                return false;
            }
            if (membershipFilter === 'regular' && customer.membershipTier) {
                return false;
            }

            // Search filter
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                customer.name.toLowerCase().includes(query) ||
                customer.phone?.toLowerCase().includes(query) ||
                customer.email?.toLowerCase().includes(query)
            );
        });
    }, [customers, searchQuery, membershipFilter]);

    const handleEdit = (id: number) => {
        Alert.alert('Chỉnh sửa', `Chỉnh sửa khách hàng #${id}`);
    };

    const handleDelete = (id: number) => {
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa khách hàng này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa', style: 'destructive', onPress: () => {
                        console.log('Delete customer:', id);
                    }
                },
            ]
        );
    };

    const handleAdd = () => {
        // Navigate to create customer screen
        Alert.alert('Thêm mới', 'Tạo khách hàng mới');
    };

    const renderCustomer = ({ item, index }: { item: Customer; index: number }) => {
        const avatarColor = avatarGradients[index % avatarGradients.length];

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                    </View>
                    <View style={styles.cardTitleSection}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.name}>{item.name}</Text>
                            <CardMenu
                                onEdit={() => handleEdit(item.id)}
                                onDelete={() => handleDelete(item.id)}
                            />
                        </View>
                        {item.membershipTier && (
                            <View style={styles.vipBadge}>
                                <Crown size={10} color="#fff" />
                                <Text style={styles.vipText}>{item.membershipTier.name}</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.cardInfo}>
                    {item.phone && (
                        <View style={styles.infoRow}>
                            <Phone size={14} color={colors.textMuted} />
                            <Text style={styles.infoText}>{item.phone}</Text>
                        </View>
                    )}
                    {item.email && (
                        <View style={styles.infoRow}>
                            <Mail size={14} color={colors.textMuted} />
                            <Text style={styles.infoText} numberOfLines={1}>{item.email}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.spentLabel}>Chi tiêu</Text>
                    <Text style={styles.spent}>{formatCurrency(item.totalSpent || 0)}</Text>
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
                    placeholder="Tìm kiếm khách hàng..."
                />
            </View>
            <View style={styles.filterContainer}>
                <FilterChips
                    chips={membershipFilters}
                    selectedId={membershipFilter}
                    onSelect={setMembershipFilter}
                />
            </View>

            <FlatList
                data={filteredCustomers}
                renderItem={renderCustomer}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={isFetching} onRefresh={refetch} />
                }
                ListEmptyComponent={
                    <EmptyState
                        type="customers"
                        message={searchQuery ? 'Không tìm thấy khách hàng' : undefined}
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
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
    },
    cardTitleSection: {
        flex: 1,
        marginLeft: spacing.md,
    },
    cardTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    name: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        flex: 1,
    },
    vipBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f97316',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        gap: 2,
        alignSelf: 'flex-start',
        marginTop: spacing.xs,
    },
    vipText: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.medium,
        color: '#fff',
    },
    cardInfo: {
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    infoText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
    },
    spentLabel: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
    spent: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },
});
