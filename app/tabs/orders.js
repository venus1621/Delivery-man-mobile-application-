import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Truck,
  RefreshCw,
  Filter,
  Search,
  Navigation
} from 'lucide-react-native';
import { useDelivery } from '../../providers/delivery-provider';
import { useAuth } from '../../providers/auth-provider';
import { router } from 'expo-router';

export default function OrdersScreen() {
  const { 
    availableOrders,
    availableOrdersCount,
    fetchAvailableOrders,
    isLoadingOrders,
    ordersError,
    isConnected,
    isOnline,
    acceptOrder
  } = useDelivery();
  
  const { userId } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [filterBy, setFilterBy] = useState('all'); // all, nearby, high-value

  useEffect(() => {
    if (isOnline) {
      fetchAvailableOrders();
    }
  }, [isOnline, fetchAvailableOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAvailableOrders();
    setRefreshing(false);
  };

  const handleAcceptOrder = async (order) => {
    Alert.alert(
      'Accept Order',
      `Do you want to accept this order?\n\nOrder: ${order.order_id || order.orderId}\nRestaurant: ${order.restaurantLocation?.name}\nEarnings: ETB ${order.grandTotal?.toFixed(2) || '0.00'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              const success = await acceptOrder(order.orderId, userId);
              if (success) {
                // Refresh the orders list to remove the accepted order
                await fetchAvailableOrders();
              }
            } catch (error) {
              console.error('Error accepting order:', error);
              // Error handling is already done in the acceptOrder function
            }
          },
        },
      ]
    );
  };

  const filteredOrders = availableOrders.filter(order => {
    switch (filterBy) {
      case 'nearby':
        // You can implement distance filtering here
        return true;
      case 'high-value':
        return ((order.deliveryFee || 0) + (order.tip || 0)) >= 200;
      default:
        return true;
    }
  });

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDistance = (lat1, lng1, lat2, lng2) => {
    // Simple distance calculation (you can use a proper geolocation library)
    if (!lat1 || !lng1 || !lat2 || !lng2) return 'N/A';
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return `${distance.toFixed(1)} km`;
  };

  const showFilterOptions = () => {
    Alert.alert(
      'Filter Orders',
      'Choose how to filter available orders:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Show All Orders', onPress: () => setFilterBy('all') },
        { text: 'Show Nearby Orders', onPress: () => setFilterBy('nearby') },
        { text: 'Show High-Value Orders (ETB 200+)', onPress: () => setFilterBy('high-value') },
      ]
    );
  };

  if (!isOnline) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.offlineContainer}>
          <Truck color="#6B7280" size={48} />
          <Text style={styles.offlineTitle}>Go Online to See Orders</Text>
          <Text style={styles.offlineMessage}>
            You need to be online to view and accept delivery orders.
          </Text>
          <TouchableOpacity 
            style={styles.onlineButton}
            onPress={() => router.push('/tabs/dashboard')}
          >
            <Text style={styles.onlineButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoadingOrders && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Loading available orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (ordersError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load Orders</Text>
          <Text style={styles.errorMessage}>{ordersError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Available Orders</Text>
          <Text style={styles.subtitle}>
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} available
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleRefresh}
          >
            <RefreshCw color="#1E40AF" size={20} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={showFilterOptions}
          >
            <Filter color="#1E40AF" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Connection Status */}
      {!isConnected && (
        <View style={styles.connectionWarning}>
          <Text style={styles.connectionWarningText}>
            🔴 Connecting to server... Orders may not update in real-time.
          </Text>
        </View>
      )}

      {/* Orders List */}
      <ScrollView 
        style={styles.ordersList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1E40AF']}
            tintColor="#1E40AF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MapPin color="#6B7280" size={48} />
            <Text style={styles.emptyTitle}>No Orders Available</Text>
            <Text style={styles.emptyMessage}>
              {filterBy === 'all' 
                ? "There are currently no available orders. Check back later or go online to receive new order notifications."
                : `No orders match your current filter (${filterBy}). Try changing the filter or check back later.`
              }
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <RefreshCw color="#1E40AF" size={16} />
              <Text style={styles.refreshButtonText}>Refresh Orders</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredOrders.map((order, index) => (
            <View key={order.orderId || index} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>#{order.order_id || order.orderId}</Text>
                  <Text style={styles.orderTime}>
                    {formatDate(order.createdAt)} • {formatTime(order.createdAt)}
                  </Text>
                </View>
                <View style={styles.orderEarnings}>
                  <Text style={styles.earningsAmount}>
                    ETB {((order.deliveryFee || 0) + (order.tip || 0)).toFixed(2)}
                  </Text>
                  <Text style={styles.earningsLabel}>Total</Text>
                </View>
              </View>

              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <MapPin color="#6B7280" size={16} />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {order.restaurantLocation?.name || 'Restaurant'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Navigation color="#6B7280" size={16} />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {(typeof order.deliveryLocation?.address === 'string' ? order.deliveryLocation.address : null) || 'Delivery Address'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock color="#6B7280" size={16} />
                  <Text style={styles.detailText}>
                    Distance: {getDistance(9.0192, 38.7525, order.deliveryLocation?.lat, order.deliveryLocation?.lng)}
                  </Text>
                </View>
              </View>

              <View style={styles.orderBreakdown}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Delivery Fee:</Text>
                  <Text style={styles.breakdownValue}>ETB {order.deliveryFee?.toFixed(2) || '0.00'}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Tip:</Text>
                  <Text style={styles.breakdownValue}>ETB {order.tip?.toFixed(2) || '0.00'}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={() => handleAcceptOrder(order)}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.acceptButtonGradient}
                >
                  <Truck color="#FFFFFF" size={20} />
                  <Text style={styles.acceptButtonText}>Accept Order</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  offlineMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  onlineButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  onlineButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  connectionWarning: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  connectionWarningText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
  ordersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginLeft: 6,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
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
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});