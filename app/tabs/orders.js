import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, DollarSign, Clock, Navigation } from 'lucide-react-native';
import { useDelivery } from '../../providers/delivery-provider';
import { useAuth } from '../../providers/auth-provider';
import OrderModal from '../../components/OrderModal';

export default function OrdersScreen() {
  const { 
    availableOrders, 
    acceptOrder, 
    declineOrder,
    isOnline,
    pendingOrderPopup,
    showOrderModal: showOrderModalState,
    showOrderModalFn,
    hideOrderModal,
    acceptOrderFromModal,
    fetchAvailableOrders,
    isLoadingOrders,
    ordersError,
  } = useDelivery();

  const { userId } = useAuth();

  // Fetch orders when component mounts and when going online
  useEffect(() => {
    if (isOnline) {
      fetchAvailableOrders();
    }
  }, [isOnline, fetchAvailableOrders]);

  const handleRefresh = () => {
    if (isOnline) {
      fetchAvailableOrders();
    }
  };

     const handleAcceptOrder = async (order) => {

      console.log('Accepting order:', order);
      console.log('User ID:', userId);
      const success = await acceptOrder(order.orderId, userId); 
      console.log('Success:', success);
   };

  const renderOrderCard = ({ item }) => (
    <View style={styles.orderCard}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.orderGradient}
      >
                 <View style={styles.orderHeader}>
           <View style={styles.amountContainer}>
             <DollarSign color="#10B981" size={16} />
             <Text style={styles.orderAmount}>ETB {(item.grandTotal || 0).toFixed(2)}</Text>
           </View>
         </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <MapPin color="#EF4444" size={16} />
            <Text style={styles.locationText}>Restaurant</Text>
          </View>
          <Text style={styles.locationAddress}>
            {item.restaurantLocation.name || 'Restaurant'}
          </Text>
          <Text style={styles.locationSubAddress}>
            {item.restaurantLocation.address || 
             (item.geocodingStatus?.restaurant === 'failed' ? 'Address not available' : 'Loading address...')}
          </Text>
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <Navigation color="#3B82F6" size={16} />
            <Text style={styles.locationText}>Delivery</Text>
          </View>
          <Text style={styles.locationAddress}>
            {item.deliveryLocation.address || 
             (item.geocodingStatus?.delivery === 'failed' ? 'Address not available' : 'Loading address...')}
          </Text>
        </View>

                 <View style={styles.orderDetails}>
           <View style={styles.detailItem}>
             <Text style={styles.detailLabel}>Delivery Fee</Text>
             <Text style={styles.detailValue}>ETB {(item.deliveryFee || 0).toFixed(2)}</Text>
           </View>
           <View style={styles.detailItem}>
             <Text style={styles.detailLabel}>Tip</Text>
             <Text style={styles.detailValue}>ETB {(item.tip || 0).toFixed(2)}</Text>
           </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>{item.order_id || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Clock color="#6B7280" size={16} />
            <Text style={styles.timeText}>
              {new Date(item.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptOrder(item)}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.acceptGradient}
          >
            <Text style={styles.acceptButtonText}>Accept Order</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  if (!isOnline) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineTitle}>You're Offline</Text>
          <Text style={styles.offlineText}>
            Go online from the dashboard to start receiving orders
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoadingOrders) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading available orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (ordersError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Orders</Text>
          <Text style={styles.errorText}>{ordersError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Orders</Text>
        <View style={styles.headerActions}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{availableOrders.length}</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {availableOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MapPin color="#9CA3AF" size={64} />
          <Text style={styles.emptyTitle}>No Orders Available</Text>
          <Text style={styles.emptyText}>
            No cooked orders are currently available for delivery. Check back later or pull to refresh.
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>Refresh Orders</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={availableOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingOrders}
              onRefresh={handleRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
        />
      )}
      
      {/* Order Modal */}
      <OrderModal
        visible={showOrderModalState}
        order={pendingOrderPopup}
        onAccept={acceptOrderFromModal}
        onDecline={declineOrder}
        onClose={hideOrderModal}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  countBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  orderCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  orderGradient: {
    padding: 20,
    borderRadius: 16,
  },
     orderHeader: {
     flexDirection: 'row',
     justifyContent: 'flex-end',
     alignItems: 'center',
     marginBottom: 16,
   },
   amountContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 4,
   },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  locationAddress: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 24,
    fontWeight: '600',
  },
  locationSubAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 24,
    marginTop: 2,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailItem: {
    alignItems: 'center',
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
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  offlineText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
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
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
