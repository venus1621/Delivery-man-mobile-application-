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
  DollarSign, 
  Clock, 
  Navigation, 
  
  User,
  Phone,
  X,
  Check,
  AlertCircle
} from 'lucide-react-native';
import { useAuth } from '../providers/auth-provider';

// Function to get address from coordinates using reverse geocoding
const getAddressFromCoordinates = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=YOUR_GOOGLE_MAPS_API_KEY`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    return null;
  } catch (error) {
    console.error('Error fetching address:', error);
    return null;
  }
};

// Fallback function using OpenStreetMap (free, no API key required)
const getAddressFromOSM = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    
    if (data.display_name) {
      // Extract a more user-friendly address
      const addressParts = data.display_name.split(', ');
      // Take the first 3-4 parts for a cleaner address
      return addressParts.slice(0, 4).join(', ');
    }
    return null;
  } catch (error) {
    console.error('Error fetching address from OSM:', error);
    return null;
  }
};

export default function OrderModal({ 
  visible, 
  order, 
  onAccept, 
  onDecline, 
  onClose 
}) {
  const { userId } = useAuth();
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [acceptingOrder, setAcceptingOrder] = useState(false);

  // Fetch addresses when order changes
  useEffect(() => {
    if (order && visible) {
      fetchAddresses();
    }
  }, [order, visible]);

  const fetchAddresses = async () => {
    if (!order) return;
    
    setLoadingAddresses(true);
    
    try {
      // Fetch restaurant address
      if (order.restaurantLocation?.lat && order.restaurantLocation?.lng) {
        const restaurantAddr = await getAddressFromOSM(
          order.restaurantLocation.lat, 
          order.restaurantLocation.lng
        );
        setRestaurantAddress(restaurantAddr);
      }
      
      // Fetch delivery address
      if (order.deliveryLocation?.lat && order.deliveryLocation?.lng) {
        const deliveryAddr = await getAddressFromOSM(
          order.deliveryLocation.lat, 
          order.deliveryLocation.lng
        );
        setDeliveryAddress(deliveryAddr);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

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
              // Call the onAccept function with the order data
              // The delivery provider will handle the Socket.IO communication
              await onAccept(order);
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
                <Pac5kage color="#3B82F6" size={24} />
                <Text style={styles.headerTitle}>New Order Received!</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                             {/* Order Amount */}
               <View style={styles.orderHeader}>
                 <View style={styles.amountContainer}>
                   <DollarSign color="#10B981" size={20} />
                   <Text style={styles.orderAmount}>
                     ETB {order.grandTotal?.toFixed(2) || '0.00'}
                   </Text>
                 </View>
               </View>

              {/* Order Time */}
              <View style={styles.timeContainer}>
                <Clock color="#6B7280" size={16} />
                <Text style={styles.timeText}>
                  {new Date(order.createdAt || Date.now()).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>

              {/* Customer Information */}
              {order.customer && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                  <View style={styles.customerInfo}>
                    <View style={styles.customerRow}>
                      <User color="#6B7280" size={16} />
                      <Text style={styles.customerText}>
                        {order.customer.name || 'Customer Name'}
                      </Text>
                    </View>
                    {order.customer.phone && (
                      <View style={styles.customerRow}>
                        <Phone color="#6B7280" size={16} />
                        <Text style={styles.customerText}>
                          {order.customer.phone}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

                             {/* Restaurant Location */}
               <View style={styles.section}>
                 <Text style={styles.sectionTitle}>Pickup Location</Text>
                 <View style={styles.locationContainer}>
                   <View style={styles.locationRow}>
                     <MapPin color="#EF4444" size={16} />
                     <Text style={styles.locationText}>Restaurant</Text>
                   </View>
                   <Text style={styles.locationAddress}>
                     {loadingAddresses ? 'Loading address...' : 
                      restaurantAddress || 
                      order.restaurantLocation?.address || 
                      `${order.restaurantLocation?.lat?.toFixed(4) || '0'}, ${order.restaurantLocation?.lng?.toFixed(4) || '0'}`}
                   </Text>
                 </View>
               </View>

               {/* Delivery Location */}
               <View style={styles.section}>
                 <Text style={styles.sectionTitle}>Delivery Location</Text>
                 <View style={styles.locationContainer}>
                   <View style={styles.locationRow}>
                     <Navigation color="#3B82F6" size={16} />
                     <Text style={styles.locationText}>Delivery Address</Text>
                   </View>
                   <Text style={styles.locationAddress}>
                     {loadingAddresses ? 'Loading address...' : 
                      deliveryAddress || 
                      order.deliveryLocation?.address || 
                      `${order.deliveryLocation?.lat?.toFixed(4) || '0'}, ${order.deliveryLocation?.lng?.toFixed(4) || '0'}`}
                   </Text>
                 </View>
               </View>

              {/* Order Details */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Details</Text>
                <View style={styles.detailsGrid}>
                                     <View style={styles.detailItem}>
                     <Text style={styles.detailLabel}>Delivery Fee</Text>
                     <Text style={styles.detailValue}>
                       ETB {order.deliveryFee?.toFixed(2) || '0.00'}
                     </Text>
                   </View>
                   <View style={styles.detailItem}>
                     <Text style={styles.detailLabel}>Tip</Text>
                     <Text style={styles.detailValue}>
                       ETB {order.tip?.toFixed(2) || '0.00'}
                     </Text>
                   </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Items</Text>
                    <Text style={styles.detailValue}>
                      {order.items?.length || 0} items
                    </Text>
                  </View>
                </View>
              </View>

              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Order Items</Text>
                  {order.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Special Instructions */}
              {order.specialInstructions && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Special Instructions</Text>
                  <Text style={styles.instructionsText}>
                    {order.specialInstructions}
                  </Text>
                </View>
              )}
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
     justifyContent: 'flex-end',
     alignItems: 'center',
     marginVertical: 16,
   },
   amountContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 8,
   },
  orderAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
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
  locationContainer: {
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 24,
    lineHeight: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
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
