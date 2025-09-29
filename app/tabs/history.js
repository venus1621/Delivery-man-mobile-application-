import React, { useEffect, useState, useCallback } from 'react';
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
  CheckCircle, 
  TrendingUp,
  Calendar,
  Filter,
} from 'lucide-react-native';

import { useAuth } from '../../providers/auth-provider';

export default function HistoryScreen() {
   const { token } = useAuth();
  
  const [state, setState] = useState({
    deliveryHistory: [],
    isLoadingHistory: false,
    historyError: null,
    totalCount: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, today, week, month
  const [sortBy, setSortBy] = useState('date'); // date, earnings
  

  const fetchDeliveryHistory = useCallback(async () => {
    console.log("📊 Fetching delivery history from API...");

    if (!token) {
      console.error("❌ No authentication token available");
      setState((prev) => ({
        ...prev,
        isLoadingHistory: false,
        historyError: "Authentication required. Please log in again.",
      }));
      return;
    }

    try {
      setState((prev) => ({
        ...prev,
        isLoadingHistory: true,
        historyError: null,
      }));

      const response = await fetch(
        "https://gebeta-delivery1.onrender.com/api/v1/orders/get-orders-by-DeliveryMan?status=Completed",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log("🔍 Delivery history raw data:", data);

      if (!response.ok || data?.status !== "success") {
        throw new Error(data?.message || "Failed to fetch delivery history");
      }

      if (!Array.isArray(data.data)) {
        throw new Error("Invalid data format received from server");
      }

      setState((prev) => ({
        ...prev,
        isLoadingHistory: false,
        deliveryHistory: data.data.map(order => ({
          restaurantName: order.restaurantName,
          deliveryFee: order.deliveryFee,
          tip: order.tip,
          description: order.description,
          orderStatus: order.orderStatus,
          updatedAt: new Date(order.updatedAt).toISOString(),
        })),
        historyError: null,
        totalCount: data.count,
      }));

    } catch (error) {
      console.error("❌ Error fetching delivery history:", error);
      setState((prev) => ({
        ...prev,
        isLoadingHistory: false,
        historyError: error.message || "Network error. Please check your connection.",
      }));
    }
  }, [token]);

  useEffect(() => {
    fetchDeliveryHistory();
  }, [fetchDeliveryHistory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveryHistory();
    setRefreshing(false);
  };

  const filteredOrders = state.deliveryHistory.filter(order => {
    if (!order.updatedAt) return false;
    const orderDate = new Date(order.updatedAt);
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
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    }
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid Time';
    }
  };

  const getTotalEarnings = () => {
    return filteredOrders.reduce((sum, order) => sum + (order.deliveryFee || 0) + (order.tip || 0), 0);
  };

  const getTotalDeliveryEarnings = () => {
    return filteredOrders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);
  };

  const getTotalTipEarnings = () => {
    return filteredOrders.reduce((sum, order) => sum + (order.tip || 0), 0);
  };

  const getTotalDeliveries = () => {
    return filteredOrders.length;
  };

  const getStatistics = () => {
    if (filteredOrders.length === 0) return null;

    const totalEarnings = getTotalEarnings();
    const totalDeliveries = getTotalDeliveries();
    const avgEarningsPerDelivery = totalEarnings / totalDeliveries;
    const tipPercentage = getTotalDeliveryEarnings() > 0 
      ? (getTotalTipEarnings() / getTotalDeliveryEarnings()) * 100 
      : 0;

    return {
      totalEarnings,
      totalDeliveries,
      avgEarningsPerDelivery,
      tipPercentage,
    };
  };

  const showFilterOptions = () => {
    Alert.alert(
      'Sort Options',
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

  if (state.isLoadingHistory && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Loading delivery history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state.historyError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load History</Text>
          <Text style={styles.errorMessage}>{state.historyError}</Text>
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
            {selectedPeriod === 'all' ? 'All Deliveries' : 
             selectedPeriod === 'today' ? 'Today\'s Deliveries' :
             selectedPeriod === 'week' ? 'This Week\'s Deliveries' :
             'This Month\'s Deliveries'}
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

      {/* Statistics Section */}
      {getStatistics() && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>📊 Grand Total Statistics</Text>
          <View style={styles.statsGrid}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.statCard}
            >
              <DollarSign color="#FFFFFF" size={24} />
              <Text style={styles.statNumber}>ETB {getStatistics().totalEarnings.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </LinearGradient>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.statCard}
            >
              <CheckCircle color="#FFFFFF" size={24} />
              <Text style={styles.statNumber}>{getStatistics().totalDeliveries}</Text>
              <Text style={styles.statLabel}>Total Deliveries</Text>
            </LinearGradient>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.statCard}
            >
              <TrendingUp color="#FFFFFF" size={24} />
              <Text style={styles.statNumber}>ETB {getStatistics().avgEarningsPerDelivery.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Avg. Earnings/Delivery</Text>
            </LinearGradient>
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              style={styles.statCard}
            >
              <TrendingUp color="#FFFFFF" size={24} />
              <Text style={styles.statNumber}>{getStatistics().tipPercentage.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Tip Percentage</Text>
            </LinearGradient>
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
                : `No deliveries found for ${selectedPeriod}.`}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order, index) => (
            <View key={index} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderDate}>{formatDate(order.updatedAt)}</Text>
                  <Text style={styles.orderTime}>{formatTime(order.updatedAt)}</Text>
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
                  <Text style={styles.detailLabel}>Restaurant:</Text>
                  <Text style={styles.detailText}>{order.restaurantName || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailText}>{order.description || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Delivery Fee:</Text>
                  <Text style={styles.detailText}>ETB {order.deliveryFee?.toFixed(2) || '0.00'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tip:</Text>
                  <Text style={styles.detailText}>ETB {order.tip?.toFixed(2) || '0.00'}</Text>
                </View>
              </View>

              <View style={styles.orderStatus}>
                <View style={[styles.statusBadge, styles.completedBadge]}>
                  <CheckCircle color="#10B981" size={14} />
                  <Text style={styles.statusText}>{order.orderStatus}</Text>
                </View>
              </View>
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
  statsContainer: {
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
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 6,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
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
  orderDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  orderTime: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
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
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 100,
  },
  detailText: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
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