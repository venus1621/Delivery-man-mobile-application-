import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  MapPin, 
  Navigation, 
  Package,
  User,
  Phone,
  X,
  Check,
  AlertCircle
} from 'lucide-react-native';
import { useAuth } from '../providers/auth-provider';
import { useDelivery } from '../providers/delivery-provider';

export default function OrderModal({ 
  visible, 
  order, 
  onAccept, 
  onDecline, 
  onClose 
}) {
  const { userId } = useAuth();
  const { acceptOrder } = useDelivery();
  const [acceptingOrder, setAcceptingOrder] = useState(false);

  // Early return if no order data
  if (!visible || !order) {
    return null;
  }

  // Log order data when modal opens
  useEffect(() => {
    if (order && visible) {
      console.log("📦 OrderModal received order:", order);
    }
  }, [order, visible]);

  if (!order) return null;

  const handleAccept = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please log in again.');
      return;
    }

    if (!order?.orderId) {
      Alert.alert('Error', 'Order ID not found.');
      return;
    }

    Alert.alert(
      'Accept Order',
      `Are you sure you want to accept this order for ETB ${order.grandTotal?.toFixed(2) || '0.00'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            setAcceptingOrder(true);
            try {
              // Use the acceptOrder function from delivery provider
              const success = await acceptOrder(order.orderId, userId);
              if (success) {
                // Close the modal on successful acceptance
                onClose();
              }
            } catch (error) {
              console.error('Error accepting order:', error);
              Alert.alert('Error', 'Failed to accept order. Please try again.');
            } finally {
              setAcceptingOrder(false);
            }
          },
        },
      ]
    );
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Order',
      'Are you sure you want to decline this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => onDecline(order),
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Package color="#3B82F6" size={24} />
                <Text style={styles.headerTitle}>New Order Received!</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>#{order.orderCode || order.order_id || order.orderId}</Text>
                  <Text style={styles.orderTime}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today'} • {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : 'Now'}
                  </Text>
                </View>
                <View style={styles.orderEarnings}>
                  <Text style={styles.earningsAmount}>
                    ETB {order.grandTotal?.toFixed(2) || '0.00'}
                  </Text>
                  <Text style={styles.earningsLabel}>Grand Total</Text>
                </View>
              </View>

              {/* Restaurant Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Restaurant Information</Text>
                <View style={styles.detailRow}>
                  <MapPin color="#6B7280" size={16} />
                  <Text style={styles.detailText}>
                    {order.restaurantName || order.restaurantLocation?.name || 'Restaurant'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <MapPin color="#6B7280" size={16} />
                  <Text style={styles.detailText}>
                    Lat: {order.restaurantLocation?.lat?.toFixed(6) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <MapPin color="#6B7280" size={16} />
                  <Text style={styles.detailText}>
                    Lng: {order.restaurantLocation?.lng?.toFixed(6) || 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Delivery Location */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Delivery Location</Text>
                <View style={styles.detailRow}>
                  <Navigation color="#6B7280" size={16} />
                  <Text style={styles.detailText}>
                    Lat: {order.deliveryLocation?.lat?.toFixed(6) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Navigation color="#6B7280" size={16} />
                  <Text style={styles.detailText}>
                    Lng: {order.deliveryLocation?.lng?.toFixed(6) || 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Customer Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Customer Information</Text>
                <View style={styles.customerInfo}>
                  <View style={styles.customerRow}>
                    <User color="#6B7280" size={16} />
                    <Text style={styles.customerText}>
                      {order.userName || order.customer?.name || 'Customer'}
                    </Text>
                  </View>
                  <View style={styles.customerRow}>
                    <Phone color="#6B7280" size={16} />
                    <Text style={styles.customerText}>
                      {order.phone || order.customer?.phone || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Order Items */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Items</Text>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noItemsText}>No items specified</Text>
                )}
              </View>

              {/* Order Status & Verification */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Status & Verification</Text>
                <View style={styles.detailRow}>
                  <Package color="#6B7280" size={16} />
                  <Text style={styles.detailText}>
                    Status: {order.orderStatus || 'Pending'}
                  </Text>
                </View>
                {order.pickUpVerificationCode && (
                  <View style={styles.detailRow}>
                    <Check color="#6B7280" size={16} />
                    <Text style={styles.detailText}>
                      Pickup Code: {order.pickUpVerificationCode}
                    </Text>
                  </View>
                )}
                {order.verificationCode && (
                  <View style={styles.detailRow}>
                    <Check color="#6B7280" size={16} />
                    <Text style={styles.detailText}>
                      Verification Code: {order.verificationCode}
                    </Text>
                  </View>
                )}
              </View>

              {/* Special Instructions */}
              {(order.description || order.specialInstructions) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Special Instructions</Text>
                  <Text style={styles.instructionsText}>
                    {order.description || order.specialInstructions}
                  </Text>
                </View>
              )}

              {/* Order Breakdown */}
              <View style={styles.orderBreakdown}>
                <Text style={styles.sectionTitle}>Order Summary</Text>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Delivery Fee:</Text>
                  <Text style={styles.breakdownValue}>ETB {order.deliveryFee?.toFixed(2) || '0.00'}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Tip:</Text>
                  <Text style={styles.breakdownValue}>ETB {order.tip?.toFixed(2) || '0.00'}</Text>
                </View>
                {order.distanceKm && (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Distance:</Text>
                    <Text style={styles.breakdownValue}>{order.distanceKm} km</Text>
                  </View>
                )}
                <View style={[styles.breakdownRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Grand Total:</Text>
                  <Text style={styles.totalValue}>ETB {order.grandTotal?.toFixed(2) || '0.00'}</Text>
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDecline}
                disabled={acceptingOrder}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.declineGradient}
                >
                  <AlertCircle color="#FFFFFF" size={20} />
                  <Text style={styles.declineButtonText}>Decline</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.acceptButton, acceptingOrder && styles.acceptButtonDisabled]}
                onPress={handleAccept}
                disabled={acceptingOrder}
              >
                <LinearGradient
                  colors={acceptingOrder ? ['#9CA3AF', '#6B7280'] : ['#10B981', '#059669']}
                  style={styles.acceptGradient}
                >
                  <Check color="#FFFFFF" size={20} />
                  <Text style={styles.acceptButtonText}>
                    {acceptingOrder ? 'Accepting...' : 'Accept'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderEarnings: {
    alignItems: 'flex-end',
  },
  earningsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  earningsLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  orderBreakdown: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  noItemsText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  customerInfo: {
    gap: 8,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerText: {
    fontSize: 14,
    color: '#374151',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  instructionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  declineButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  declineGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  declineButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  acceptButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  acceptButtonDisabled: {
    opacity: 0.7,
  },
});
