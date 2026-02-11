import { Tabs, router, usePathname } from "expo-router";
import { Calendar, CalendarPlus, FileText, Home, Menu, Plus, Receipt } from "lucide-react-native";
import React, { useState } from "react";
import { Animated, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, fontSize, fontWeight, spacing } from "../../../lib/theme";

// Custom center button component with speed dial
function CenterButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const isCustomerScreen = pathname?.includes("/customers");
  const isEmployeeScreen = pathname?.includes("/employees");

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
    setIsOpen(!isOpen);
  };

  const handlePress = () => {
    if (isCustomerScreen) {
      router.push("/(app)/(tabs)/create-customer");
    } else if (isEmployeeScreen) {
      router.push("/(app)/(tabs)/create-employee");
    } else {
      toggleMenu();
    }
  };

  const handleAction = (action: "booking" | "invoice") => {
    toggleMenu();
    if (action === "booking") {
      router.push("/(app)/(tabs)/create-booking");
    } else {
      router.push("/(app)/(tabs)/create-invoice");
    }
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const action1TranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -70],
  });

  const action2TranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -130],
  });

  const actionScale = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <Pressable style={styles.backdrop} onPress={toggleMenu}>
          <Animated.View style={[styles.backdropInner, { opacity: backdropOpacity }]} />
        </Pressable>
      )}

      {/* Speed dial actions */}
      <View style={styles.speedDialContainer} pointerEvents="box-none">
        {/* Create Invoice */}
        <Animated.View
          style={[
            styles.actionButton,
            {
              transform: [{ translateY: action2TranslateY }, { scale: actionScale }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.actionButtonInner, { backgroundColor: colors.success }]}
            onPress={() => handleAction("invoice")}
            activeOpacity={0.8}
          >
            <Receipt size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Hóa đơn</Text>
        </Animated.View>

        {/* Create Booking */}
        <Animated.View
          style={[
            styles.actionButton,
            {
              transform: [{ translateY: action1TranslateY }, { scale: actionScale }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.actionButtonInner, { backgroundColor: colors.info }]}
            onPress={() => handleAction("booking")}
            activeOpacity={0.8}
          >
            <CalendarPlus size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Lịch hẹn</Text>
        </Animated.View>

        {/* Main FAB */}
        <TouchableOpacity style={styles.fabButton} onPress={handlePress} activeOpacity={0.9}>
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Plus size={28} color="#fff" strokeWidth={2.5} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Tổng quan",
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: "Lịch hẹn",
            tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
          }}
        />
        {/* Placeholder for center button */}
        <Tabs.Screen
          name="create"
          options={{
            title: "",
            tabBarButton: () => null, // Hide default button
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault(); // Prevent navigation
            },
          }}
        />
        <Tabs.Screen
          name="invoices"
          options={{
            title: "Hóa đơn",
            tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: "Thêm",
            tabBarIcon: ({ color, size }) => <Menu size={size} color={color} />,
          }}
        />
        {/* Hidden screens accessible from More menu */}
        <Tabs.Screen
          name="customers"
          options={{
            href: null,
            title: "Khách hàng",
          }}
        />
        <Tabs.Screen
          name="employees"
          options={{
            href: null,
            title: "Nhân viên",
          }}
        />
        <Tabs.Screen
          name="report"
          options={{
            href: null,
            title: "Báo cáo",
          }}
        />
        {/* Services & Products screens */}
        <Tabs.Screen
          name="services"
          options={{
            href: null,
            title: "Dịch vụ",
          }}
        />
        <Tabs.Screen
          name="service-categories"
          options={{
            href: null,
            title: "Danh mục dịch vụ",
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            href: null,
            title: "Sản phẩm",
          }}
        />
        <Tabs.Screen
          name="product-categories"
          options={{
            href: null,
            title: "Danh mục sản phẩm",
          }}
        />
        {/* Quick create screens */}
        <Tabs.Screen
          name="create-booking"
          options={{
            href: null,
            title: "Tạo lịch hẹn",
          }}
        />
        <Tabs.Screen
          name="create-invoice"
          options={{
            href: null,
            title: "Tạo hóa đơn",
          }}
        />
        <Tabs.Screen
          name="create-customer"
          options={{
            href: null,
            title: "Tạo khách hàng",
          }}
        />
        <Tabs.Screen
          name="create-employee"
          options={{
            href: null,
            title: "Thêm nhân viên",
          }}
        />
      </Tabs>

      {/* Center FAB Button */}
      <CenterButton />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdropInner: {
    flex: 1,
    backgroundColor: "#000",
  },
  speedDialContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 101,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButton: {
    position: "absolute",
    alignItems: "center",
    flexDirection: "row",
  },
  actionButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionLabel: {
    position: "absolute",
    right: 60,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
