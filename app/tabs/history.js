import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { DollarSign, Clock, MapPin, TrendingUp, Package, Star, AlertCircle } from 'lucide-react-native';
import { useDelivery } from '../../providers/delivery-provider';

export default function HistoryScreen() {
  const { 
    orderHistory, 
    deliveryAnalytics, 
    fetchDeliveryHistory, 
    isLoadingHistory, 
    historyError 
  } = useDelivery();

  // Fetch delivery history when component mounts
  useEffect(() => {
    fetchDeliveryHistory();
  }, [fetchDeliveryHistory]);

  const handleRefresh = () => {
    fetchDeliveryHistory();
  };

  // Use analytics data if available, otherwise calculate from orderHistory
  const totalEarnings = deliveryAnalytics?.totalEarnings || orderHistory.reduce((sum, order) => sum + (order.deliveryFee || 0) + (order.tip || 0), 0);
  const totalDeliveries = deliveryAnalytics?.totalDeliveries || orderHistory.length;

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.orderId}>#{item.order_id}</Text>
        <View style={styles.amountContainer}>
          <DollarSign color="#10B981" size={16} />
          <Text style={styles.amount}>ETB {((item.deliveryFee || 0) + (item.tip || 0)).toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Restaurant:</Text>
          <Text style={styles.detailValue}>{item.restaurantLocation?.name || 'Unknown'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Delivery Fee:</Text>
          <Text style={styles.detailValue}>ETB {(item.deliveryFee || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tip:</Text>
          <Text style={styles.detailValue}>ETB {(item.tip || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={[styles.detailValue, styles.statusText, 
            item.orderStatus === 'Completed' ? styles.completedStatus : 
            item.orderStatus === 'Cancelled' ? styles.cancelledStatus : 
            styles.inProgressStatus]}>
            {item.orderStatus || 'Unknown'}
          </Text>
        </View>
      </View>

      <View style={styles.locationInfo}>
        <MapPin color="#6B7280" size={14} />
        <Text style={styles.locationText} numberOfLines={2}>
          {item.deliveryLocation?.address || 'Delivery Address'}
        </Text>
      </View>

      <View style={styles.historyFooter}>
        <View style={styles.timeContainer}>
          <Clock color="#6B7280" size={14} />
          <Text style={styles.timeText}>
            {new Date(item.createdAt).toLocaleDateString()} at{' '}
            {new Date(item.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderAnalyticsCard = (title, value, icon, color, subtitle) => (
    <LinearGradient
      colors={[color, color + '80']}
      style={styles.analyticsCard}
    >
      <View style={styles.analyticsIcon}>
        {icon}
      </View>
      <View style={styles.analyticsContent}>
        <Text style={styles.analyticsValue}>{value}</Text>
        <Text style={styles.analyticsTitle}>{title}</Text>
        {subtitle && <Text style={styles.analyticsSubtitle}>{subtitle}</Text>}
      </View>
    </LinearGradient>
  );

  if (isLoadingHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Delivery History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading delivery history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (historyError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Delivery History</Text>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle color="#EF4444" size={64} />
          <Text style={styles.errorTitle}>Error Loading History</Text>
          <Text style={styles.errorText}>{historyError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Delivery Analytics</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingHistory}
            onRefresh={handleRefresh}
            colors={['#10B981']}
          />
        }
      >
        {/* Analytics Cards */}
        {deliveryAnalytics && (
          <View style={styles.analyticsContainer}>
            <View style={styles.analyticsRow}>
              {renderAnalyticsCard(
                'Total Deliveries',
                deliveryAnalytics.totalDeliveries,
                <Package color="#FFFFFF" size={24} />,
                '#10B981'
              )}
              {renderAnalyticsCard(
                'Total Earnings',
                `ETB ${deliveryAnalytics.totalEarnings.toFixed(2)}`,
                <DollarSign color="#FFFFFF" size={24} />,
                '#3B82F6'
              )}
            </View>
            
            <View style={styles.analyticsRow}>
              {renderAnalyticsCard(
                'Delivery Fees',
                `ETB ${deliveryAnalytics.totalDeliveryFees.toFixed(2)}`,
                <TrendingUp color="#FFFFFF" size={24} />,
                '#F59E0B'
              )}
              {renderAnalyticsCard(
                'Total Tips',
                `ETB ${deliveryAnalytics.totalTips.toFixed(2)}`,
                <Star color="#FFFFFF" size={24} />,
                '#8B5CF6'
              )}
            </View>

            <View style={styles.analyticsRow}>
              {renderAnalyticsCard(
                'Avg Order Value',
                `ETB ${deliveryAnalytics.averageOrderValue.toFixed(2)}`,
                <TrendingUp color="#FFFFFF" size={24} />,
                '#EF4444'
              )}
              {renderAnalyticsCard(
                'Completed Orders',
                deliveryAnalytics.completedOrders,
                <Package color="#FFFFFF" size={24} />,
                '#10B981'
              )}
            </View>
          </View>
        )}

        {/* Order History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>📋 Order History</Text>
          
          {orderHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Clock color="#9CA3AF" size={64} />
              <Text style={styles.emptyTitle}>No Delivery History</Text>
              <Text style={styles.emptyText}>
                Your completed deliveries will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={orderHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.orderId}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
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
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  analyticsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  analyticsCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyticsIcon: {
    marginRight: 12,
  },
  analyticsContent: {
    flex: 1,
  },
  analyticsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  analyticsTitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  analyticsSubtitle: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  historySection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  historyCard: {
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
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
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
  orderDetails: {
    marginVertical: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  statusText: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedStatus: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  cancelledStatus: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  inProgressStatus: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
});
