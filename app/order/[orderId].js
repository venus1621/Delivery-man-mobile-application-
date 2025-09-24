import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Phone, 
  Truck, 
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Navigation
} from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useDelivery } from '../../providers/delivery-provider';
import { useAuth } from '../../providers/auth-provider';

export default function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams();
  const { activeOrder, verifyDelivery, completeOrder, isLoadingActiveOrder } = useDelivery();
  const { user } = useAuth();
  
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Find the order details (either from active order or available orders)
  const order = activeOrder;

  const handleVerifyDelivery = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyDelivery(orderId, verificationCode.trim());
      if (result.success) {
        Alert.alert('Success', 'Delivery verified successfully!');
        setShowVerificationModal(false);
        setVerificationCode('');
        router.back();
      }
    } catch (error) {
      console.error('Error verifying delivery:', error);
      Alert.alert('Error', 'Failed to verify delivery. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompleteOrder = async () => {
    Alert.alert(
      'Complete Order',
      'Are you sure you want to complete this delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            setIsCompleting(true);
            try {
              const success = await completeOrder(orderId);
              if (success) {
                Alert.alert('Success', 'Order completed successfully!');
                router.back();
              }
            } catch (error) {
              console.error('Error completing order:', error);
              Alert.alert('Error', 'Failed to complete order. Please try again.');
            } finally {
              setIsCompleting(false);
            }
          },
        },
      ]
    );
  };

  const handleNavigateToRestaurant = () => {
    if (order?.restaurantLocation?.lat && order?.restaurantLocation?.lng) {
      // You can implement navigation here using expo-location or maps
      Alert.alert(
        'Navigate to Restaurant',
        `Navigate to ${order.restaurantLocation.name}?\n\nAddress: ${order.restaurantLocation.address}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Navigate', style: 'default' }
        ]
      );
    }
  };

  const handleNavigateToDelivery = () => {
    if (order?.deliveryLocation?.lat && order?.deliveryLocation?.lng) {
      Alert.alert(
        'Navigate to Delivery',
        `Navigate to delivery address?\n\nAddress: ${order.deliveryLocation.address}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Navigate', style: 'default' }
        ]
      );
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoadingActiveOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="#1F2937" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.errorContainer}>
          <AlertCircle color="#EF4444" size={48} />
          <Text style={styles.errorTitle}>Order Not Found</Text>
          <Text style={styles.errorMessage}>
            The order you're looking for is not available or has been completed.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#1F2937" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={
              order.orderStatus === 'Delivering' 
                ? ['#3B82F6', '#1D4ED8'] 
                : ['#10B981', '#059669']
            }
            style={styles.statusGradient}
          >
            <View style={styles.statusHeader}>
              <Truck color="#FFFFFF" size={24} />
              <Text style={styles.statusTitle}>
                {order.orderStatus === 'Delivering' ? 'Delivering Order' : 'Order Ready'}
              </Text>
            </View>
            <Text style={styles.statusSubtitle}>
              {order.orderStatus === 'Delivering' 
                ? 'Order is being delivered to customer'
                : 'Order is ready for pickup'
              }
            </Text>
          </LinearGradient>
        </View>

        {/* Order Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order ID:</Text>
              <Text style={styles.infoValue}>{order.order_id || order.orderId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order Code:</Text>
              <Text style={styles.infoValue}>{order.orderCode || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[styles.infoValue, styles.statusText]}>{order.orderStatus}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoValue}>
                {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Verification Code:</Text>
              <Text style={[styles.infoValue, styles.verificationCode]}>
                {order.verificationCode || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Restaurant Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Details</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <MapPin color="#1E40AF" size={20} />
              <Text style={styles.locationTitle}>Pickup Location</Text>
            </View>
            <Text style={styles.restaurantName}>{order.restaurantLocation?.name}</Text>
            <Text style={styles.locationAddress}>{order.restaurantLocation?.address}</Text>
            
            <TouchableOpacity 
              style={styles.navigateButton}
              onPress={handleNavigateToRestaurant}
            >
              <Navigation color="#1E40AF" size={16} />
              <Text style={styles.navigateButtonText}>Navigate to Restaurant</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <MapPin color="#10B981" size={20} />
              <Text style={styles.locationTitle}>Delivery Location</Text>
            </View>
            <Text style={styles.locationAddress}>{order.deliveryLocation?.address}</Text>
            
            <TouchableOpacity 
              style={[styles.navigateButton, styles.deliveryNavigateButton]}
              onPress={handleNavigateToDelivery}
            >
              <Navigation color="#10B981" size={16} />
              <Text style={[styles.navigateButtonText, styles.deliveryNavigateText]}>
                Navigate to Delivery
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Phone color="#6B7280" size={16} />
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{order.userPhone || order.customer?.phone || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{order.customer?.name || 'Customer'}</Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.itemsCard}>
            {order.items?.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              </View>
            ))}
            {order.specialInstructions && (
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsLabel}>Special Instructions:</Text>
                <Text style={styles.instructionsText}>{order.specialInstructions}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <DollarSign color="#6B7280" size={16} />
              <Text style={styles.paymentLabel}>Delivery Fee:</Text>
              <Text style={styles.paymentValue}>ETB {order.deliveryFee?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Tip:</Text>
              <Text style={styles.paymentValue}>ETB {order.tip?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={[styles.paymentRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Earnings:</Text>
              <Text style={styles.totalValue}>
                ETB {((order.deliveryFee || 0) + (order.tip || 0)).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {order.orderStatus === 'Cooked' && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => setShowVerificationModal(true)}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.buttonGradient}
              >
                <CheckCircle color="#FFFFFF" size={20} />
                <Text style={styles.buttonText}>Verify Pickup</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {order.orderStatus === 'Delivering' && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => setShowVerificationModal(true)}
              disabled={isVerifying}
            >
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.buttonGradient}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <CheckCircle color="#FFFFFF" size={20} />
                )}
                <Text style={styles.buttonText}>
                  {isVerifying ? 'Verifying...' : 'Verify Delivery'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleCompleteOrder}
            disabled={isCompleting}
          >
            <Text style={styles.secondaryButtonText}>
              {isCompleting ? 'Completing...' : 'Complete Order'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Verification Modal */}
      {showVerificationModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Enter Verification Code</Text>
            <Text style={styles.modalSubtitle}>
              Please enter the verification code provided by the customer
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Verification Code:</Text>
              <TextInput
                style={styles.textInput}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="Enter code"
                keyboardType="numeric"
                maxLength={6}
                autoFocus
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowVerificationModal(false);
                  setVerificationCode('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={handleVerifyDelivery}
                disabled={isVerifying || !verificationCode.trim()}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  statusCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statusGradient: {
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 2,
  },
  statusText: {
    color: '#10B981',
  },
  verificationCode: {
    color: '#1E40AF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  navigateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginLeft: 6,
  },
  deliveryNavigateButton: {
    backgroundColor: '#ECFDF5',
  },
  deliveryNavigateText: {
    color: '#10B981',
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  instructionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  instructionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  actionsSection: {
    margin: 20,
    marginBottom: 40,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});