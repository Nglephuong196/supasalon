import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Pressable,
} from 'react-native';
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../lib/theme';

interface CardMenuProps {
    onEdit?: () => void;
    onDelete?: () => void;
}

export default function CardMenu({ onEdit, onDelete }: CardMenuProps) {
    const [visible, setVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef<View>(null);

    const openMenu = () => {
        buttonRef.current?.measureInWindow((x, y, width, height) => {
            setMenuPosition({ top: y + height + 4, right: 16 });
            setVisible(true);
        });
    };

    const handleEdit = () => {
        setVisible(false);
        onEdit?.();
    };

    const handleDelete = () => {
        setVisible(false);
        onDelete?.();
    };

    return (
        <>
            <TouchableOpacity
                ref={buttonRef}
                style={styles.menuButton}
                onPress={openMenu}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <MoreHorizontal size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
                    <View style={[styles.menu, { top: menuPosition.top, right: menuPosition.right }]}>
                        {onEdit && (
                            <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                                <Edit2 size={16} color={colors.text} />
                                <Text style={styles.menuItemText}>Chỉnh sửa</Text>
                            </TouchableOpacity>
                        )}
                        {onDelete && (
                            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                                <Trash2 size={16} color={colors.error} />
                                <Text style={[styles.menuItemText, { color: colors.error }]}>Xóa</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    menuButton: {
        padding: spacing.xs,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    menu: {
        position: 'absolute',
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        minWidth: 140,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.sm,
    },
    menuItemText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.text,
    },
});
