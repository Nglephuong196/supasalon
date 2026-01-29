import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { signOut } from '../../lib/auth-client';

export default function DashboardScreen() {
    const handleLogout = async () => {
        await signOut();
        router.replace('/(auth)/login');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Dashboard</Text>
            <TouchableOpacity style={styles.button} onPress={handleLogout}>
                <Text style={styles.buttonText}>Đăng xuất</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 24,
        marginBottom: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    button: {
        backgroundColor: '#9333ea',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
