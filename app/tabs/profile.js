import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  Shield, 
  LogOut, 
  ChevronRight,
  Truck,
  Lock,
  Eye,
  EyeOff,
  X,
  Key,
  Bell,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { useAuth } from '../../providers/auth-provider';
import { useDelivery } from '../../providers/delivery-provider';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout, token } = useAuth();
  const { 
    clearDeliveryData, 
    deliveryHistory,
    fetchDeliveryHistory,
    isOnline,
  } = useDelivery();
  const [refreshing, setRefreshing] = useState(false);
  
  // Change Password Modal States
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Notification Sound Settings
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(true);

  // Fetch delivery history on mount
  useEffect(() => {
    fetchDeliveryHistory();
    loadNotificationSettings();
  }, [fetchDeliveryHistory]);

  // Load notification sound preference from storage
  const loadNotificationSettings = async () => {
    try {
      const soundEnabled = await AsyncStorage.getItem('notificationSoundEnabled');
      if (soundEnabled !== null) {
        setNotificationSoundEnabled(soundEnabled === 'true');
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  // Toggle notification sound and save preference
  const toggleNotificationSound = async (value) => {
    try {
      setNotificationSoundEnabled(value);
      await AsyncStorage.setItem('notificationSoundEnabled', value.toString());
      
      if (Platform.OS === 'android') {
        const { ToastAndroid } = require('react-native');
        ToastAndroid.show(
          value ? '🔔 Notification sounds enabled' : '🔕 Notification sounds muted',
          ToastAndroid.SHORT
        );
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    }
  };

  // 🔄 Handle refresh - Works INDEPENDENTLY of socket connection
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveryHistory();
    setRefreshing(false);
  };

  // Calculate stats from delivery history
  const calculateStats = () => {
    if (!deliveryHistory || deliveryHistory.length === 0) {
      return {
        totalDeliveries: 0,
        totalEarnings: 0,
        rating: 0,
        thisMonth: 0,
      };
    }

    // Helper function to safely extract numeric values
    const extractNumber = (value) => {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseFloat(value) || 0;
      // Handle MongoDB Decimal128 format
      if (typeof value === 'object' && value.$numberDecimal) {
        return parseFloat(value.$numberDecimal) || 0;
      }
      return 0;
    };

    const totalEarnings = deliveryHistory.reduce((sum, order) => {
      const earnings = extractNumber(order.totalEarnings) || 
                      extractNumber(order.grandTotal) || 
                      (extractNumber(order.deliveryFee) + extractNumber(order.tip));
      return sum + earnings;
    }, 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthDeliveries = deliveryHistory.filter(order => {
      const orderDate = new Date(order.updatedAt || order.createdAt);
      return orderDate >= monthStart;
    });

    return {
      totalDeliveries: deliveryHistory.length,
      totalEarnings: totalEarnings,
      rating: 4.8, // This would come from backend in real app
      thisMonth: thisMonthDeliveries.length,
    };
  };

  const stats = calculateStats();

  // 🔑 Handle Change Password - Works INDEPENDENTLY of socket connection (uses HTTP API)
  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setPasswordError('Please fill in all fields');
      return;
    }

    if (newPassword.trim().length < 3) {
      setPasswordError('Password must be at least 3 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch('https://gebeta-delivery1.onrender.com/api/v1/users/updateMyPassword', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: newPassword.trim(),
          passwordConfirm: confirmPassword.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setPasswordSuccess('Password changed successfully! Redirecting to login...');
        
        setTimeout(async () => {
          // Close modal
          setShowChangePasswordModal(false);
          
          // Clear delivery data
          await clearDeliveryData();
          
          // Logout
          await logout();
          
          // Navigate to login
          router.replace('/login');
          
          // Reset form
          setNewPassword('');
          setConfirmPassword('');
          setPasswordError('');
          setPasswordSuccess('');
        }, 1500);
      } else {
        // Display server error message
        const serverMessage = data.message || data.error || 
                             (data.errors && data.errors[0]?.msg) || 
                             'Failed to change password. Please try again.';
        setPasswordError(serverMessage);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      
      // Check if it's a network error or server error
      if (error.message === 'Failed to fetch' || error.message.includes('Network request failed')) {
        setPasswordError('Unable to connect to server. Please check your internet connection and try again.');
      } else {
        setPasswordError('Something went wrong. Please try again later.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Close change password modal
  const handleCloseChangePassword = () => {
    setShowChangePasswordModal(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
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

  const profileData = {
    name: user?.name || (user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : 'Driver'),
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || 'Not provided',
    phone: user?.phone || 'Not provided',
    profilePicture: user?.profilePicture || 'https://res.cloudinary.com/drinuph9d/image/upload/v1752830842/800px-User_icon_2.svg_vi5e9d.png',
    location: user?.location || 'Addis Ababa, Ethiopia',
    verified: user?.isPhoneVerified || false,
    deliveryMethod: user?.deliveryMethod || 'Not specified',
    fcnNumber: user?.fcnNumber || 'Not assigned',
  };

  const userRole = user?.role === 'Delivery_Person' ? 'Delivery Driver' : user?.role || 'Driver';

  // Get member since date
  const getMemberSince = () => {
    if (user?.createdAt) {
      const date = new Date(user.createdAt);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return 'January 2024';
  };

  const menuItems = [
    {
      icon: notificationSoundEnabled ? Volume2 : VolumeX,
      label: 'Notification Sound',
      subtitle: notificationSoundEnabled ? 'Sound enabled' : 'Sound muted',
      color: notificationSoundEnabled ? '#10B981' : '#6B7280',
      onPress: () => {},
      rightComponent: (
        <Switch
          value={notificationSoundEnabled}
          onValueChange={toggleNotificationSound}
          trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
          thumbColor={notificationSoundEnabled ? '#10B981' : '#9CA3AF'}
          ios_backgroundColor="#D1D5DB"
        />
      ),
    },
    {
      icon: Key,
      label: 'Change Password',
      subtitle: 'Update your account password',
      color: '#3B82F6',
      onPress: () => setShowChangePasswordModal(true),
    },
    {
      icon: LogOut,
      label: 'Sign Out',
      subtitle: 'Logout from your account',
      color: '#EF4444',
      onPress: handleLogout,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      >
        {/* Profile Header Card */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#3B82F6', '#1E40AF']}
            style={styles.headerGradient}
          >
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: profileData.profilePicture }}
                style={styles.avatar}
                resizeMode="cover"
              />
              {profileData.verified && (
                <View style={styles.verifiedBadge}>
                  <Shield color="#10B981" size={16} />
                </View>
              )}
            </View>

            {/* Profile Info */}
            <Text style={styles.profileName}>{profileData.name}</Text>
            <Text style={styles.profileRole}>{userRole}</Text>
            
            {/* Status Badge */}
            <View style={[styles.statusBadge, isOnline ? styles.statusOnline : styles.statusOffline]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Personal Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Mail color="#3B82F6" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profileData.email}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Phone color="#10B981" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{profileData.phone}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <MapPin color="#F59E0B" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{profileData.location}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Truck color="#8B5CF6" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Delivery Method</Text>
                <Text style={styles.infoValue}>{profileData.deliveryMethod}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Award color="#EC4899" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>FCN Number</Text>
                <Text style={styles.infoValue}>{profileData.fcnNumber}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Account</Text>
          
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
                  <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                    <Icon color={item.color} size={20} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    {item.subtitle && (
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                </View>
                {item.rightComponent || <ChevronRight color="#9CA3AF" size={20} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Member Since */}
        <View style={styles.memberSinceContainer}>
          <Text style={styles.memberSinceText}>
            Member since {getMemberSince()}
          </Text>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseChangePassword}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalIconContainer}>
                    <Lock color="#FFFFFF" size={32} />
                  </View>
                  <Text style={styles.modalTitle}>Change Password</Text>
                  <TouchableOpacity
                    onPress={handleCloseChangePassword}
                    style={styles.closeButton}
                    activeOpacity={0.7}
                  >
                    <X color="#6b7280" size={22} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalBody}>
                    <Text style={styles.modalDescription}>
                      Enter your new password below. You will be logged out after changing your password.
                    </Text>

                    {/* New Password Input */}
                    <View style={styles.modalInputContainer}>
                      <Text style={styles.inputLabel}>New Password</Text>
                      <View style={styles.passwordInputWrapper}>
                        <Lock color="#6b7280" size={20} style={styles.inputIcon} />
                        <TextInput
                          style={styles.passwordInput}
                          placeholder="Enter new password (min 3 characters)"
                          placeholderTextColor="#9ca3af"
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry={!showNewPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        <TouchableOpacity
                          onPress={() => setShowNewPassword(!showNewPassword)}
                          style={styles.eyeIcon}
                        >
                          {showNewPassword ? (
                            <EyeOff color="#6b7280" size={20} />
                          ) : (
                            <Eye color="#6b7280" size={20} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Confirm Password Input */}
                    <View style={styles.modalInputContainer}>
                      <Text style={styles.inputLabel}>Confirm Password</Text>
                      <View style={styles.passwordInputWrapper}>
                        <Lock color="#6b7280" size={20} style={styles.inputIcon} />
                        <TextInput
                          style={styles.passwordInput}
                          placeholder="Confirm new password"
                          placeholderTextColor="#9ca3af"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.eyeIcon}
                        >
                          {showConfirmPassword ? (
                            <EyeOff color="#6b7280" size={20} />
                          ) : (
                            <Eye color="#6b7280" size={20} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Change Password Button */}
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={handleChangePassword}
                      disabled={isChangingPassword}
                    >
                      <LinearGradient
                        colors={['#3B82F6', '#1E40AF']}
                        style={styles.modalButtonGradient}
                      >
                        {isChangingPassword ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text style={styles.modalButtonText}>Change Password</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Error/Success Messages */}
                    {(passwordError || passwordSuccess) && (
                      <View style={[
                        styles.passwordMessageBanner,
                        passwordError ? styles.passwordErrorBanner : styles.passwordSuccessBanner
                      ]}>
                        <Text style={[
                          styles.passwordMessageText,
                          passwordError ? styles.passwordErrorText : styles.passwordSuccessText
                        ]}>
                          {passwordError || passwordSuccess}
                        </Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerGradient: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileRole: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 16,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusOffline: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  menuItem: {
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
    elevation: 2,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  memberSinceContainer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  memberSinceText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  // Change Password Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalKeyboardView: {
    width: '100%',
    maxWidth: 480,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  modalContent: {
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  modalTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalBody: {
    paddingTop: 8,
    paddingBottom: 0,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
    textAlign: 'left',
  },
  modalInputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  modalButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalButtonGradient: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  passwordMessageBanner: {
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 8,
    borderWidth: 1,
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
  passwordSuccessBanner: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  passwordErrorBanner: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  passwordMessageText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  passwordSuccessText: {
    color: '#065f46',
  },
  passwordErrorText: {
    color: '#991b1b',
  },
});