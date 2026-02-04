import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Receipt } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../lib/theme';

export default function CreateInvoiceScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Receipt size={48} color={colors.success} />
                </View>
                <Text style={styles.title}>Tạo hóa đơn</Text>
                <Text style={styles.subtitle}>Tính năng đang phát triển</Text>
                <Text style={styles.description}>
                    Tính năng tạo hóa đơn mới sẽ cho phép bạn thêm dịch vụ, sản phẩm, áp dụng khuyến mãi và thanh toán ngay trên điện thoại.
                </Text>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.successLight,
        justifyContent: 'center',
        alignItems: 'center',
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
        color: colors.success,
        marginBottom: spacing.lg,
    },
    description: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        textAlign: 'center',
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
        color: '#fff',
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
});
