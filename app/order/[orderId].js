import React, { useState } from 'react';
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
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  DollarSign, 
  Clock,
  CheckCircle,
  Truck
} from 'lucide-react-native';
import { useDelivery } from '../../providers/delivery-provider';

export default function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams();
  const { activeOrder, updateOrderStatus } = useDelivery();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!activeOrder || activeOrder.orderId !== orderId) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Order Not Found' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found or no longer active</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleCompleteDelivery = async () => {
    Alert.alert(
      'Complete Delivery',
      'Mark this delivery as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setIsUpdating(true);
            const success = await updateOrderStatus(activeOrder.orderId, 'Completed');
            setIsUpdating(false);
            
            if (success) {
              Alert.alert('Success', 'Delivery completed successfully!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') }
              ]);
            } else {
              Alert.alert('Error', 'Failed to update order status');
            }
          },
        },
      ]
    );
  };

  const openMaps = (lat, lng, label) => {
    // This would open the device's maps app
    Alert.alert('Navigation', `Navigate to ${label}?`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `Order #${activeOrder.order_id}` }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order Status */}
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          style={styles.statusCard}
        >
          <View style={styles.statusHeader}>
            <Truck color="#FFFFFF" size={24} />
            <Text style={styles.statusTitle}>In Progress</Text>
          </View>
          <Text style={styles.statusSubtitle}>
            Delivering to customer
          </Text>
        </LinearGradient>

        {/* Order Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.orderId}>#{activeOrder.order_id}</Text>
            <View style={styles.amountContainer}>
              <DollarSign color="#10B981" size={20} />
              <Text style={styles.totalAmount}>${activeOrder.grandTotal.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.timeContainer}>
            <Clock color="#6B7280" size={16} />
            <Text style={styles.timeText}>
              Order placed at {new Date(activeOrder.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>

        {/* Locations */}
        <View style={styles.locationsContainer}>
          <Text style={styles.sectionTitle}>Locations</Text>
          
          {/* Restaurant Location */}
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <MapPin color="#EF4444" size={20} />
              <Text style={styles.locationTitle}>Restaurant (Pickup)</Text>
            </View>
            <Text style={styles.locationAddress}>
              {activeOrder.restaurantLocation.lat.toFixed(6)}, {activeOrder.restaurantLocation.lng.toFixed(6)}
            </Text>
            <TouchableOpacity 
              style={styles.navigateButton}
              onPress={() => openMaps(
                activeOrder.restaurantLocation.lat, 
                activeOrder.restaurantLocation.lng,
                'Restaurant'
              )}
            >
              <Navigation color="#3B82F6" size={16} />
              <Text style={styles.navigateText}>Navigate</Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Location */}
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Navigation color="#3B82F6" size={20} />
              <Text style={styles.locationTitle}>Customer (Delivery)</Text>
            </View>
            <Text style={styles.locationAddress}>
              {activeOrder.deliveryLocation.address || 
               `${activeOrder.deliveryLocation.lat.toFixed(6)}, ${activeOrder.deliveryLocation.lng.toFixed(6)}`}
            </Text>
            <TouchableOpacity 
              style={styles.navigateButton}
              onPress={() => openMaps(
                activeOrder.deliveryLocation.lat, 
                activeOrder.deliveryLocation.lng,
                'Customer'
              )}
            >
              <Navigation color="#3B82F6" size={16} />
              <Text style={styles.navigateText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Breakdown */}
        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Delivery Fee</Text>
            <Text style={styles.paymentValue}>${activeOrder.deliveryFee.toFixed(2)}</Text>
          </View>
          
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Tip</Text>
            <Text style={styles.paymentValue}>${activeOrder.tip.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalValue}>${activeOrder.grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.contactButton}>
            <Phone color="#3B82F6" size={20} />
            <Text style={styles.contactButtonText}>Contact Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.completeButton, isUpdating && styles.disabledButton]}
            onPress={handleCompleteDelivery}
            disabled={isUpdating}
          >
            <LinearGradient
              colors={isUpdating ? ['#9CA3AF', '#6B7280'] : ['#10B981', '#059669']}
              style={styles.completeGradient}
            >
              <CheckCircle color="#FFFFFF" size={20} />
              <Text style={styles.completeButtonText}>
                {isUpdating ? 'Updating...' : 'Complete Delivery'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
  statusCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  locationsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  navigateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  completeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.7,
  },
  completeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
