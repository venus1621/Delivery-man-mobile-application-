import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Truck, DollarSign, Clock, MapPin, Wifi, WifiOff, TestTube, Bug } from 'lucide-react-native';
import { useDelivery } from '../../providers/delivery-provider';
import { useAuth } from '../../providers/auth-provider';
import { router } from 'expo-router';
import OrderModal from '../../components/OrderModal';
import BroadcastMessage from '../../components/BroadcastMessage';
import VerificationModal from '../../components/VerificationModal';

const { width } = Dimensions.get('window');


export default function DashboardScreen() {
  const { 
    isConnected, 
    isOnline, 
    availableOrdersCount, 
    activeOrder, 
    toggleOnlineStatus,
    orderHistory,
    socket,
    fetchActiveOrder,
    isLoadingActiveOrder,
    activeOrderError,
    verifyDelivery,
    availableOrders,
    pendingOrderPopup,
    showOrderModal: showOrderModalState,
    showOrderModalFn,
    hideOrderModal,
    acceptOrderFromModal,
    declineOrder,
    joinDeliveryMethod,
    clearBroadcastMessages,
    clearNewOrderNotification,
    broadcastMessages,
    newOrderNotification,
    acceptedOrder,
    calculateDistance,
    fetchAvailableOrders,
  } = useDelivery();

  const { userId, clearAllData } = useAuth();

  const [showBroadcastMessages, setShowBroadcastMessages] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [orderIdToVerify, setOrderIdToVerify] = useState(null);

  // Debug function to test order modal
  const testOrderModal = () => {
         const testOrder = {
      orderId: 'test-123',
      order_id: 'TEST-001',
      restaurantLocation: { lat: 9.0192, lng: 38.7525 },
      deliveryLocation: { lat: 9.0300, lng: 38.7600, address: '123 Test Street, Addis Ababa' },
      deliveryFee: 250.00,
      tip: 150.00,
      grandTotal: 400.00,
      createdAt: new Date().toISOString(),
      customer: {
        name: 'Test Customer',
        phone: '+251912345678'
      },
      items: [
        { name: 'Test Pizza', quantity: 1 },
        { name: 'Test Drink', quantity: 2 }
      ],
      specialInstructions: 'Test delivery instructions'
    };
   
   showOrderModalFn(testOrder);
  };

  // Test new order notification
  const testNewOrderNotification = () => {
    const testOrder = {
      orderId: 'test-new-' + Date.now(),
      order_id: 'NEW-' + Date.now(),
      restaurantLocation: { lat: 9.0192, lng: 38.7525 },
      deliveryLocation: { lat: 9.0300, lng: 38.7600, address: '123 Test Street, Addis Ababa' },
      deliveryFee: 300.00,
      tip: 200.00,
      grandTotal: 500.00,
      createdAt: new Date().toISOString(),
      customer: {
        name: 'New Test Customer',
        phone: '+251987654321'
      },
      items: [
        { name: 'Test Burger', quantity: 2 },
        { name: 'Test Fries', quantity: 1 }
      ],
      specialInstructions: 'Please ring the doorbell twice'
    };
    
    // Simulate the socket event by calling showOrderModalFn and setting notification
    showOrderModalFn(testOrder);
    // Note: The notification flag will be set automatically by the socket handler
    // For testing, we can manually trigger it
    console.log('🧪 Testing new order notification with order:', testOrder);
    
    Alert.alert(
      '🧪 Test New Order',
      'Simulating a new order from the backend. The order modal should appear automatically.',
      [{ text: 'OK' }]
    );
  };
  
  // Test socket connection
  const testSocketConnection = () => {
    console.log('🧪 Testing socket connection...');
    if (!isOnline) {
      Alert.alert('⚠️ Not Online', 'Please go online first to test the connection.');
      return;
    }
    
    if (socket) {
      console.log('Socket exists:', socket.id);
      console.log('Socket connected:', socket.connected);
      console.log('Socket transport:', socket.io.engine?.transport?.name);
      
      Alert.alert(
        '🔍 Socket Test',
        `Socket ID: ${socket.id || 'None'}\nConnected: ${socket.connected}\nTransport: ${socket.io.engine?.transport?.name || 'Unknown'}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('❌ No Socket', 'Socket is not initialized.');
    }
  };

  // Test delivery method joining
  const testDeliveryMethod = (method) => {
    if (!isOnline) {
      Alert.alert('⚠️ Not Online', 'Please go online first to test delivery methods.');
      return;
    }
    
    joinDeliveryMethod(method);
    Alert.alert(
      '🚗 Delivery Method',
      `Joined ${method} delivery method. You'll now receive orders optimized for ${method} delivery.`,
      [{ text: 'OK' }]
    );
  };
  const showDebugInfo = () => {
    Alert.alert(
      '🐛 Debug Info',
      `Socket Connected: ${isConnected ? 'Yes' : 'No'}\n` +
      `Online Status: ${isOnline ? 'Online' : 'Offline'}\n` +
      `Socket ID: ${socket?.id || 'None'}\n` +
      `Available Orders: ${availableOrders.length}\n` +
      `Orders Count: ${availableOrdersCount}\n` +
      `Active Order: ${activeOrder ? 'Yes' : 'No'}\n` +
      `Accepted Order: ${acceptedOrder ? 'Yes' : 'No'}\n` +
      `New Order Notification: ${newOrderNotification ? 'Yes' : 'No'}\n` +
      `Show Order Modal: ${showOrderModalState ? 'Yes' : 'No'}\n` +
      `Delivery Person ID: ${userId || 'Not Set'}`,
      [{ text: 'OK' }]
    );
  };

  const handleClearData = async () => {
    Alert.alert(
      '🧹 Clear All Data',
      'This will clear all stored data and log you out. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            const result = await clearAllData();
            if (result.success) {
              Alert.alert('Success', 'All data cleared. You will be redirected to login.');
              router.replace('/login');
            } else {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const forceLoginPage = () => {
    Alert.alert(
      '🔄 Force Login Page',
      'This will redirect you to the login page. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go to Login',
          style: 'default',
          onPress: () => {
            router.replace('/login');
          },
        },
      ]
    );
  };

  const testLogout = () => {
    Alert.alert(
      '🧪 Test Logout',
      'This will test the logout functionality. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🧪 Testing logout...');
              // This will trigger the logout from the auth provider
              router.replace('/login');
              console.log('✅ Logout test completed');
            } catch (error) {
              console.error('❌ Logout test failed:', error);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    console.log('Dashboard mounted. Connection status:', isConnected, 'Online:', isOnline);
  }, [isConnected, isOnline]);

  // Fetch orders and active order when going online
  useEffect(() => {
    if (isOnline) {
      fetchAvailableOrders();
      fetchActiveOrder();
    }
  }, [isOnline, fetchAvailableOrders, fetchActiveOrder]);

  // Handle complete order with verification
  const handleCompleteOrder = () => {
    if (activeOrder) {
      setOrderIdToVerify(activeOrder.orderId);
      setShowVerificationModal(true);
    }
  };

  // Handle verification code submission
  const handleVerifyDelivery = async (verificationCode) => {
    if (!orderIdToVerify) {
      Alert.alert("Error", "No order selected for verification.");
      return;
    }

    setIsVerifying(true);
    try {
      console.log('Verifying delivery for order:', orderIdToVerify);
      console.log('Verification code:', verificationCode);
      const result = await verifyDelivery(orderIdToVerify, verificationCode);
      if (result.success) {
        setShowVerificationModal(false);
        setOrderIdToVerify(null);
        // Fetch updated active order after successful verification
        await fetchActiveOrder();
      }
    } catch (error) {
      console.error('Error verifying delivery:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  // Close verification modal
  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false);
    setOrderIdToVerify(null);
  };

  const todayEarnings = orderHistory
    .filter(order => {
      const today = new Date().toDateString();
      const orderDate = new Date(order.createdAt).toDateString();
      return orderDate === today;
    })
    .reduce((sum, order) => sum + order.grandTotal, 0);

  const todayDeliveries = orderHistory.filter(order => {
    const today = new Date().toDateString();
    const orderDate = new Date(order.createdAt).toDateString();
    return orderDate === today;
  }).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.driverName}>Driver</Text>
          </View>
          <TouchableOpacity 
            style={[styles.statusButton, isOnline ? styles.online : styles.offline]}
            onPress={toggleOnlineStatus}
          >
            {isOnline ? (
              <Wifi color="#FFFFFF" size={20} />
            ) : (
              <WifiOff color="#FFFFFF" size={20} />
            )}
            <Text style={styles.statusText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        {isOnline && (
          <View style={[styles.connectionStatus, isConnected ? styles.connected : styles.disconnected]}>
            <Text style={styles.connectionText}>
              {isConnected ? '🟢 Connected to server' : '🔴 Connecting...'}
            </Text>
          </View>
        )}

        {/* Broadcast Messages Indicator */}
        {broadcastMessages.length > 0 && (
          <TouchableOpacity 
            style={styles.broadcastIndicator}
            onPress={() => setShowBroadcastMessages(true)}
          >
            <LinearGradient
              colors={['#3B82F6', '#1E40AF']}
              style={styles.broadcastGradient}
            >
              <Text style={styles.broadcastText}>
                📢 {broadcastMessages.length} new message{broadcastMessages.length > 1 ? 's' : ''} from server
              </Text>
              <Text style={styles.broadcastTapText}>Tap to view</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* New Order Notification */}
        {newOrderNotification && (
          <TouchableOpacity 
            style={styles.newOrderIndicator}
            onPress={clearNewOrderNotification}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.newOrderGradient}
            >
              <Text style={styles.newOrderText}>
                🍲 New order available! Tap to dismiss
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#3B82F6', '#1E40AF']}
            style={styles.statCard}
          >
            <View style={styles.statIcon}>
              <MapPin color="#FFFFFF" size={24} />
            </View>
            <Text style={styles.statNumber}>{availableOrdersCount}</Text>
            <Text style={styles.statLabel}>Available Orders</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.statCard}
          >
            <View style={styles.statIcon}>
              <DollarSign color="#FFFFFF" size={24} />
            </View>
                         <Text style={styles.statNumber}>ETB {(todayEarnings || 0).toFixed(2)}</Text>
            <Text style={styles.statLabel}>Today&apos;s Earnings</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.statCard}
          >
            <View style={styles.statIcon}>
              <Truck color="#FFFFFF" size={24} />
            </View>
            <Text style={styles.statNumber}>{todayDeliveries}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </LinearGradient>
        </View>

        {/* Currently Delivering Order */}
        {activeOrder && activeOrder.orderStatus === 'Delivering' && (
        
          <View style={styles.activeOrderContainer}>
            <Text style={styles.sectionTitle}>🚚 Currently Delivering</Text>
            <TouchableOpacity 
              style={styles.activeOrderCard}
              onPress={() => router.push(`/order/${activeOrder.order_id || activeOrder.orderCode}`)}
            >
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.activeOrderGradient}
              >
                <View style={styles.activeOrderHeader}>
                  <Text style={styles.activeOrderCode}>{activeOrder.orderCode || activeOrder.order_id}</Text>
                  <Text style={styles.activeOrderStatus}>{activeOrder.orderStatus}</Text>
                </View>
                
                <View style={styles.activeOrderInfo}>
                  <View style={styles.activeOrderInfoRow}>
                    <Text style={styles.activeOrderLabel}>Restaurant:</Text>
                    <Text style={styles.activeOrderValue}>{activeOrder.restaurantName || activeOrder.restaurantLocation?.name || 'Unknown'}</Text>
                  </View>
                  <View style={styles.activeOrderInfoRow}>
                    <Text style={styles.activeOrderLabel}>Pickup Code:</Text>
                    <Text style={styles.activeOrderValue}>{activeOrder.pickUpVerificationCode || activeOrder.verificationCode || 'N/A'}</Text>
                  </View>
                  <View style={styles.activeOrderInfoRow}>
                    <Text style={styles.activeOrderLabel}>Total Earnings:</Text>
                    <Text style={styles.activeOrderEarnings}>ETB {(activeOrder.grandTotal || 0).toFixed(2)}</Text>
                  </View>
                </View>
                
                <View style={styles.activeOrderFooter}>
                  <Text style={styles.activeOrderTapText}>Tap for details</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/orders')}
            >
              <MapPin color="#1E40AF" size={24} />
              <Text style={styles.quickActionText}>View Orders</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/history')}
            >
              <Clock color="#1E40AF" size={24} />
              <Text style={styles.quickActionText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Debug Section */}
        <View style={styles.debugContainer}>
          <Text style={styles.sectionTitle}>Debug & Testing</Text>
           <View style={styles.quickActions}>
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={testOrderModal}
             >
               <TestTube color="#EF4444" size={20} />
               <Text style={styles.debugButtonText}>Test Modal</Text>
             </TouchableOpacity>
             
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={testNewOrderNotification}
             >
               <TestTube color="#EF4444" size={20} />
               <Text style={styles.debugButtonText}>Test New Order</Text>
             </TouchableOpacity>
           </View>
           
           <View style={styles.quickActions}>
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={showDebugInfo}
             >
               <Bug color="#EF4444" size={20} />
               <Text style={styles.debugButtonText}>Debug Info</Text>
             </TouchableOpacity>
             
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={clearNewOrderNotification}
             >
               <Text style={styles.debugButtonText}>Clear Notification</Text>
             </TouchableOpacity>
           </View>
          
                     <View style={styles.quickActions}>
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={testSocketConnection}
             >
               <Wifi color="#EF4444" size={20} />
               <Text style={styles.debugButtonText}>Test Socket</Text>
             </TouchableOpacity>
             
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={() => testDeliveryMethod('Car')}
             >
               <Text style={styles.debugButtonText}>Join Car</Text>
             </TouchableOpacity>
           </View>
           
           <View style={styles.quickActions}>
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={() => testDeliveryMethod('Motor')}
             >
               <Text style={styles.debugButtonText}>Join Motor</Text>
             </TouchableOpacity>
             
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={() => testDeliveryMethod('Bicycle')}
             >
               <Text style={styles.debugButtonText}>Join Bicycle</Text>
             </TouchableOpacity>
           </View>
           
           <View style={styles.quickActions}>
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={fetchAvailableOrders}
             >
               <Text style={styles.debugButtonText}>Fetch Orders + Geocode</Text>
             </TouchableOpacity>
             
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={() => console.log('Available orders:', availableOrders)}
             >
               <Text style={styles.debugButtonText}>Log Orders</Text>
             </TouchableOpacity>
           </View>
           
           <View style={styles.quickActions}>
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={handleClearData}
             >
               <Text style={styles.debugButtonText}>Clear Data</Text>
             </TouchableOpacity>
             
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={() => console.log('Current user ID:', userId)}
             >
               <Text style={styles.debugButtonText}>Log User ID</Text>
             </TouchableOpacity>
           </View>
           
           <View style={styles.quickActions}>
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={forceLoginPage}
             >
               <Text style={styles.debugButtonText}>Force Login</Text>
             </TouchableOpacity>
             
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={testLogout}
             >
               <Text style={styles.debugButtonText}>Test Logout</Text>
             </TouchableOpacity>
           </View>
           
           <View style={styles.quickActions}>
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={() => console.log('Auth state:', { isAuthenticated: true, userId })}
             >
               <Text style={styles.debugButtonText}>Log Auth State</Text>
             </TouchableOpacity>
             
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={() => console.log('Delivery state:', { isOnline, isConnected, availableOrdersCount })}
             >
               <Text style={styles.debugButtonText}>Log Delivery State</Text>
             </TouchableOpacity>
             
             <TouchableOpacity 
               style={styles.debugButton}
               onPress={() => {
                 const testLocation = JSON.stringify({
                   lat: 9.0192,
                   lng: 38.7525,
                   name: 'Test Restaurant',
                   address: 'Addis Ababa, Ethiopia'
                 });
                 router.push({
                   pathname: '/map',
                   params: { restaurantLocation: testLocation }
                 });
               }}
             >
               <Text style={styles.debugButtonText}>Test Map</Text>
             </TouchableOpacity>
           </View>
        </View>
      </ScrollView>
      
             {/* Order Modal */}
       {showOrderModalState && pendingOrderPopup && (
         <OrderModal
           visible={showOrderModalState}
           order={pendingOrderPopup}
           onAccept={acceptOrderFromModal}
           onDecline={declineOrder}
           onClose={hideOrderModal}
         />
       )}

       {/* Verification Modal */}
       <VerificationModal
         visible={showVerificationModal}
         onClose={handleCloseVerificationModal}
         onVerify={handleVerifyDelivery}
         orderId={orderIdToVerify}
         orderCode={activeOrder?.order_id}
         isLoading={isVerifying}
       />

       {/* Broadcast Messages */}
       <BroadcastMessage
         visible={showBroadcastMessages}
         messages={broadcastMessages}
         onClose={() => setShowBroadcastMessages(false)}
         onClear={clearBroadcastMessages}
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
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  online: {
    backgroundColor: '#10B981',
  },
  offline: {
    backgroundColor: '#6B7280',
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  connectionStatus: {
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  connected: {
    backgroundColor: '#D1FAE5',
  },
  disconnected: {
    backgroundColor: '#FEE2E2',
  },
     connectionText: {
     fontSize: 14,
     fontWeight: '500',
     textAlign: 'center',
   },
   broadcastIndicator: {
     marginHorizontal: 20,
     marginBottom: 20,
     borderRadius: 12,
     overflow: 'hidden',
   },
   broadcastGradient: {
     paddingHorizontal: 16,
     paddingVertical: 12,
   },
   broadcastText: {
     fontSize: 14,
     fontWeight: '600',
     color: '#FFFFFF',
     textAlign: 'center',
   },
   broadcastTapText: {
     fontSize: 12,
     color: '#FFFFFF',
     opacity: 0.8,
     textAlign: 'center',
     marginTop: 4,
   },
   newOrderIndicator: {
     marginHorizontal: 20,
     marginBottom: 20,
     borderRadius: 12,
     overflow: 'hidden',
   },
   newOrderGradient: {
     paddingHorizontal: 16,
     paddingVertical: 12,
   },
   newOrderText: {
     fontSize: 14,
     fontWeight: '600',
     color: '#FFFFFF',
     textAlign: 'center',
   },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  activeOrderContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  activeOrderCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  activeOrderGradient: {
    padding: 20,
  },
  activeOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeOrderCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activeOrderStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeOrderInfo: {
    marginBottom: 16,
  },
  activeOrderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeOrderLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  activeOrderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeOrderEarnings: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activeOrderFooter: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeOrderTapText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    fontStyle: 'italic',
  },
  acceptedOrderContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  acceptedOrderCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  acceptedOrderGradient: {
    padding: 20,
  },
  acceptedOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  acceptedOrderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  acceptedOrderTime: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  acceptedOrderDetails: {
    marginBottom: 16,
  },
  acceptedOrderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  acceptedOrderLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  acceptedOrderValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  acceptedOrderMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  acceptedOrderMessageContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  acceptedOrderSubMessage: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 4,
  },
  completeOrderButton: {
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  completeOrderButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeOrderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
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
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginTop: 8,
  },
  debugContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  debugButton: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  debugButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 6,
  },
});
