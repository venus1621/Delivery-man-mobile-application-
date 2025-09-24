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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Car,
  Motorcycle,
  Bike,
  Truck,
  Settings,
  LogOut,
  Bell,
  Shield,
  HelpCircle,
  Info,
  ChevronRight,
  Edit3
} from 'lucide-react-native';
import { useAuth } from '../../providers/auth-provider';
import { useDelivery } from '../../providers/delivery-provider';

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();
  const { isOnline, toggleOnlineStatus, clearDeliveryData } = useDelivery();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts
    
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
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
              // Still try to logout even if delivery data clearing fails
              try {
                await logout();
              } catch (logoutError) {
                console.error('❌ Logout also failed:', logoutError);
                setIsLoggingOut(false); // Reset state if both fail
              }
            }
          },
        },
      ]
    );
  };

  const getDeliveryMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'car':
        return <Car color="#1E40AF" size={20} />;
      case 'motor':
      case 'motorcycle':
        return <Motorcycle color="#1E40AF" size={20} />;
      case 'bicycle':
      case 'bike':
        return <Bike color="#1E40AF" size={20} />;
      default:
        return <Truck color="#1E40AF" size={20} />;
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

  const ProfileItem = ({ icon, title, value, onPress, showChevron = true }) => (
    <TouchableOpacity 
      style={styles.profileItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileItemLeft}>
        <View style={styles.profileItemIcon}>
          {icon}
        </View>
        <View style={styles.profileItemContent}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {value && <Text style={styles.profileItemValue}>{value}</Text>}
        </View>
      </View>
      {showChevron && onPress && (
        <ChevronRight color="#6B7280" size={20} />
      )}
    </TouchableOpacity>
  );

  const SettingsItem = ({ icon, title, onPress, rightComponent }) => (
    <TouchableOpacity 
      style={styles.settingsItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsItemLeft}>
        <View style={styles.settingsItemIcon}>
          {icon}
        </View>
        <Text style={styles.settingsItemTitle}>{title}</Text>
      </View>
      {rightComponent || (onPress && <ChevronRight color="#6B7280" size={20} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['#1E40AF', '#3B82F6']}
            style={styles.profileGradient}
          >
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                {user?.profilePicture ? (
                  <Image 
                    source={{ uri: user.profilePicture }} 
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User color="#FFFFFF" size={32} />
                  </View>
                )}
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : 'Delivery Driver'
                  }
                </Text>
                <Text style={styles.userRole}>
                  {user?.role === 'Delivery_Person' ? 'Delivery Driver' : user?.role}
                </Text>
                <View style={styles.userStatus}>
                  <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
                  <Text style={styles.statusText}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <ProfileItem
            icon={<Phone color="#6B7280" size={20} />}
            title="Phone Number"
            value={user?.phone || 'Not provided'}
            onPress={() => Alert.alert('Phone', user?.phone || 'Phone number not available')}
          />
          
          <ProfileItem
            icon={<Mail color="#6B7280" size={20} />}
            title="Email Address"
            value={user?.email || 'Not provided'}
            onPress={() => Alert.alert('Email', user?.email || 'Email not available')}
          />
          
          <ProfileItem
            icon={getDeliveryMethodIcon(user?.deliveryMethod)}
            title="Delivery Method"
            value={getDeliveryMethodName(user?.deliveryMethod)}
            onPress={() => Alert.alert('Delivery Method', getDeliveryMethodName(user?.deliveryMethod))}
          />
          
          <ProfileItem
            icon={<Shield color="#6B7280" size={20} />}
            title="Phone Verified"
            value={user?.isPhoneVerified ? 'Verified' : 'Not Verified'}
            onPress={() => Alert.alert(
              'Phone Verification', 
              user?.isPhoneVerified 
                ? 'Your phone number is verified' 
                : 'Your phone number is not verified'
            )}
          />
        </View>

        {/* Work Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Settings</Text>
          
          <View style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <View style={styles.settingsItemIcon}>
                <Bell color="#6B7280" size={20} />
              </View>
              <Text style={styles.settingsItemTitle}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E5E7EB', true: '#1E40AF' }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          
          <SettingsItem
            icon={<Settings color="#6B7280" size={20} />}
            title="Delivery Preferences"
            onPress={() => Alert.alert('Coming Soon', 'Delivery preferences will be available in a future update')}
          />
          
          <SettingsItem
            icon={<MapPin color="#6B7280" size={20} />}
            title="Working Areas"
            onPress={() => Alert.alert('Coming Soon', 'Working areas configuration will be available in a future update')}
          />
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <SettingsItem
            icon={<Edit3 color="#6B7280" size={20} />}
            title="Edit Profile"
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available in a future update')}
          />
          
          <SettingsItem
            icon={<HelpCircle color="#6B7280" size={20} />}
            title="Help & Support"
            onPress={() => Alert.alert('Help & Support', 'For support, please contact your administrator or call the support hotline')}
          />
          
          <SettingsItem
            icon={<Info color="#6B7280" size={20} />}
            title="About"
            onPress={() => Alert.alert(
              'About Delivery Driver App',
              'Version 1.0.0\n\nA modern delivery driver application for managing orders and tracking deliveries.\n\n© 2024 Gebeta Delivery'
            )}
          />
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity 
            style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <LinearGradient
              colors={isLoggingOut ? ['#9CA3AF', '#6B7280'] : ['#EF4444', '#DC2626']}
              style={styles.logoutGradient}
            >
              {isLoggingOut ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.logoutText}>Logging out...</Text>
                </>
              ) : (
                <>
                  <LogOut color="#FFFFFF" size={20} />
                  <Text style={styles.logoutText}>Logout</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  profileCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  profileGradient: {
    padding: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineDot: {
    backgroundColor: '#10B981',
  },
  offlineDot: {
    backgroundColor: '#6B7280',
  },
  statusText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileItemContent: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  logoutSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  logoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
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