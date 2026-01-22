import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function BeneficiaryLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 8,
          shadowOpacity: 0.1,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="qr-code"
        options={{
          title: 'QR Code',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="qr-code" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="document-upload"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="verification-status"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="purchase"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          href: null, // Hide from tabs
        }}
      />
    </Tabs>
  );
}
