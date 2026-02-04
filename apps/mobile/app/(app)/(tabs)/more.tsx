import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import {
    Users,
    UserCog,
    Scissors,
    FolderTree,
    Package,
    Boxes,
    ChevronRight,
    LogOut,
    BarChart3,
} from 'lucide-react-native';
import { signOut } from '../../../lib/auth-client';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../../lib/theme';

interface MenuItem {
    id: string;
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    route?: string;
    action?: () => void;
    color?: string;
}

const menuSections = [
    {
        title: 'Quản lý',
        items: [
            {
                id: 'customers',
                title: 'Khách hàng',
                subtitle: 'Quản lý danh sách khách hàng',
                icon: <Users size={22} color={colors.primary} />,
                route: '/(app)/(tabs)/customers',
            },
            {
                id: 'employees',
                title: 'Nhân viên',
                subtitle: 'Quản lý nhân viên salon',
                icon: <UserCog size={22} color={colors.info} />,
                route: '/(app)/(tabs)/employees',
            },
            {
                id: 'report',
                title: 'Báo cáo',
                subtitle: 'Xem thống kê và báo cáo',
                icon: <BarChart3 size={22} color="#8b5cf6" />,
                route: '/(app)/(tabs)/report',
            },
        ],
    },
    {
        title: 'Dịch vụ & Sản phẩm',
        items: [
            {
                id: 'service-categories',
                title: 'Danh mục dịch vụ',
                subtitle: 'Phân loại các dịch vụ',
                icon: <FolderTree size={22} color={colors.warning} />,
                route: '/(app)/(tabs)/service-categories',
            },
            {
                id: 'services',
                title: 'Dịch vụ',
                subtitle: 'Quản lý dịch vụ salon',
                icon: <Scissors size={22} color="#ec4899" />,
                route: '/(app)/(tabs)/services',
            },
            {
                id: 'product-categories',
                title: 'Danh mục sản phẩm',
                subtitle: 'Phân loại sản phẩm',
                icon: <Boxes size={22} color={colors.success} />,
                route: '/(app)/(tabs)/product-categories',
            },
            {
                id: 'products',
                title: 'Sản phẩm',
                subtitle: 'Quản lý sản phẩm bán',
                icon: <Package size={22} color="#6366f1" />,
                route: '/(app)/(tabs)/products',
            },
        ],
    },
];

export default function MoreScreen() {
    const handleLogout = async () => {
        await signOut();
        router.replace('/(auth)/login');
    };

    const handleMenuPress = (item: MenuItem) => {
        if (item.action) {
            item.action();
        } else if (item.route) {
            router.push(item.route as any);
        }
    };

    return (
        <ScrollView style={styles.container}>
            {menuSections.map((section) => (
                <View key={section.title} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <View style={styles.card}>
                        {section.items.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.menuItem,
                                    index < section.items.length - 1 && styles.menuItemBorder,
                                ]}
                                onPress={() => handleMenuPress(item)}
                            >
                                <View style={styles.menuIconContainer}>
                                    {item.icon}
                                </View>
                                <View style={styles.menuContent}>
                                    <Text style={styles.menuTitle}>{item.title}</Text>
                                    {item.subtitle && (
                                        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                                    )}
                                </View>
                                <ChevronRight size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ))}

            {/* Logout Section */}
            <View style={styles.section}>
                <View style={styles.card}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleLogout}
                    >
                        <View style={[styles.menuIconContainer, { backgroundColor: colors.errorLight }]}>
                            <LogOut size={22} color={colors.error} />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={[styles.menuTitle, { color: colors.error }]}>
                                Đăng xuất
                            </Text>
                        </View>
                        <ChevronRight size={20} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.footer} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.borderLight,
    },
    section: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    menuTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
        color: colors.text,
    },
    menuSubtitle: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },
    footer: {
        height: spacing.xl * 2,
    },
});
