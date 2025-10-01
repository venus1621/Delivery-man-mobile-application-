import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Icons from 'lucide-react-native';
import { useAuth } from '../../providers/auth-provider';
import { useDelivery } from '../../providers/delivery-provider';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isOnline, toggleOnlineStatus, clearDeliveryData } = useDelivery();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const renderIcon = (name, props = {}) => {
    // eslint-disable-next-line import/namespace
    const Comp = Icons[name];
    if (Comp) return <Comp {...props} />;
    const size = props.size || 20;
    return <View style={{ width: size, height: size }} />;
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Starting logout process...');
              
              // Clear delivery data first
              await clearDeliveryData();
              console.log('✅ Delivery data cleared');
              
              // Then logout
              await logout();
              console.log('✅ Logout completed');
              
            } catch (error) {
              console.error('❌ Error during logout:', error);
            }
          },
        },
      ]
    );
  };

  const getDeliveryMethodIcon = (method, iconColor = '#6b7280') => {
    const render = (name) => renderIcon(name, { color: iconColor, size: 20 });
    switch (method?.toLowerCase()) {
      case 'car':
        return render('Car');
      case 'motor':
      case 'motorcycle':
        return render('Motorcycle');
      case 'bicycle':
      case 'bike':
        return render('Bike');
      default:
        return render('Truck');
    }
  };

  const getDeliveryMethodName = (method) => {
    switch (method?.toLowerCase()) {
      case 'car':
        return 'Car Delivery';
      case 'motor':
      case 'motorcycle':
        return 'Motorcycle Delivery';
      case 'bicycle':
      case 'bike':
        return 'Bicycle Delivery';
      default:
        return 'Standard Delivery';
    }
  };

  const profileData = {
    name: user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : 'John Doe',
    email: user?.email || 'john.doe@example.com',
    phone: user?.phone || '+251 91 234 5678',
    location: user?.location || 'Addis Ababa, Ethiopia',
    rating: 4.8,
    totalDeliveries: 342,
    memberSince: 'January 2025',
    verified: user?.isPhoneVerified || true,
    deliveryMethod: user?.deliveryMethod || 'car',
  };

  const userRole = user?.role === 'Delivery_Person' ? 'Delivery Driver' : user?.role || 'Delivery Driver';

  const menuItems = [
    {
      icon: Icons.Wifi,
      label: 'Availability',
      color: '#10b981',
      rightComponent: (
        <Switch
          value={isOnline}
          onValueChange={toggleOnlineStatus}
          trackColor={{ false: '#E5E7EB', true: '#10b981' }}
          thumbColor="#FFFFFF"
        />
      ),
    },
    {
      icon: Icons.Edit3,
      label: 'Edit Profile',
      color: '#667eea',
      onPress: () => Alert.alert('Coming Soon', 'Profile editing will be available in a future update'),
    },
    {
      icon: Icons.Bell,
      label: 'Notifications',
      color: '#f59e0b',
      rightComponent: (
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: '#E5E7EB', true: '#f59e0b' }}
          thumbColor="#FFFFFF"
        />
      ),
    },
    {
      icon: Icons.Shield,
      label: 'Privacy & Security',
      color: '#10b981',
      onPress: () => Alert.alert('Coming Soon', 'Privacy and security settings will be available soon'),
    },
    {
      icon: Icons.Award,
      label: 'Achievements',
      color: '#ec4899',
      onPress: () => Alert.alert(
        'Achievements',
        `Your Rating: ${profileData.rating}\nTotal Deliveries: ${profileData.totalDeliveries}`
      ),
    },
    {
      icon: Icons.Settings,
      label: 'Settings',
      color: '#6b7280',
      onPress: () => Alert.alert(
        'Coming Soon',
        'Settings including delivery preferences and working areas will be available soon'
      ),
    },
    {
      icon: Icons.LogOut,
      label: 'Sign Out',
      color: '#ef4444',
      onPress: handleLogout,
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            

            {/* Profile Card */}
            <View style={styles.profileCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                style={styles.profileGradient}
              >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  {user?.profilePicture ? (
                    <Image
                      source={{ uri: user.profilePicture }}
                      style={styles.avatar}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.avatar}
                    >
                      {renderIcon('User', { color: '#FFFFFF', size: 40 })}
                    </LinearGradient>
                  )}
                  {profileData.verified && (
                    <View style={styles.verifiedBadge}>
                      {renderIcon('Shield', { color: '#10b981', size: 20 })}
                    </View>
                  )}
                </View>

                {/* Profile Info */}
                <Text style={styles.profileName}>{profileData.name}</Text>
                <Text style={styles.memberSince}>
                  {userRole} • Member since {profileData.memberSince}
                </Text>
                <View style={styles.userStatus}>
                  <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
                  <Text style={styles.statusText}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                      {renderIcon('Star', { color: '#f59e0b', size: 20 })}
                    </View>
                    <Text style={styles.statValue}>{profileData.rating}</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: 'rgba(102, 126, 234, 0.1)' }]}>
                      {renderIcon('Award', { color: '#667eea', size: 20 })}
                    </View>
                    <Text style={styles.statValue}>{profileData.totalDeliveries}</Text>
                    <Text style={styles.statLabel}>Deliveries</Text>
                  </View>
                </View>

                {/* Contact Info */}
                <View style={styles.contactInfo}>
                  <View style={styles.contactItem}>
                    {renderIcon('Mail', { color: '#6b7280', size: 16 })}
                    <Text style={styles.contactText}>{profileData.email}</Text>
                  </View>
                  <View style={styles.contactItem}>
                    {renderIcon('Phone', { color: '#6b7280', size: 16 })}
                    <Text style={styles.contactText}>{profileData.phone}</Text>
                  </View>
                  <View style={styles.contactItem}>
                    {renderIcon('MapPin', { color: '#6b7280', size: 16 })}
                    <Text style={styles.contactText}>{profileData.location}</Text>
                  </View>
                  <View style={styles.contactItem}>
                    {getDeliveryMethodIcon(profileData.deliveryMethod, '#6b7280')}
                    <Text style={styles.contactText}>{getDeliveryMethodName(profileData.deliveryMethod)}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.menuItem}
                    onPress={item.onPress || (() => {})}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuLeft}>
                      <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                        <Icon color={item.color} size={20} />
                      </View>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                    </View>
                    {item.rightComponent || renderIcon('ChevronRight', { color: '#9ca3af', size: 20 })}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  profileGradient: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineDot: {
    backgroundColor: '#10b981',
  },
  offlineDot: {
    backgroundColor: '#6b7280',
  },
  statusText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 20,
  },
  contactInfo: {
    width: '100%',
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#4b5563',
  },
  menuContainer: {
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
});