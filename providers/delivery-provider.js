import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import { useAuth } from "./auth-provider";

// Reverse geocoding function using OpenStreetMap (free, no API key required)
const getAddressFromCoordinates = async (lat, lng) => {
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
    console.error('Error fetching address from coordinates:', error);
    return null;
  }
};

const DeliveryContext = createContext();
export const useDelivery = () => useContext(DeliveryContext);

export const DeliveryProvider = ({ children }) => {
  const { userId, token } = useAuth();

  const [state, setState] = useState({
    availableOrders: [],
    availableOrdersCount: 0,
    activeOrder: null,
    pendingOrderPopup: null,
    showOrderModal: false,
    isConnected: false,
    isOnline: false,
    orderHistory: [],
    socket: null,
    broadcastMessages: [],
    newOrderNotification: false, // Track if there's a new order notification
    isLoadingOrders: false, // Loading state for API calls
    ordersError: null, // Error state for API calls
    acceptedOrder: null, // Store accepted order information
    storedOrder: null, // Store order from phone storage
    isLoadingStoredOrder: false, // Loading state for stored order
    deliveryAnalytics: null, // Analytics data for delivery history
    isLoadingHistory: false, // Loading state for history API
    historyError: null, // Error state for history API
    isLoadingActiveOrder: false, // Loading state for active order API
    activeOrderError: null, // Error state for active order API
  });

  const socketRef = useRef(null);

  // 🔌 Connect to socket server
  useEffect(() => {
    const socket = io("https://gebeta-delivery1.onrender.com", {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to socket:", socket.id);
      // Join delivery group
      socket.emit("joinRole", "Delivery_Person");
      setState((prev) => ({ ...prev, isConnected: true, socket }));
    });

    // 📊 Orders count updates
    socket.on("available-orders-count", ({ count }) => {
      console.log("📊 Available orders count:", count);
      setState((prev) => ({ ...prev, availableOrdersCount: count }));
    });

    // 🍲 New cooked orders (from backend updateOrderStatus)
    socket.on("order:cooked", (order) => {
      console.log("🍲 Cooked order available:", order);
      setState((prev) => ({
        ...prev,
        availableOrders: [...prev.availableOrders, order],
        availableOrdersCount: prev.availableOrdersCount + 1,
        // Automatically show the order modal for new orders
        pendingOrderPopup: order,
        showOrderModal: true,
        newOrderNotification: true, // Set notification flag
      }));
    });

    // 📦 When an order is accepted by ANY driver
    socket.on("order:accepted", (order) => {
      console.log("📦 Order accepted broadcast:", order);
      setState((prev) => ({
        ...prev,
        availableOrders: prev.availableOrders.filter(
          (o) => o.orderId !== order.orderId
        ),
        availableOrdersCount: Math.max(0, prev.availableOrdersCount - 1),
      }));
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from socket");
      setState((prev) => ({ ...prev, isConnected: false }));
    });

    return () => {
      socket.off("available-orders-count");
      socket.off("order:cooked");
      socket.off("order:accepted");
      socket.disconnect();
    };
  }, []);

  // 📱 Storage functions for accepted orders
  const STORAGE_KEYS = {
    ACCEPTED_ORDER: 'delivery_accepted_order',
    ORDER_TIMESTAMP: 'delivery_order_timestamp',
  };

  const fetchActiveOrder = useCallback(async () => {
    console.log("🍲 Fetching active cooked order from API...");
    
    if (!token) {
      console.error("❌ No authentication token available");
      setState((prev) => ({
        ...prev,
        isLoadingActiveOrder: false,
        activeOrderError: 'Authentication required. Please log in again.',
      }));
      return;
    }
    
    try {
      setState((prev) => ({ ...prev, isLoadingActiveOrder: true, activeOrderError: null }));
      
      const response = await fetch('https://gebeta-delivery1.onrender.com/api/v1/orders/get-orders-by-DeliveryMan', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      

      if (response.ok && data.status === 'success') {
        console.log("✅ Active order data fetched successfully:", data.results, "orders");
        
        // Find active orders (prioritize Delivering, then Cooked)
        const activeOrders = data.data.filter(order => 
          order.orderStatus === 'Delivering' || order.orderStatus === 'Cooked'
        );
        
        // Prioritize Delivering orders, then Cooked orders
        const activeOrder = activeOrders.find(order => order.orderStatus === 'Delivering') || 
                           activeOrders.find(order => order.orderStatus === 'Cooked');
        
        console.log("🍲 Active order data fetched successfully:", activeOrder);
        

        if (activeOrder) {
          console.log("🍲 Found active order:", activeOrder.order_id, "Status:", activeOrder.orderStatus);
          
          // Get restaurant address from coordinates
          const restaurantLat = activeOrder.restaurant_id.location.coordinates[1];
          const restaurantLng = activeOrder.restaurant_id.location.coordinates[0];
          const restaurantAddress = await getAddressFromCoordinates(restaurantLat, restaurantLng);
          
          // Get delivery address from coordinates
          const deliveryLat = activeOrder.location.lat;
          const deliveryLng = activeOrder.location.lng;
          const deliveryAddress = await getAddressFromCoordinates(deliveryLat, deliveryLng);
          
          const activeOrderData = {
            orderId: activeOrder._id,
            order_id: activeOrder.order_id,
            restaurantLocation: {
              name: activeOrder.restaurant_id.name,
              address: restaurantAddress || activeOrder.restaurant_id.location.address || 'Restaurant Location',
              lat: restaurantLat,
              lng: restaurantLng,
            },
            deliveryLocation: {
              lat: deliveryLat,
              lng: deliveryLng,
              address: deliveryAddress || 'Delivery Location',
            },
            deliveryFee: activeOrder.deliveryFee || 0,
            tip: activeOrder.tip || 0,
            grandTotal: activeOrder.totalPrice || 0,
            orderStatus: activeOrder.orderStatus,
            verificationCode: activeOrder.deliveryVerificationCode,
            userPhone: activeOrder.userId?.phone,
            createdAt: activeOrder.createdAt,
            customer: {
              name: 'Customer',
              phone: activeOrder.userId?.phone,
            },
            items: [
              { name: 'Order Items', quantity: 1 }
            ],
            specialInstructions: 'Please handle with care',
            geocodingStatus: {
              restaurant: restaurantAddress ? 'completed' : 'failed',
              delivery: deliveryAddress ? 'completed' : 'failed'
            }
          };

          setState((prev) => ({
            ...prev,
            activeOrder: activeOrderData,
            isLoadingActiveOrder: false,
            activeOrderError: null,
          }));
        } else {
          console.log("🍲 No active cooked order found");
          setState((prev) => ({
            ...prev,
            activeOrder: null,
            isLoadingActiveOrder: false,
            activeOrderError: null,
          }));
        }
      } else {
        console.error("❌## Failed to fetch active order:", data.message);
        setState((prev) => ({
          ...prev,
          isLoadingActiveOrder: false,
          activeOrderError: data.message || 'Failed to fetch active order',
        }));
      }
    } catch (error) {
      console.error("❌ Error fetching active order:", error);
      setState((prev) => ({
        ...prev,
        isLoadingActiveOrder: false,
        activeOrderError: 'Network error. Please check your connection.',
      }));
    }
  }, [token]);

  // Save accepted order to phone storage
  const saveAcceptedOrderToStorage = useCallback(async (orderData) => {
    try {
      const orderToStore = {
        ...orderData,
        storedAt: new Date().toISOString(),
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.ACCEPTED_ORDER, JSON.stringify(orderToStore));
      await AsyncStorage.setItem(STORAGE_KEYS.ORDER_TIMESTAMP, orderToStore.timestamp.toString());
      
      console.log('💾 Order saved to storage:', orderToStore.orderId);
    } catch (error) {
      console.error('❌ Error saving order to storage:', error);
    }
  }, []);

  // Load accepted order from phone storage
  const loadAcceptedOrderFromStorage = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoadingStoredOrder: true }));
      
      const storedOrderData = await AsyncStorage.getItem(STORAGE_KEYS.ACCEPTED_ORDER);
      const storedTimestamp = await AsyncStorage.getItem(STORAGE_KEYS.ORDER_TIMESTAMP);
      
      if (storedOrderData && storedTimestamp) {
        const orderData = JSON.parse(storedOrderData);
        const timestamp = parseInt(storedTimestamp);
        
        // Check if order is not too old (e.g., not older than 24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const isOrderValid = (Date.now() - timestamp) < maxAge;
        
        if (isOrderValid) {
          console.log('📱 Loaded stored order:', orderData.orderId);
          setState((prev) => ({
            ...prev,
            storedOrder: orderData,
            activeOrder: {
              orderId: orderData.orderId,
              deliveryPersonId: orderData.deliveryPersonId,
              orderCode: orderData.orderCode,
              deliveryVerificationCode: orderData.pickUpVerification,
            },
            isLoadingStoredOrder: false,
          }));
        } else {
          console.log('⏰ Stored order is too old, clearing...');
          await clearStoredOrder();
        }
      } else {
        setState((prev) => ({ ...prev, isLoadingStoredOrder: false }));
      }
    } catch (error) {
      console.error('❌ Error loading order from storage:', error);
      setState((prev) => ({ ...prev, isLoadingStoredOrder: false }));
    }
  }, []);

  // Clear stored order from phone storage
  const clearStoredOrder = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCEPTED_ORDER);
      await AsyncStorage.removeItem(STORAGE_KEYS.ORDER_TIMESTAMP);
      
      setState((prev) => ({
        ...prev,
        storedOrder: null,
        activeOrder: null,
      }));
      
      console.log('🗑️ Stored order cleared from storage');
    } catch (error) {
      console.error('❌ Error clearing stored order:', error);
    }
  }, []);

  // Fetch active order when component mounts
  useEffect(() => {
    if (userId) {
      fetchActiveOrder();
    }
  }, [userId, fetchActiveOrder]);

  // ✅ Accept order function with real API
  const acceptOrder = useCallback(async (orderId, deliveryPersonId) => {
    if (!token) {
      Alert.alert("Error", "Authentication required. Please log in again.");
      return false;
    }

    if (!socketRef.current) {
      Alert.alert("Error", "Not connected to server");
      return false;
    }

    try {
      console.log("📦 Accepting order:", orderId);
      console.log('Delivery Person ID:', deliveryPersonId);
      const response = await fetch('https://gebeta-delivery1.onrender.com/api/v1/orders/accept-for-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: orderId,
          deliveryPersonId: deliveryPersonId
        }),
      });
      

      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        console.log("✅ Order accepted successfully:", data);
        
        // Store accepted order information
        const acceptedOrderData = {
          orderId: orderId,
          deliveryPersonId: deliveryPersonId,
          orderCode: data.data.orderCode,
          pickUpVerification: data.data.pickUpVerification,
          message: data.message,
          acceptedAt: new Date().toISOString(),
        };

        setState((prev) => ({
          ...prev,
          acceptedOrder: acceptedOrderData,
          activeOrder: {
            orderId,
            deliveryPersonId,
            orderCode: data.data.orderCode,
            deliveryVerificationCode: data.data.pickUpVerification,
          },
          availableOrders: prev.availableOrders.filter(
            (o) => o.orderId !== orderId
          ),
          availableOrdersCount: Math.max(0, prev.availableOrdersCount - 1),
          showOrderModal: false,
          pendingOrderPopup: null,
        }));

        // Fetch active order after accepting (to update dashboard)
        await fetchActiveOrder();

        Alert.alert(
          "🎉 Order Accepted Successfully!",
          `✅ ${data.message}\n\n📦 Order Code: ${data.data.orderCode}\n🔑 Pickup Code: ${data.data.pickUpVerification}\n\n💡 Please proceed to the restaurant to collect your order.`,
          [
            { 
              text: 'Got it!', 
              style: 'default',
              onPress: () => console.log('User acknowledged order acceptance')
            }
          ]
        );
        
        return true;
      } else {
        console.error("❌ Failed to accept order:", data);

        console.log('Data:', data);
       
        console.log('Response:', response);
        console.log('Response status:', response.status);
        // Handle specific error cases based on HTTP status codes and backend response
        switch (response.status) {
          case 400:
            if (data.error === 'Order ID is required.') {
              Alert.alert(
                "⚠️ Invalid Request", 
                "❌ Order ID is missing from your request.\n\n🔄 Please try again or contact support if the issue persists.",
                [
                  { text: 'Try Again', style: 'default' },
                  { text: 'Contact Support', style: 'cancel' }
                ]
              );
            } else if (data.error === 'You already have an active order. Complete or cancel it before accepting a new one.') {
              Alert.alert(
                "🚫 Active Order Conflict",
                `⚠️ You already have an active order in progress!\n\n📦 Current Order: ${data.activeOrder?.orderId || 'Unknown'}\n📊 Status: ${data.activeOrder?.status || 'Unknown'}\n\n💡 Please complete or cancel your current order before accepting a new one.`,
                [
                  { 
                    text: 'View Current Order', 
                    style: 'default',
                    onPress: () => console.log('User wants to view current order')
                  },
                  { 
                    text: 'Got it', 
                    style: 'cancel' 
                  }
                ]
              );
            } else if (data.error === 'Order is not available for acceptance.') {
              Alert.alert(
                "😔 Order No Longer Available",
                "❌ This order is no longer available for acceptance.\n\n👥 It may have been taken by another delivery person.\n\n🔄 Please refresh the orders list to see new available orders.",
                [
                  { 
                    text: 'Refresh Orders', 
                    style: 'default',
                    onPress: () => console.log('User wants to refresh orders')
                  },
                  { 
                    text: 'OK', 
                    style: 'cancel' 
                  }
                ]
              );
            } else {
              Alert.alert(
                "⚠️ Bad Request",
                `❌ ${data.error || data.message || "Invalid request detected."}\n\n🔄 Please check your input and try again.\n\n💡 If the problem persists, contact support.`,
                [
                  { text: 'Try Again', style: 'default' },
                  { text: 'Contact Support', style: 'cancel' }
                ]
              );
            }
            break;
            
          case 401:
              Alert.alert(
                "🔐 Authentication Required",
                "⏰ Your session has expired.\n\n🔄 Please log in again to continue using the app.\n\n💡 This helps keep your account secure.",
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Login Now', 
                  style: 'default',
                  onPress: () => {
                    // You might want to trigger a logout/login flow here
                    console.log('Redirect to login');
                  }
                }
              ]
            );
            break;
            
          case 403:
            Alert.alert(
              "🚫 Access Denied",
              "❌ You don't have permission to perform this action.\n\n👤 This might be due to account restrictions or role limitations.\n\n📞 Please contact support if this continues.",
              [
                { text: 'Contact Support', style: 'default' },
                { text: 'OK', style: 'cancel' }
              ]
            );
            break;
            
          case 404:
            Alert.alert(
              "🔍 Service Not Found",
              "❌ The requested service is not available.\n\n🔄 Please try again later or check your connection.\n\n💡 This might be a temporary issue.",
              [
                { text: 'Try Again', style: 'default' },
                { text: 'OK', style: 'cancel' }
              ]
            );
            break;
            
          case 409:
            Alert.alert(
              "⚡ Conflict Detected",
              `⚠️ ${data.error || data.message || "There's a conflict with your request."}\n\n🔄 Please refresh the page and try again.\n\n💡 This usually happens when data has been updated by another user.`,
              [
                { text: 'Refresh & Retry', style: 'default' },
                { text: 'OK', style: 'cancel' }
              ]
            );
            break;
            
          case 422:
            Alert.alert(
              "📝 Validation Error",
              `❌ ${data.error || data.message || "Input validation failed."}\n\n🔍 Please check your input and try again.\n\n💡 Make sure all required fields are filled correctly.`,
              [
                { text: 'Fix & Retry', style: 'default' },
                { text: 'OK', style: 'cancel' }
              ]
            );
            break;
            
          case 429:
            Alert.alert(
              "⏱️ Too Many Requests",
              "🚀 You're making requests too quickly!\n\n⏳ Please wait a moment and try again.\n\n💡 This helps prevent server overload.",
              [
                { text: 'Wait & Retry', style: 'default' },
                { text: 'OK', style: 'cancel' }
              ]
            );
            break;
            
          case 500:
            Alert.alert(
              "🔧 Server Error",
              "⚠️ There's a problem with our servers.\n\n⏰ Please try again in a few minutes.\n\n🛠️ Our team has been notified and is working on a fix.",
              [
                { text: 'Try Again Later', style: 'default' },
                { text: 'OK', style: 'cancel' }
              ]
            );
            break;
            
          case 502:
            Alert.alert(
              "🚫 Service Unavailable",
              "⚠️ Our service is temporarily unavailable.\n\n⏰ Please try again later.\n\n🔧 We're working to restore service as quickly as possible.",
              [
                { text: 'Try Again Later', style: 'default' },
                { text: 'OK', style: 'cancel' }
              ]
            );
            break;
            
          case 503:
            Alert.alert(
              "🔧 Service Maintenance",
              "🛠️ Our service is currently under maintenance.\n\n⏰ Please try again later.\n\n✨ We're making improvements to serve you better!",
              [
                { text: 'Check Back Later', style: 'default' },
                { text: 'OK', style: 'cancel' }
              ]
            );
            break;
            
          case 504:
            Alert.alert(
              "⏰ Request Timeout",
              "🕐 The request is taking too long to complete.\n\n📶 Please check your connection and try again.\n\n💡 This might be due to slow network or server load.",
              [
                { text: 'Check Connection', style: 'default' },
                { text: 'OK', style: 'cancel' }
              ]
            );
            break;
            
          default:
            Alert.alert(
              "❓ Unexpected Error",
              `⚠️ ${data.error || data.message || `Unexpected error (${response.status}) occurred.`}\n\n🔄 Please try again.\n\n📞 If this continues, contact support with error code: ${response.status}`,
              [
                { text: 'Try Again', style: 'default' },
                { text: 'Contact Support', style: 'cancel' }
              ]
            );
        }
        
        return false;
      }
    } catch (error) {
      console.error("❌ Error accepting order:", error);
      
      // Handle different types of network errors
      let errorTitle = "🌐 Network Error";
      let errorMessage = "📶 Please check your connection and try again.";
      let buttons = [{ text: 'Try Again', style: 'default' }];
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorTitle = "🔌 Connection Error";
        errorMessage = "❌ Unable to connect to the server.\n\n📶 Please check your internet connection.\n\n💡 Make sure you're connected to WiFi or mobile data.";
        buttons = [
          { text: 'Check Connection', style: 'default' },
          { text: 'OK', style: 'cancel' }
        ];
      } else if (error.name === 'AbortError') {
        errorTitle = "⏹️ Request Cancelled";
        errorMessage = "⚠️ The request was cancelled.\n\n🔄 Please try again.\n\n💡 This might have happened due to network issues.";
        buttons = [{ text: 'Try Again', style: 'default' }];
      } else if (error.message.includes('timeout')) {
        errorTitle = "⏰ Request Timeout";
        errorMessage = "🕐 The request is taking too long.\n\n📶 Please check your connection and try again.\n\n💡 Try switching between WiFi and mobile data.";
        buttons = [
          { text: 'Retry', style: 'default' },
          { text: 'OK', style: 'cancel' }
        ];
      } else if (error.message.includes('Network request failed')) {
        errorTitle = "📵 Network Unavailable";
        errorMessage = "❌ No internet connection detected.\n\n📶 Please check your network settings.\n\n💡 Make sure WiFi or mobile data is enabled.";
        buttons = [
          { text: 'Check Settings', style: 'default' },
          { text: 'OK', style: 'cancel' }
        ];
      }
      
      Alert.alert(errorTitle, errorMessage, buttons);
      return false;
    }
  }, [token]);

  // Mock functions to prevent errors
  const toggleOnlineStatus = useCallback(() => {
    setState((prev) => ({ ...prev, isOnline: !prev.isOnline }));
  }, []);

  const showOrderModalFn = useCallback((order) => {
    setState((prev) => ({
      ...prev,
      pendingOrderPopup: order,
      showOrderModal: true,
    }));
  }, []);

  const hideOrderModal = useCallback(() => {
    setState((prev) => ({ 
      ...prev, 
      showOrderModal: false, 
      pendingOrderPopup: null,
      newOrderNotification: false // Clear notification when modal is closed
    }));
  }, []);

  const acceptOrderFromModal = useCallback(
    async (order) => {
      const success = await acceptOrder(order.orderId, userId);
      if (success) {
        hideOrderModal();
      }
    },
    [acceptOrder, userId, hideOrderModal]
  );

  const declineOrder = useCallback((order) => {
    setState((prev) => ({
      ...prev,
      availableOrders: prev.availableOrders.filter(
        (o) => o.orderId !== order.orderId
      ),
      availableOrdersCount: Math.max(0, prev.availableOrdersCount - 1),
      showOrderModal: false,
      pendingOrderPopup: null,
    }));
  }, []);

  const joinDeliveryMethod = useCallback((method) => {
    console.log(`Joined delivery method: ${method}`);
  }, []);

  const clearBroadcastMessages = useCallback(() => {
    setState((prev) => ({ ...prev, broadcastMessages: [] }));
  }, []);

  const clearNewOrderNotification = useCallback(() => {
    setState((prev) => ({ ...prev, newOrderNotification: false }));
  }, []);

  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const fetchAvailableOrders = useCallback(async () => {
    console.log("Fetching available orders from API...");
    
    if (!token) {
      console.error("❌ No authentication token available");
      setState((prev) => ({
        ...prev,
        isLoadingOrders: false,
        ordersError: 'Authentication required. Please log in again.',
      }));
      return;
    }
    
    try {
      setState((prev) => ({ ...prev, isLoadingOrders: true, ordersError: null }));
      
      const response = await fetch('https://gebeta-delivery1.onrender.com/api/v1/orders/get-orders-by-DeliveryMan', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log(data);
      if (response.ok && data.status === 'success') {
        console.log("✅ Orders fetched successfully:", data.data.length, "orders");
        
        // Filter orders to show only 'Cooked' and 'Delivering' status for dashboard
        const availableOrders = data.data.filter(order => 
          order.orderStatus === 'Cooked' || order.orderStatus === 'Delivering'
        );
        
        console.log("📋 Available orders for dashboard:", availableOrders.length, "orders");
        
        // Transform API data to match our expected format with reverse geocoding
        const transformedOrders = await Promise.all(
          availableOrders.map(async (order, index) => {
            // Get restaurant address from coordinates
            const restaurantLat = order.restaurant_id.location.coordinates[1];
            const restaurantLng = order.restaurant_id.location.coordinates[0];
            console.log(`🌍 Geocoding restaurant: ${restaurantLat}, ${restaurantLng}`);
            const restaurantAddress = await getAddressFromCoordinates(restaurantLat, restaurantLng);
            console.log(`📍 Restaurant address: ${restaurantAddress || 'Failed'}`);
            
            // Get delivery address from coordinates
            const deliveryLat = order.location.lat;
            const deliveryLng = order.location.lng;
            console.log(`🌍 Geocoding delivery: ${deliveryLat}, ${deliveryLng}`);
            const deliveryAddress = await getAddressFromCoordinates(deliveryLat, deliveryLng);
            console.log(`📍 Delivery address: ${deliveryAddress || 'Failed'}`);
            
            return {
              orderId: order._id, // Use real orderId from API
              order_id: order.order_id, // Use the actual order_id from API
              restaurantLocation: {
                name: order.restaurant_id.name,
                address: restaurantAddress || order.restaurant_id.location.address || 'Restaurant Location',
                lat: restaurantLat,
                lng: restaurantLng,
              },
              deliveryLocation: {
                lat: deliveryLat,
                lng: deliveryLng,
                address: deliveryAddress || 'Delivery Location',
              },
              deliveryFee: order.deliveryFee || 0, // Use real delivery fee from API
              tip: order.tip || 0, // Use real tip from API
              grandTotal: order.totalPrice || 0, // Use real total price from API
              createdAt: new Date().toISOString(),
              customer: {
                name: 'Customer', // We don't have name from API
                phone: order.userPhone, // We have phone but won't display it
              },
              items: [
                { name: 'Order Items', quantity: 1 } // Default since not in API
              ],
              specialInstructions: 'Please handle with care',
              // Add geocoding status
              geocodingStatus: {
                restaurant: restaurantAddress ? 'completed' : 'failed',
                delivery: deliveryAddress ? 'completed' : 'failed'
              }
            };
          })
        );

        setState((prev) => ({
          ...prev,
          availableOrders: transformedOrders,
          availableOrdersCount: transformedOrders.length,
          isLoadingOrders: false,
          ordersError: null,
        }));
      } else {
        console.error("❌ Failed to fetch orders:", data);
        
        // Handle specific error cases based on HTTP status codes
        let errorMessage = 'Failed to fetch orders';
        let errorTitle = 'Error';
        
        switch (response.status) {
          case 400:
            errorTitle = "Bad Request";
            errorMessage = data.error || data.message || "Invalid request. Please try again.";
            break;
            
          case 401:
            errorTitle = "Authentication Required";
            errorMessage = "Your session has expired. Please log in again.";
            break;
            
          case 403:
            errorTitle = "Access Denied";
            errorMessage = "You don't have permission to view orders. Please contact support.";
            break;
            
          case 404:
            errorTitle = "Service Not Found";
            errorMessage = "The orders service is not available. Please try again later.";
            break;
            
          case 429:
            errorTitle = "Too Many Requests";
            errorMessage = "You're making requests too quickly. Please wait a moment and try again.";
            break;
            
          case 500:
            errorTitle = "Server Error";
            errorMessage = "There's a problem with our servers. Please try again in a few minutes.";
            break;
            
          case 502:
            errorTitle = "Service Unavailable";
            errorMessage = "Our service is temporarily unavailable. Please try again later.";
            break;
            
          case 503:
            errorTitle = "Service Maintenance";
            errorMessage = "Our service is currently under maintenance. Please try again later.";
            break;
            
          case 504:
            errorTitle = "Request Timeout";
            errorMessage = "The request is taking too long. Please check your connection and try again.";
            break;
            
          default:
            errorTitle = "Error";
            errorMessage = data.error || data.message || `Unexpected error (${response.status}). Please try again.`;
        }
        
        setState((prev) => ({
          ...prev,
          isLoadingOrders: false,
          ordersError: `${errorTitle}: ${errorMessage}`,
        }));
      }
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      
      // Handle different types of network errors
      let errorMessage = 'Network error. Please check your connection.';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Connection Error: Unable to connect to the server. Please check your internet connection.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Request Cancelled: The request was cancelled. Please try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request Timeout: The request is taking too long. Please try again.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Network Unavailable: No internet connection. Please check your network settings.';
      }
      
      setState((prev) => ({
        ...prev,
        isLoadingOrders: false,
        ordersError: errorMessage,
      }));
    }
  }, [token]);

  // 📊 Fetch delivery person order history
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
        "https://gebeta-delivery1.onrender.com/api/v1/orders/get-orders-by-DeliveryMan",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
     
  
      const data = await response.json();
      console.log(data);
      console.log("🔍 Delivery history raw data:", data);
  
      if (!response.ok || data?.status !== "success") {
        throw new Error(data?.message || "Failed to fetch delivery history");
      }
  
      // Filter orders to show only 'Completed' status for history
      const completedOrders = data.data.filter(order => 
        order.orderStatus === 'Completed'
      );
      
      console.log("📋 Completed orders for history:", completedOrders.length, "orders");
  
      const rawOrders = Array.isArray(completedOrders) ? completedOrders : [];
  
      if (rawOrders.length === 0) {
        console.warn("⚠️ No delivery history found.");
        setState((prev) => ({
          ...prev,
          orderHistory: [],
          deliveryAnalytics: calculateDeliveryAnalytics([]),
          isLoadingHistory: false,
          historyError: null,
        }));
        return;
      }
  
      const transformedHistory = await Promise.all(
        rawOrders.map(async (order) => {
          // Extract restaurant location
          const [restaurantLng, restaurantLat] =
            order?.restaurant_id?.location?.coordinates || [0, 0];
          const restaurantAddress = restaurantLat
            ? await getAddressFromCoordinates(restaurantLat, restaurantLng)
            : null;
  
          // Extract delivery location
          const deliveryLat = order?.location?.lat || 0;
          const deliveryLng = order?.location?.lng || 0;
          const deliveryAddress =
            deliveryLat && deliveryLng
              ? await getAddressFromCoordinates(deliveryLat, deliveryLng)
              : null;
  
          return {
            orderId: order?._id || "N/A",
            order_id: order?.order_id || "N/A",
            restaurantLocation: {
              name: order?.restaurant_id?.name || "Unknown Restaurant",
              address: restaurantAddress || "Restaurant Location",
              lat: restaurantLat,
              lng: restaurantLng,
            },
            deliveryLocation: {
              lat: deliveryLat,
              lng: deliveryLng,
              address: deliveryAddress || "Delivery Location",
            },
            deliveryFee: order?.deliveryFee || 0,
            tip: order?.tip || 0,
            grandTotal: order?.totalPrice || 0,
            orderStatus: order?.orderStatus || "Unknown",
            verificationCode:
              order?.deliveryVerificationCode || order?.verification_code || "N/A",
            userPhone: order?.userId?.phone || "N/A",
            createdAt: order?.createdAt || null,
            customer: {
              name: "Customer",
              phone: order?.userId?.phone || "N/A",
            },
            items:
              order?.orderItems?.map((item) => ({
                name: item?.name || "Unknown Item",
                quantity: item?.quantity || 0,
              })) || [],
            specialInstructions:
              order?.specialInstructions || "Please handle with care",
            geocodingStatus: {
              restaurant: restaurantAddress ? "completed" : "failed",
              delivery: deliveryAddress ? "completed" : "failed",
            },
            transaction: {
              status: order?.transaction?.Status || "N/A",
              refId: order?.transaction?.ref_id || "N/A",
              createdAt: order?.transaction?.Created_At || null,
            },
          };
        })
      );
  
      const analytics = calculateDeliveryAnalytics(transformedHistory);
  
      setState((prev) => ({
        ...prev,
        orderHistory: transformedHistory,
        deliveryAnalytics: analytics,
        isLoadingHistory: false,
        historyError: null,
      }));
    } catch (error) {
      console.error("❌ Error @@fetching delivery history:", error);
      setState((prev) => ({
        ...prev,
        isLoadingHistory: false,
        historyError: error.message || "Network error. Please check your connection.",
      }));
    }
  }, [token]);
  

  // 🍲 Fetch active cooked order (the order that's cooked but not completed)
  
  // 📈 Calculate delivery analytics
  const calculateDeliveryAnalytics = useCallback((orders) => {
    if (!orders || orders.length === 0) {
      return {
        totalDeliveries: 0,
        totalEarnings: 0,
        totalDeliveryFees: 0,
        totalTips: 0,
        averageOrderValue: 0,
        averageDeliveryFee: 0,
        averageTip: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        inProgressOrders: 0,
        statusBreakdown: {},
        monthlyEarnings: {},
        topRestaurants: {},
        deliveryStats: {
          totalDistance: 0,
          averageDistance: 0,
          totalTime: 0,
          averageTime: 0,
        }
      };
    }

    // Filter only completed orders for earnings calculations
    const completedOrders = orders.filter(order => 
      order.orderStatus === 'Completed' || 
      order.orderStatus === 'Delivered' ||
      order.orderStatus === 'completed' ||
      order.orderStatus === 'delivered'
    );

    const totalDeliveries = orders.length; // Total orders (all statuses)
    const completedDeliveries = completedOrders.length; // Only completed orders
    
    // Calculate earnings only from completed orders
    const totalEarnings = completedOrders.reduce((sum, order) => sum + (order.deliveryFee || 0) + (order.tip || 0), 0);
    const totalDeliveryFees = completedOrders.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);
    const totalTips = completedOrders.reduce((sum, order) => sum + (order.tip || 0), 0);
    const totalOrderValue = completedOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
    
    // Calculate averages based on completed orders only
    const averageOrderValue = completedDeliveries > 0 ? totalOrderValue / completedDeliveries : 0;
    const averageDeliveryFee = completedDeliveries > 0 ? totalDeliveryFees / completedDeliveries : 0;
    const averageTip = completedDeliveries > 0 ? totalTips / completedDeliveries : 0;

    // Status breakdown
    const statusBreakdown = orders.reduce((acc, order) => {
      const status = order.orderStatus || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const completedOrdersCount = statusBreakdown['Completed'] || statusBreakdown['Delivered'] || statusBreakdown['completed'] || statusBreakdown['delivered'] || 0;
    const cancelledOrders = statusBreakdown['Cancelled'] || statusBreakdown['cancelled'] || 0;
    const inProgressOrders = statusBreakdown['In Progress'] || statusBreakdown['Cooked'] || statusBreakdown['cooked'] || 0;

    // Monthly earnings (mock data since we don't have actual dates) - based on completed orders only
    const monthlyEarnings = {
      'January': Math.floor(totalEarnings * 0.1),
      'February': Math.floor(totalEarnings * 0.15),
      'March': Math.floor(totalEarnings * 0.2),
      'April': Math.floor(totalEarnings * 0.25),
      'May': Math.floor(totalEarnings * 0.3),
    };

    // Top restaurants - only from completed orders
    const topRestaurants = completedOrders.reduce((acc, order) => {
      const restaurantName = order.restaurantLocation?.name || 'Unknown Restaurant';
      acc[restaurantName] = (acc[restaurantName] || 0) + 1;
      return acc;
    }, {});

    return {
      totalDeliveries, // Total orders (all statuses)
      totalEarnings, // Only from completed orders
      totalDeliveryFees, // Only from completed orders
      totalTips, // Only from completed orders
      averageOrderValue, // Based on completed orders only
      averageDeliveryFee, // Based on completed orders only
      averageTip, // Based on completed orders only
      completedOrders: completedOrdersCount, // Count of completed orders
      cancelledOrders,
      inProgressOrders,
      statusBreakdown,
      monthlyEarnings,
      topRestaurants, // Only from completed orders
      deliveryStats: {
        totalDistance: completedDeliveries * 2.5, // Mock average distance - only completed orders
        averageDistance: 2.5,
        totalTime: completedDeliveries * 30, // Mock average time in minutes - only completed orders
        averageTime: 30,
      }
    };
  }, []);

  // ✅ Verify delivery function
  const verifyDelivery = useCallback(async (orderId, verificationCode) => {
    if (!token) {
      Alert.alert("Error", "Authentication required. Please log in again.");
      return;
    }
  
    try {
      const response = await fetch(
        "https://gebeta-delivery1.onrender.com/api/v1/orders/verify-delivery",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order_id: orderId, verification_code: verificationCode }),
        }
      );
  
      const data = await response.json();
  
      if (response.ok && data.status === "success") {
        setState((prev) => ({ ...prev, activeOrder: null, acceptedOrder: null }));
        
        Alert.alert("🎉 Delivery Verified!", data.message);
        return { success: true, data: data.data };
      }
  
      Alert.alert("❌ Verification Failed", data.error?.message || "Please try again.");
      return { success: false };
    } catch (error) {
      Alert.alert("🌐 Network Error", "Check your connection and try again.");
      return { success: false };
    }
  }, [token]);
  
  // 🏁 Complete order function
  const completeOrder = useCallback(async (orderId) => {
    try {
      console.log('🏁 Completing order:', orderId);
      
      // Clear active order and fetch updated data
      setState((prev) => ({
        ...prev,
        activeOrder: null,
        acceptedOrder: null,
      }));
      
      // Fetch updated active order (should be null if no more cooked orders)
      await fetchActiveOrder();
      
      console.log('✅ Order completed and active order updated');
      return true;
    } catch (error) {
      console.error('❌ Error completing order:', error);
      return false;
    }
  }, [fetchActiveOrder]);

  // ❌ Cancel order function
  const cancelOrder = useCallback(async (orderId) => {
    try {
      console.log('❌ Cancelling order:', orderId);
      
      // Clear active order and fetch updated data
      setState((prev) => ({
        ...prev,
        activeOrder: null,
        acceptedOrder: null,
      }));
      
      // Fetch updated active order (should be null if no more cooked orders)
      await fetchActiveOrder();
      
      console.log('✅ Order cancelled and active order updated');
      return true;
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      return false;
    }
  }, [fetchActiveOrder]);

  // 🔄 Refresh stored order (useful for checking order status)
  const refreshStoredOrder = useCallback(async () => {
    if (state.storedOrder) {
      console.log('🔄 Refreshing stored order status...');
      // You can add API call here to check current order status
      // and update the stored order accordingly
    }
  }, [state.storedOrder]);

  return (
    <DeliveryContext.Provider
      value={{
        ...state,
        acceptOrder,
        toggleOnlineStatus,
        showOrderModalFn,
        hideOrderModal,
        acceptOrderFromModal,
        declineOrder,
        joinDeliveryMethod,
        clearBroadcastMessages,
        clearNewOrderNotification,
        calculateDistance,
        fetchAvailableOrders,
        // Order management functions
        completeOrder,
        cancelOrder,
        verifyDelivery,
        // History and analytics functions
        fetchDeliveryHistory,
        calculateDeliveryAnalytics,
        // Active order functions
        fetchActiveOrder,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
};
