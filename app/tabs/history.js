import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Filter, TrendingUp, DollarSign, Package, Award } from 'lucide-react-native';
import { useAuth } from '../../providers/auth-provider';

const { width } = Dimensions.get('window');

export default function HistoryScreen() {
  const { token } = useAuth();
  const [state, setState] = useState({
    isLoadingHistory: true,
    historyError: null,
    deliveryHistory: [],
    originalHistory: [], // Store original data for filtering
  });
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all', // 'today', 'week', 'month', 'all'
    sortBy: 'newest', // 'newest', 'oldest', 'highestEarning'
  });
  const [analytics, setAnalytics] = useState({
    totalEarnings: 0,
    tipEarnings: 0,
    totalDeliveries: 0,
    averageEarning: 0,
    highestEarning: 0,
  });

  // 📊 Fetch delivery person order history
  const fetchDeliveryHistory = useCallback(async () => {
    console.log("Fetching completed delivery history...");

    if (!token) {
      console.error("No authentication token available");
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

      if (!response.ok || data?.status !== "success") {
        throw new Error(data?.message || `HTTP ${response.status}: Failed to fetch orders`);
      }

      if (!data.data || !Array.isArray(data.data) || typeof data.count !== "number") {
        throw new Error("Invalid response format: missing data array or count");
      }

      const normalizedHistory = data.data
        .map((order) => {
          if (!order._id && !order.id) {
            console.warn("Skipping invalid order:", order);
            return null;
          }

          return {
            id: order._id || order.id,
            restaurantName: order.restaurantName || "Unknown Restaurant",
            deliveryFee: order.deliveryFee ?? 0,
            tip: order.tip ?? 0,
            totalEarnings: (order.deliveryFee ?? 0) + (order.tip ?? 0),
            orderStatus: order.orderStatus || "",
            orderCode: order.orderCode || "",
            updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null,
            createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
          };
        })
        .filter(Boolean); // Remove any nulls

      setState((prev) => ({
        ...prev,
        isLoadingHistory: false,
        deliveryHistory: normalizedHistory,
        originalHistory: normalizedHistory, // Store original for filtering
      }));

      console.log(`✅ Loaded ${normalizedHistory.length} completed deliveries`);

    } catch (error) {
      console.error("❌ Error fetching delivery history:", error);
      setState((prev) => ({
        ...prev,
        isLoadingHistory: false,
        historyError:
          error.message.includes("Failed to fetch")
            ? "Unable to connect to server. Please try again later."
            : error.message || "An unexpected error occurred.",
      }));
    }
  }, [token]);

  // Calculate analytics from delivery history
  const calculateAnalytics = useCallback((history) => {
    if (!history.length) {
      setAnalytics({
        totalEarnings: 0,
        tipEarnings: 0,
        totalDeliveries: 0,
        averageEarning: 0,
        highestEarning: 0,
      });
      return;
    }

    const totalEarnings = history.reduce((sum, order) => sum + order.totalEarnings, 0);
    const tipEarnings = history.reduce((sum, order) => sum + order.tip, 0);
    const totalDeliveries = history.length;
    const averageEarning = totalEarnings / totalDeliveries;
    const highestEarning = Math.max(...history.map(order => order.totalEarnings));

    setAnalytics({
      totalEarnings,
      tipEarnings,
      totalDeliveries,
      averageEarning,
      highestEarning,
    });
  }, []);

  // Apply filters to data
  const applyFilters = useCallback(() => {
    let filteredData = [...state.originalHistory];

    // Date range filtering
    const now = new Date();
    switch (filters.dateRange) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filteredData = filteredData.filter(order => 
          order.updatedAt && new Date(order.updatedAt) >= today
        );
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredData = filteredData.filter(order => 
          order.updatedAt && new Date(order.updatedAt) >= weekAgo
        );
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredData = filteredData.filter(order => 
          order.updatedAt && new Date(order.updatedAt) >= monthAgo
        );
        break;
      // 'all' shows everything
    }

    // Sorting
    switch (filters.sortBy) {
      case 'newest':
        filteredData.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        break;
      case 'oldest':
        filteredData.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
        break;
      case 'highestEarning':
        filteredData.sort((a, b) => b.totalEarnings - a.totalEarnings);
        break;
    }

    setState(prev => ({ ...prev, deliveryHistory: filteredData }));
    calculateAnalytics(filteredData);
  }, [filters, state.originalHistory, calculateAnalytics]);

  useEffect(() => {
    fetchDeliveryHistory();
  }, [fetchDeliveryHistory]);

  useEffect(() => {
    if (state.originalHistory.length > 0) {
      applyFilters();
    }
  }, [filters, state.originalHistory.length, applyFilters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveryHistory();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const AnalyticsCard = ({ title, value, subtitle, icon, color }) => (
    <LinearGradient
      colors={[color, `${color}DD`]}
      style={styles.analyticsCard}
    >
      <View style={styles.analyticsHeader}>
        {icon}
        <Text style={styles.analyticsTitle}>{title}</Text>
      </View>
      <Text style={styles.analyticsValue}>{value}</Text>
      {subtitle && <Text style={styles.analyticsSubtitle}>{subtitle}</Text>}
    </LinearGradient>
  );

  const OrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.restaurantName}>{item.restaurantName}</Text>
        <Text style={styles.orderCode}>{item.orderCode}</Text>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Delivery Fee:</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.deliveryFee)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tip:</Text>
          <Text style={[styles.detailValue, styles.tipValue]}>
            +{formatCurrency(item.tip)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={[styles.detailValue, styles.totalValue]}>
            {formatCurrency(item.totalEarnings)}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderFooter}>
        <Text style={styles.dateText}>{formatDate(item.updatedAt)}</Text>
        <View style={[styles.statusBadge, styles.completedBadge]}>
          <Text style={styles.statusText}>{item.orderStatus}</Text>
        </View>
      </View>
    </View>
  );

  if (state.isLoadingHistory && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading delivery history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state.historyError && state.deliveryHistory.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load History</Text>
          <Text style={styles.errorMessage}>{state.historyError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDeliveryHistory}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f7f7f7ff', '#ffffffff']}
        style={styles.header}
      >
        
      </LinearGradient>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Analytics Section */}
        <View style={styles.analyticsSection}>
          <Text style={styles.sectionTitle}>Performance Analytics</Text>
          <View style={styles.analyticsGrid}>
            <AnalyticsCard
              title="Total Earnings"
              value={formatCurrency(analytics.totalEarnings)}
              icon={<DollarSign size={16} color="#FFF" />}
              color="#10B981"
            />
            <AnalyticsCard
              title="Tip Earnings"
              value={formatCurrency(analytics.tipEarnings)}
              subtitle={`${((analytics.tipEarnings / analytics.totalEarnings) * 100 || 0).toFixed(1)}% of total`}
              icon={<Award size={16} color="#FFF" />}
              color="#F59E0B"
            />
            <AnalyticsCard
              title="Total Deliveries"
              value={analytics.totalDeliveries.toString()}
              icon={<Package size={16} color="#FFF" />}
              color="#3B82F6"
            />
            <AnalyticsCard
              title="Avg per Delivery"
              value={formatCurrency(analytics.averageEarning)}
              subtitle={`Highest: ${formatCurrency(analytics.highestEarning)}`}
              icon={<TrendingUp size={16} color="#FFF" />}
              color="#8B5CF6"
            />
          </View>
        </View>

        {/* Filters Section */}
        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>
            <Filter size={16} color="#666" /> Filters & Sorting
          </Text>
          
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Date Range:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                {['today', 'week', 'month', 'all'].map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[
                      styles.filterButton,
                      filters.dateRange === range && styles.filterButtonActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, dateRange: range }))}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      filters.dateRange === range && styles.filterButtonTextActive
                    ]}>
                      {range.charAt(0).toUpperCase() + range.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Sort By:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                {[
                  { value: 'newest', label: 'Newest' },
                  { value: 'oldest', label: 'Oldest' },
                  { value: 'highestEarning', label: 'Highest Earning' }
                ].map((sort) => (
                  <TouchableOpacity
                    key={sort.value}
                    style={[
                      styles.filterButton,
                      filters.sortBy === sort.value && styles.filterButtonActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, sortBy: sort.value }))}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      filters.sortBy === sort.value && styles.filterButtonTextActive
                    ]}>
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Orders List */}
        <View style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order History</Text>
            <Text style={styles.resultsCount}>
              Showing {state.deliveryHistory.length} orders
            </Text>
          </View>

          {state.deliveryHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No orders found</Text>
              <Text style={styles.emptyStateText}>
                {filters.dateRange !== 'all' 
                  ? `No completed deliveries in the selected period.`
                  : 'No completed delivery history yet.'
                }
              </Text>
            </View>
          ) : (
            <FlatList
              data={state.deliveryHistory}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <OrderItem item={item} />}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
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
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E2E8F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  analyticsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsCard: {
    width: (width - 40) / 2 - 4,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  analyticsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 6,
    opacity: 0.9,
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  analyticsSubtitle: {
    fontSize: 10,
    color: '#FFF',
    opacity: 0.8,
  },
  filtersSection: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    width: 80,
    marginRight: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flex: 1,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  ordersSection: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  orderCode: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  tipValue: {
    color: '#10B981',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
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
    color: '#065F46',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});