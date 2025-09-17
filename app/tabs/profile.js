import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Star,
  Truck,
  Phone,
  Mail
} from 'lucide-react-native';
import { useDelivery } from '../../providers/delivery-provider';
import { useAuth } from '../../providers/auth-provider';

export default function ProfileScreen() {
  const { isOnline, toggleOnlineStatus, orderHistory } = useDelivery();
  const { logout } = useAuth();

  const totalDeliveries = orderHistory.length;
  const totalEarnings = orderHistory.reduce((sum, order) => sum + order.grandTotal, 0);
  const averageRating = 4.8; // Mock rating

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const simulateOrder = () => {
    const mockOrder = {
      orderId: `test_${Date.now()}`,
      order_id: `ORD${Math.floor(Math.random() * 10000)}`,
      restaurantLocation: {
        lat: 40.7128,
        lng: -74.0060,
      },
      deliveryLocation: {
        lat: 40.7589,
        lng: -73.9851,
        address: '123 Test Street, New York, NY 10001',
      },
      deliveryFee: 5.99,
      tip: 3.50,
      grandTotal: 9.49,
      createdAt: new Date().toISOString(),
      status: 'available',
    };
    
    // Simulate receiving a new order
    Alert.alert(
      '🚚 New Delivery Order!',
      `Order ID: ${mockOrder.order_id}\n` +
      `💰 Total: ${(mockOrder.grandTotal || 0).toFixed(2)}\n` +
      `🚗 Delivery Fee: ${(mockOrder.deliveryFee || 0).toFixed(2)}\n` +
      `💵 Tip: ${(mockOrder.tip || 0).toFixed(2)}\n` +
      `📍 Distance: 2.5 km\n` +
      `📍 Delivery to: ${mockOrder.deliveryLocation.address}`,
      [
        {
          text: '❌ Decline',
          style: 'cancel',
        },
        {
          text: '✅ Accept',
          style: 'default',
          onPress: () => {
            Alert.alert('✅ Success', 'Test order accepted! (This is just a simulation)');
          },
        },
      ],
      { cancelable: false }
    );
  };

  const menuItems = [
    { icon: Settings, title: 'Settings', onPress: () => console.log('Settings') },
    { icon: HelpCircle, title: 'Help & Support', onPress: () => console.log('Help') },
    { icon: Truck, title: 'Test Order Popup', onPress: simulateOrder },
    { icon: LogOut, title: 'Logout', onPress: handleLogout, danger: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={['#3B82F6', '#1E40AF']}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User color="#FFFFFF" size={32} />
            </View>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, isOnline ? styles.online : styles.offline]} />
            </View>
          </View>
          
          <Text style={styles.driverName}>Driver Name</Text>
          <Text style={styles.driverId}>ID: 68ac61f8294653916f8406e6</Text>
          
          <TouchableOpacity 
            style={styles.statusButton}
            onPress={toggleOnlineStatus}
          >
            <Text style={styles.statusButtonText}>
              {isOnline ? 'Go Offline' : 'Go Online'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Truck color="#3B82F6" size={24} />
            <Text style={styles.statNumber}>{totalDeliveries}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>
          
          <View style={styles.statItem}>
            <Star color="#F59E0B" size={24} />
            <Text style={styles.statNumber}>{averageRating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statCurrency}>$</Text>
            <Text style={styles.statNumber}>{(totalEarnings || 0).toFixed(0)}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.contactItem}>
            <Phone color="#6B7280" size={20} />
            <Text style={styles.contactText}>+1 (555) 123-4567</Text>
          </View>
          
          <View style={styles.contactItem}>
            <Mail color="#6B7280" size={20} />
            <Text style={styles.contactText}>driver@example.com</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <item.icon 
                  color={item.danger ? "#EF4444" : "#6B7280"} 
                  size={20} 
                />
                <Text style={[
                  styles.menuItemText,
                  item.danger && styles.dangerText
                ]}>
                  {item.title}
                </Text>
              </View>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  online: {
    backgroundColor: '#10B981',
  },
  offline: {
    backgroundColor: '#6B7280',
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  driverId: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  statusButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statCurrency: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#374151',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  dangerText: {
    color: '#EF4444',
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
