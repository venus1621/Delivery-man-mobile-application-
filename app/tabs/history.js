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
  Clock, 
  DollarSign, 
  MapPin, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  Filter,
  Search
} from 'lucide-react-native';
import { useDelivery } from '../../providers/delivery-provider';
import { useAuth } from '../../providers/auth-provider';

export default function HistoryScreen() {
  const { 
    orderHistory, 
    deliveryAnalytics, 
    fetchDeliveryHistory,
    isLoadingHistory,
    historyError 
  } = useDelivery();
  
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, today, week, month
  const [sortBy, setSortBy] = useState('date'); // date, earnings, distance

  useEffect(() => {
    fetchDeliveryHistory();
  }, [fetchDeliveryHistory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveryHistory();
    setRefreshing(false);
  };

  const filteredOrders = orderHistory.filter(order => {
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'today':
        return orderDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= monthAgo;
      default:
        return true;
    }
  }).sort((a, b) => {
    switch (sortBy) {
      case 'earnings':
        return (b.deliveryFee + b.tip) - (a.deliveryFee + a.tip);
      case 'date':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTotalEarnings = () => {
    return filteredOrders.reduce((sum, order) => sum + (order.deliveryFee || 0) + (order.tip || 0), 0);
  };

  const getTotalDeliveries = () => {
    return filteredOrders.length;
  };

  const showFilterOptions = () => {
    Alert.alert(
      'Filter Options',
      'Choose how to sort your delivery history:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sort by Date (Newest First)', onPress: () => setSortBy('date') },
        { text: 'Sort by Earnings (Highest First)', onPress: () => setSortBy('earnings') },
      ]
    );
  };

  const showPeriodOptions = () => {
    Alert.alert(
      'Time Period',
      'Choose the time period to view:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'All Time', onPress: () => setSelectedPeriod('all') },
        { text: 'Today', onPress: () => setSelectedPeriod('today') },
        { text: 'This Week', onPress: () => setSelectedPeriod('week') },
        { text: 'This Month', onPress: () => setSelectedPeriod('month') },
      ]
    );
  };

  if (isLoadingHistory && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Loading delivery history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (historyError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load History</Text>
          <Text style={styles.errorMessage}>{historyError}</Text>
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
          <Text style={styles.title}>Delivery History</Text>
          <Text style={styles.subtitle}>
            {selectedPeriod === 'all' ? 'All deliveries' : 
             selectedPeriod === 'today' ? 'Today\'s deliveries' :
             selectedPeriod === 'week' ? 'This week\'s deliveries' :
             'This month\'s deliveries'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={showPeriodOptions}
          >
            <Calendar color="#1E40AF" size={20} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={showFilterOptions}
          >
            <Filter color="#1E40AF" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.summaryCard}
        >
          <DollarSign color="#FFFFFF" size={24} />
          <Text style={styles.summaryNumber}>ETB {getTotalEarnings().toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
        </LinearGradient>

        <LinearGradient
          colors={['#3B82F6', '#1D4ED8']}
          style={styles.summaryCard}
        >
          <CheckCircle color="#FFFFFF" size={24} />
          <Text style={styles.summaryNumber}>{getTotalDeliveries()}</Text>
          <Text style={styles.summaryLabel}>Completed Deliveries</Text>
        </LinearGradient>
      </View>

      {/* Analytics Card */}
      {deliveryAnalytics && (
        <View style={styles.analyticsContainer}>
          <Text style={styles.analyticsTitle}>Performance Overview</Text>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>
                {deliveryAnalytics.averageDeliveryFee?.toFixed(2) || '0.00'}
              </Text>
              <Text style={styles.analyticsLabel}>Avg. Delivery Fee</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>
                {deliveryAnalytics.averageTip?.toFixed(2) || '0.00'}
              </Text>
              <Text style={styles.analyticsLabel}>Avg. Tip</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>
                {deliveryAnalytics.averageDistance?.toFixed(1) || '0.0'}km
              </Text>
              <Text style={styles.analyticsLabel}>Avg. Distance</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>
                {deliveryAnalytics.averageTime || '0'}min
              </Text>
              <Text style={styles.analyticsLabel}>Avg. Time</Text>
            </View>
          </View>
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
            <CheckCircle color="#6B7280" size={48} />
            <Text style={styles.emptyTitle}>No Deliveries Found</Text>
            <Text style={styles.emptyMessage}>
              {selectedPeriod === 'all' 
                ? "You haven't completed any deliveries yet."
                : `No deliveries found for ${selectedPeriod}.`
              }
            </Text>
          </View>
        ) : (
          filteredOrders.map((order, index) => (
            <TouchableOpacity 
              key={order.orderId || index}
              style={styles.orderCard}
              onPress={() => {
                // Navigate to order details if needed
                console.log('Order selected:', order.orderId);
              }}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>#{order.order_id || order.orderId}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
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
                  <Clock color="#6B7280" size={16} />
                  <Text style={styles.detailText}>
                    {formatTime(order.createdAt)}
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

              <View style={styles.orderStatus}>
                <View style={[styles.statusBadge, styles.completedBadge]}>
                  <CheckCircle color="#10B981" size={14} />
                  <Text style={styles.statusText}>Completed</Text>
                </View>
              </View>
            </TouchableOpacity>
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
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  analyticsContainer: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  analyticsItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  analyticsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#6B7280',
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
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  orderDate: {
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
    marginBottom: 12,
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
  orderStatus: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
});