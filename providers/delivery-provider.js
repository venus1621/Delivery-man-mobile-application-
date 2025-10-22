import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Alert, Vibration, Platform } from "react-native";
import { Audio } from 'expo-av';
// Note: removed persistent local storage for accepted orders - using in-memory state only
import io from "socket.io-client";
import { useAuth } from "./auth-provider";
import locationService from "../services/location-service";
import { ref, update, push, set } from 'firebase/database';
import { database } from '../firebase';


const DeliveryContext = createContext();
export const useDelivery = () => useContext(DeliveryContext);

export const DeliveryProvider = ({ children }) => {
  const { userId, token, user } = useAuth();

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
  acceptedOrder: null, // Store accepted order information (in-memory only)
    deliveryAnalytics: null, // Analytics data for delivery history
    isLoadingHistory: false, // Loading state for history API
    historyError: null, // Error state for history API
    isLoadingActiveOrder: false, // Loading state for active order API
    activeOrderError: null, // Error state for active order API
    currentLocation: null, // Current delivery guy location
    isLocationTracking: false, // Location tracking status
    locationError: null, // Location error state
  });

  const socketRef = useRef(null);
  const locationUnsubscribeRef = useRef(null);
  const locationIntervalRef = useRef(null); // Ref for location sending interval
  const locationUpdateIntervalRef = useRef(null); // Ref for dynamic interval management
  const proximityNotifiedRef = useRef(new Set()); // Track which orders have been notified
  const soundObjectRef = useRef(null); // Ref for alarm sound object
  const vibrationIntervalRef = useRef(null); // Ref for continuous vibration

  // 📳 Start continuous vibration
  const startContinuousVibration = useCallback(() => {
    // Clear any existing vibration interval
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
    }

    // Vibrate immediately
    Vibration.vibrate(1000);

    // Set up continuous vibration (every 2 seconds)
    vibrationIntervalRef.current = setInterval(() => {
      Vibration.vibrate(1000);
    }, 2000);
  }, []);

  // 🔇 Stop proximity alarm and vibration
  const stopProximityAlarm = useCallback(async () => {
    try {
      // Stop sound
      if (soundObjectRef.current) {
        await soundObjectRef.current.stopAsync();
        await soundObjectRef.current.unloadAsync();
        soundObjectRef.current = null;
        console.log('🔇 Proximity alarm stopped');
      }

      // Stop vibration
      if (vibrationIntervalRef.current) {
        clearInterval(vibrationIntervalRef.current);
        vibrationIntervalRef.current = null;
      }
      Vibration.cancel(); // Cancel any ongoing vibration
      
    } catch (error) {
      console.error('❌ Error stopping alarm:', error);
    }
  }, []);

  // 🔊 Play continuous alarm sound (ringing)
  const playProximityAlarm = useCallback(async () => {
    try {
      // Stop any existing sound
      await stopProximityAlarm();

      // Create alarm sound - using system default notification sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' }, // Default alarm sound
        { 
          shouldPlay: true,
          isLooping: true, // Continuous ringing
          volume: 1.0
        }
      );
      
      soundObjectRef.current = sound;
      console.log('🔊 Playing continuous proximity alarm');

      // Start continuous vibration pattern
      startContinuousVibration();
      
    } catch (error) {
      console.error('❌ Error playing alarm:', error);
      // Fallback to continuous vibration only
      startContinuousVibration();
    }
  }, [stopProximityAlarm, startContinuousVibration]);

  // 📍 Initialize location tracking and audio
  useEffect(() => {
    const initializeLocationTracking = async () => {
      try {
        // Configure audio mode for maximum compatibility
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
        console.log('✅ Audio configured for proximity alerts');

        // Subscribe to location updates (for state updates only, not for sending)
        locationUnsubscribeRef.current = locationService.subscribe((location) => {
          setState((prev) => ({ 
            ...prev, 
            currentLocation: location,
            isLocationTracking: true,
            locationError: null
          }));
        });

        // Start location tracking
        await locationService.startLocationTracking();
      } catch (error) {
        console.error('Error initializing location tracking:', error);
        setState((prev) => ({ 
          ...prev, 
          locationError: error.message,
          isLocationTracking: false
        }));
      }
    };

    initializeLocationTracking();

    // Cleanup on unmount
    return () => {
      if (locationUnsubscribeRef.current) {
        locationUnsubscribeRef.current();
      }
      // Clear location sending interval
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      // Stop alarm and vibration
      stopProximityAlarm();
    };
  }, [userId]);

  // 🔔 Proximity Alert Function - Play alarm when near destination
  const checkProximityAndAlert = useCallback(async (order, currentLocation, orderId) => {
    try {
      // Get destination location
      const destination = order.destinationLocation || order.deliveryLocation || order.deliverLocation || order.customerLocation;
      
      if (!destination || !destination.lat || !destination.lng) {
        return; // No destination available
      }

      // Calculate distance to destination
      const distance = locationService.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        destination.lat,
        destination.lng
      );

      const distanceInMeters = distance * 1000; // Convert km to meters
      const PROXIMITY_THRESHOLD = 200; // 200 meters

      // Check if we're within proximity threshold
      if (distanceInMeters <= PROXIMITY_THRESHOLD) {
        // Check if we've already notified for this order
        if (proximityNotifiedRef.current.has(orderId)) {
          return; // Already notified
        }

        // Mark as notified
        proximityNotifiedRef.current.add(orderId);
        
        console.log(`🔔 PROXIMITY ALERT! Within ${Math.round(distanceInMeters)}m of destination for order: ${order.orderCode || orderId}`);

        // Play continuous ringing alarm sound
        await playProximityAlarm();

        // Show alert dialog with stop alarm on dismiss
        Alert.alert(
          "🎯 Approaching Destination!",
          `You are ${Math.round(distanceInMeters)} meters away from the delivery location.\n\nOrder: ${order.orderCode || orderId}\nCustomer: ${order.userName || 'Customer'}`,
          [
            {
              text: "Got it!",
              onPress: () => {
                stopProximityAlarm();
                console.log('✅ User acknowledged proximity alert');
              }
            }
          ],
          { 
            cancelable: false,
            onDismiss: () => {
              stopProximityAlarm();
            }
          }
        );
      } else {
        // If distance is more than threshold, allow future notifications
        if (distanceInMeters > PROXIMITY_THRESHOLD * 1.5) {
          proximityNotifiedRef.current.delete(orderId);
        }
      }
    } catch (error) {
      console.error('❌ Error checking proximity:', error);
    }
  }, []);


  // 📍 Send location updates every 3 seconds when connected
  useEffect(() => {
    if (!userId || !state.isLocationTracking) {
      // Clear interval if not tracking
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      return;
    }

    // Start interval to send location every 3 seconds
    locationIntervalRef.current = setInterval(() => {
      const currentLocation = locationService.getCurrentLocation();
      if (currentLocation) {
        // Send to socket server if connected
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('locationUpdate', {
            userId,
            location: {
              userName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown User',
              userPhone: user?.phone || 'N/A',
              userDeliveryMethod: user?.deliveryMethod || 'N/A',
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              accuracy: currentLocation.accuracy,
              timestamp: currentLocation.timestamp
            }
          });
          console.log('📍 Location sent to server:', currentLocation);
        }

        // Check if activeOrder is an array (from dashboard) or single object (from state)
        // Define this early so we can use it in multiple places
        const activeOrders = Array.isArray(state.activeOrder) ? state.activeOrder : 
                             (state.activeOrder ? [state.activeOrder] : []);

        // ALWAYS send to Firebase - direct delivery guy location tracking
        const deliveryGuyRef = ref(database, `deliveryGuys/${userId}`);
        const locationHistoryRef = ref(database, `deliveryGuys/${userId}/locationHistory`);
        
        // Update current location for delivery guy
        const locationData = {
          currentLocation: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            accuracy: currentLocation.accuracy,
            timestamp: currentLocation.timestamp
          },
          lastLocationUpdate: new Date().toISOString(),
          deliveryPerson: {
            id: userId,
            name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown User',
            phone: user?.phone || 'N/A',
            deliveryMethod: user?.deliveryMethod || 'N/A'
          },
          isOnline: state.isOnline,
          isTracking: state.isLocationTracking,
          activeOrderIds: activeOrders.map(o => o._id || o.id || o.orderId || o.orderCode).filter(Boolean),
          status: activeOrders.length > 0 ? 'Delivering' : 'Available'
        };
        
        // Add to location history
        const historyEntry = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          timestamp: currentLocation.timestamp,
          status: state.activeOrder?.status || 'Available',
          recordedAt: new Date().toISOString(),
          activeOrderId: state.activeOrder?.orderId || null
        };
        
        // Update delivery guy data and add to history
        Promise.all([
          update(deliveryGuyRef, locationData),
          push(locationHistoryRef, historyEntry)
        ]).catch(error => {
          console.error('❌ Error updating delivery guy location in Firebase:', error);
        });
        
        console.log('🔥 Delivery guy location sent to Firebase:', userId);
        
        console.log('🔍 Active Orders Check:', {
          hasActiveOrders: activeOrders.length > 0,
          orderCount: activeOrders.length,
          orderIds: activeOrders.map(o => o.orderId || o.orderCode)
        });

        // SEND TO ORDER-SPECIFIC FIREBASE PATH (for customer tracking)
        // Handle both single order and multiple orders (dashboard display)
        if (activeOrders.length > 0) {
          console.log(`📦 Sending location to ${activeOrders.length} active order(s)`);
          
          // Send location for each active order
          const locationUpdatePromises = activeOrders.map(async (order) => {
            // Log available order fields to debug
            console.log('🔍 Order fields available:', {
              _id: order._id,
              id: order.id,
              orderId: order.orderId,
              orderCode: order.orderCode,
              allKeys: Object.keys(order)
            });
            
            // Priority: Use MongoDB _id first (for customer app compatibility)
            // The API might return the MongoDB ID in different fields
            const mongoId = order._id || order.id;
            const orderId = mongoId || order.orderId || order.orderCode;
            
            if (!orderId) {
              console.warn('⚠️ Order missing _id, id, orderId and orderCode:', order);
              return;
            }
            
            console.log('📍 Using Firebase path for order:', orderId);
            console.log('📦 Order Code:', order.orderCode || 'N/A');
            
            const orderRef = ref(database, `deliveryOrders/${orderId}`);
            const orderLocationHistoryRef = ref(database, `deliveryOrders/${orderId}/locationHistory`);
            
            // Update current location for specific order
            // Only include fields that are defined (Firebase doesn't accept undefined)
            const orderLocationData = {
              orderId: orderId,
              orderCode: order.orderCode || `ORD-${orderId.slice(-6)}`,
              deliveryLocation: {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                accuracy: currentLocation.accuracy,
                timestamp: currentLocation.timestamp
              },
              lastLocationUpdate: new Date().toISOString(),
              deliveryPerson: {
                id: userId,
                name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                phone: user?.phone || 'N/A',
                deliveryMethod: user?.deliveryMethod || 'N/A'
              },
              status: order.orderStatus || order.status || 'Delivering',
              orderStatus: order.orderStatus || 'Delivering',
              trackingEnabled: true,
              deliveryFee: order.deliveryFee || 0,
              tip: order.tip || 0,
            };
            
            // Add optional fields only if they exist
            if (order.restaurantName) {
              orderLocationData.restaurantName = order.restaurantName;
            }
            if (order.restaurantLocation) {
              orderLocationData.restaurantLocation = order.restaurantLocation;
            }
            if (order.destinationLocation) {
              orderLocationData.customerLocation = order.destinationLocation;
            } else if (order.deliveryLocation) {
              orderLocationData.customerLocation = order.deliveryLocation;
            } else if (order.deliverLocation) {
              orderLocationData.customerLocation = order.deliverLocation;
            }
            if (order.pickUpVerificationCode) {
              orderLocationData.pickUpVerificationCode = order.pickUpVerificationCode;
            }
            if (order.userName) {
              orderLocationData.customerName = order.userName;
            }
            if (order.phone) {
              orderLocationData.customerPhone = order.phone;
            }
            if (order.description) {
              orderLocationData.description = order.description;
            }
            
            // Add to order-specific location history
            const orderHistoryEntry = {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              accuracy: currentLocation.accuracy,
              timestamp: currentLocation.timestamp,
              status: order.orderStatus || order.status || 'Delivering',
              recordedAt: new Date().toISOString()
            };
            
            // Update order data and add to history
            try {
              await Promise.all([
                update(orderRef, orderLocationData),
                push(orderLocationHistoryRef, orderHistoryEntry)
              ]);
              console.log('✅ Order location updated successfully:', orderId);
              console.log('📍 Firebase Path: deliveryOrders/' + orderId);
              
              // Check proximity to destination and trigger alarm if close
              await checkProximityAndAlert(order, currentLocation, orderId);
            } catch (error) {
              console.error('❌ Error updating order location:', orderId, error.message);
            }
          });
          
          // Wait for all updates to complete
          Promise.all(locationUpdatePromises).then(() => {
            console.log(`🔥 Location sent to Firebase for ${activeOrders.length} order(s)`);
          }).catch(error => {
            console.error('❌ Error in batch location update:', error);
          });
          
        } else {
          console.log('⚠️ No active orders - order tracking not sent');
        }
      }
    }, 3000); // Every 3 seconds

    // Cleanup interval on unmount or dependency change
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [userId, state.isLocationTracking, state.isOnline, state.activeOrder]);

  // 🔌 Connect to socket server with authentication
  useEffect(() => {
    if (!token || !userId) {
      console.log("❌ No token or userId available for socket connection");
      // Clear socket connection if no token/userId
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setState((prev) => ({ ...prev, isConnected: false, socket: null }));
      }
      return;
    }

    const socket = io("https://gebeta-delivery1.onrender.com", {
      transports: ["websocket"],
      auth: {
        token: token // Send JWT token for authentication
      }
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to socket:", socket.id);
      
      setState((prev) => ({ ...prev, isConnected: true, socket }));
    });

    socket.on("message", (message) => {
      console.log("📢 Delivery message received:", message);
    });

    socket.on("deliveryMessage", (message) => {
      console.log("🚚 Delivery group message:", message);
    });

    socket.on("errorMessage", (error) => {
      console.error("❌ Socket error:", error);
      Alert.alert("Connection Error", error);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      if (error.message.includes('Authentication error')) {
        Alert.alert("Authentication Error", "Please log in again");
        // You might want to trigger logout here
      }
    });

    // 🍲 New order notifications from backend (based on your notifyDeliveryGroup function)
    socket.on("deliveryMessage", (orderData) => {
      console.log("🚚 New delivery order received:", orderData);
      console.log("📍 Restaurant Location:", orderData.restaurantLocation);
      console.log("📍 Delivery Location:", orderData.deliveryLocation);
      
      // Transform the order data to match our expected format
      const transformedOrder = {
        orderId: orderData.orderId,
        order_id: orderData.orderCode, // Map orderCode to order_id for consistency
        orderCode: orderData.orderCode,
        restaurantLocation: {
          name: orderData.restaurantName,
          address: orderData.restaurantLocation?.address || 'Restaurant Location',
          lat: orderData.restaurantLocation?.lat || 0,
          lng: orderData.restaurantLocation?.lng || 0,
        },
        deliveryLocation: {
          lat: orderData.deliveryLocation?.lat || 0,
          lng: orderData.deliveryLocation?.lng || 0,
          address: orderData.deliveryLocation?.address || 'Delivery Location',
        },
        deliveryFee: orderData.deliveryFee || 0,
        tip: orderData.tip || 0,
        grandTotal: (orderData.deliveryFee || 0) + (orderData.tip || 0),
        createdAt: orderData.createdAt || new Date().toISOString(),
        customer: {
          name: 'Customer',
          phone: 'N/A',
        },
        items: [
          { name: 'Order Items', quantity: 1 }
        ],
        specialInstructions: 'Please handle with care',
      };

      console.log("🔄 Transformed order:", transformedOrder);
      console.log("📍 Restaurant coords:", transformedOrder.restaurantLocation.lat, transformedOrder.restaurantLocation.lng);
      console.log("📍 Delivery coords:", transformedOrder.deliveryLocation.lat, transformedOrder.deliveryLocation.lng);

      setState((prev) => ({
        ...prev,
        availableOrders: [...prev.availableOrders, transformedOrder],
        availableOrdersCount: prev.availableOrdersCount + 1,
        // Automatically show the order modal for new orders
        pendingOrderPopup: transformedOrder,
        showOrderModal: true,
        newOrderNotification: true, // Set notification flag
      }));
    });

    // 📊 Orders count updates (if backend sends this)
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
      // Clear location interval on disconnect
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    });

    return () => {
      socket.off("connect");
      socket.off("message");
      socket.off("deliveryMessage");
      socket.off("errorMessage");
      socket.off("connect_error");
      socket.off("available-orders-count");
      socket.off("order:cooked");
      socket.off("order:accepted");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [token, userId]);

  // Note: persistent local storage for accepted orders has been removed.

const fetchActiveOrder = useCallback(
  async (status) => {
    if (!status) {
      console.error("❌ Status parameter is required");
      setState((prev) => ({
        ...prev,
        isLoadingActiveOrder: false,
        activeOrderError: "Status parameter is required.",
      }));
      return;
    }

    if (!token) {
      console.error("❌ No authentication token available");
      setState((prev) => ({
        ...prev,
        isLoadingActiveOrder: false,
        activeOrderError: "Authentication required. Please log in again.",
      }));
      return;
    }

    try {
      setState((prev) => ({
        ...prev,
        isLoadingActiveOrder: true,
        activeOrderError: null,
      }));

      // ✅ Pass status as a query parameter
      const response = await fetch(
        `https://gebeta-delivery1.onrender.com/api/v1/orders/get-orders-by-DeliveryMan?status=${status}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      

      const data = await response.json();

      console.log(`📦 API response for status ${status}:`, data);

      if (response.ok && data.status === "success") {
        console.log(`✅ Orders with status "${status}" fetched successfully`);
        setState((prev) => ({
          ...prev,
          isLoadingActiveOrder: false,
          activeOrder: data.data, // array of orders for this status
        }));
      } else {
        
        setState((prev) => ({
          ...prev,
          isLoadingActiveOrder: false,
          activeOrderError: data.message || "Failed to fetch orders.",
        }));
      }
    } catch (error) {
      console.error("🔥 Error fetching orders:", error);
      setState((prev) => ({
        ...prev,
        isLoadingActiveOrder: false,
        activeOrderError: error.message || "An unexpected error occurred.",
      }));
    }
  },
  [token]
);




 


  // ✅ Accept order function with socket emission
  const acceptOrder = useCallback(async (orderId, deliveryPersonId) => {
    if (!socketRef.current) {
      Alert.alert("Error", "Not connected to server");
      return false;
    }

    if (!socketRef.current.connected) {
      Alert.alert("Error", "Socket not connected to server");
      return false;
    }

    if (!deliveryPersonId) {
      Alert.alert("Error", "Delivery person ID not found");
      return false;
    }

    return new Promise((resolve) => {
    try {
      
        console.log("📦 Accepting order via socket:", orderId);
        console.log('Delivery Person ID:', deliveryPersonId);
        console.log('Socket connected:', socketRef.current.connected);
        console.log('Socket ID:', socketRef.current.id);
        
        // Emit acceptOrder event to socket server
        socketRef.current.emit('acceptOrder', { orderId, deliveryPersonId }, (response) => {
          console.log("📦 Socket response:", response);
          
          if (response && response.status === 'success') {
            console.log("✅ Order accepted successfully:", response);
            
            // Store accepted order information using server response data
        const acceptedOrderData = {
          orderId: orderId,
          deliveryPersonId: deliveryPersonId,
              orderCode: response.data?.orderCode || `ORD-${orderId.slice(-6)}`,
              pickUpVerification: response.data?.pickUpVerification || 'N/A',
              message: response.message || 'Order accepted successfully',
          acceptedAt: new Date().toISOString(),
              // Additional order details from server
              restaurantLocation: response.data?.restaurantLocation,
              deliveryLocation: response.data?.deliverLocation, // Note: server uses 'deliverLocation'
              deliveryFee: response.data?.deliveryFee || 0,
              tip: response.data?.tip || 0,
              distanceKm: response.data?.distanceKm || 0,
              description: response.data?.description || '',
              status: response.data?.status || 'Accepted',
        };

        const activeOrderData = {
          orderId,
          deliveryPersonId,
          orderCode: response.data?.orderCode || `ORD-${orderId.slice(-6)}`,
          deliveryVerificationCode: response.data?.pickUpVerification || 'N/A',
          restaurantLocation: response.data?.restaurantLocation,
          deliveryLocation: response.data?.deliverLocation,
          deliveryFee: response.data?.deliveryFee || 0,
          tip: response.data?.tip || 0,
          distanceKm: response.data?.distanceKm || 0,
          description: response.data?.description || '',
          status: response.data?.status || 'Accepted',
        };

        setState((prev) => ({
          ...prev,
          acceptedOrder: acceptedOrderData,
          activeOrder: activeOrderData,
          availableOrders: prev.availableOrders.filter(
            (o) => o.orderId !== orderId
          ),
          availableOrdersCount: Math.max(0, prev.availableOrdersCount - 1),
          showOrderModal: false,
          pendingOrderPopup: null,
        }));

        // Initialize Firebase tracking for the accepted order
        initializeOrderTracking(activeOrderData).catch(error => {
          console.error('❌ Error initializing Firebase tracking:', error);
        });
      
            // Calculate total earnings
            const totalEarnings = (response.data?.deliveryFee || 0) + (response.data?.tip || 0);

        Alert.alert(
          "🎉 Order Accepted Successfully!",
              `✅ ${response.message || 'Order accepted successfully'}\n\n📦 Order Code: ${response.data?.orderCode || 'N/A'}\n🔑 Pickup Code: ${response.data?.pickUpVerification || 'N/A'}\n💰 Total Earnings: ETB ${totalEarnings.toFixed(2)}\n📏 Distance: ${response.data?.distanceKm || 0} km\n\n💡 Please proceed to the restaurant to collect your order.`,
          [
            { 
              text: 'Got it!', 
              style: 'default',
              onPress: () => console.log('User acknowledged order acceptance')
            }
          ]
        );
        
            resolve(true);
      } else {
            console.error("❌ Failed to accept order:", response);
            
            // Handle error response from socket (matches server error format)
            const errorMessage = response.message || 'Failed to accept order';
            
            if (errorMessage.includes('You already have an active order')) {
              Alert.alert(
                "🚫 Active Order Conflict",
                "⚠️ You already have an active order in progress!\n\n💡 Please complete or cancel your current order before accepting a new one.",
                [
                  { text: 'Got it', style: 'default' }
                ]
              );
            } else if (errorMessage.includes('Order is not available for acceptance')) {
              Alert.alert(
                "😔 Order No Longer Available",
                "❌ This order is no longer available for acceptance.\n\n👥 It may have been taken by another delivery person.\n\n🔄 Please refresh the orders list to see new available orders.",
                [
                  { text: 'OK', style: 'default' }
                ]
              );
            } else if (errorMessage.includes('Order ID is required')) {
              Alert.alert(
                "⚠️ Invalid Request",
                "❌ Order ID is missing from your request.\n\n🔄 Please try again or contact support if the issue persists.",
                [
                  { text: 'Try Again', style: 'default' }
                ]
              );
            } else if (errorMessage.includes('Invalid order ID')) {
              Alert.alert(
                "⚠️ Invalid Order ID",
                "❌ The order ID provided is not valid.\n\n🔄 Please try again or contact support if the issue persists.",
                [
                  { text: 'Try Again', style: 'default' }
                ]
              );
            } else {
            Alert.alert(
                "❌ Order Acceptance Failed",
                `⚠️ ${errorMessage}\n\n🔄 Please try again or contact support if the issue persists.`,
                [
                  { text: 'Try Again', style: 'default' }
                ]
              );
            }
            
            resolve(false);
          }
        });
        
        // Add timeout to handle cases where server doesn't respond
        setTimeout(() => {
          console.log("⏰ Accept order timeout - no response from server");
          Alert.alert(
            "⏰ Request Timeout",
            "The server didn't respond in time. Please check your connection and try again.",
            [
              { text: 'OK', style: 'default' }
            ]
          );
          resolve(false);
        }, 10000); // 10 second timeout
      } catch (error) {
        console.error("❌ Error accepting order:", error);
            Alert.alert(
          "🌐 Connection Error",
          "❌ Unable to send order acceptance request.\n\n📶 Please check your connection and try again.",
          [
            { text: 'Try Again', style: 'default' }
          ]
        );
        resolve(false);
      }
    });
  }, []);

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

  // 🧹 Clear all delivery data (for logout)
  const clearDeliveryData = useCallback(async () => {
    try {
      console.log('🧹 Clearing delivery data...');
      
      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Clear location interval
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      
      // Clear dynamic location interval
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
      
      // Clear stored order data
      // persistent storage for orders removed; nothing to clear
      
      // Reset state
      setState((prev) => ({
        ...prev,
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
        newOrderNotification: false,
        isLoadingOrders: false,
        ordersError: null,
        acceptedOrder: null,
        // storedOrder and related persistent flags removed
        deliveryAnalytics: null,
        isLoadingHistory: false,
        historyError: null,
        isLoadingActiveOrder: false,
        activeOrderError: null,
      }));
      
      console.log('✅ Delivery data cleared');
    } catch (error) {
      console.error('❌ Error clearing delivery data:', error);
    }
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
      
      const response = await fetch('https://gebeta-delivery1.onrender.com/api/v1/orders/cooked', {
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
        
        // Since the API doesn't include orderStatus, we'll show all orders
        // In a real scenario, you'd filter by status, but for now show all available orders
        const availableOrders = data.data.filter(order => 
          order.orderId && order.orderCode // Just ensure we have valid order data
        );
        
        console.log("📋 Available orders for dashboard:", availableOrders.length, "orders");
        
        // Transform API data to match our expected format
        const transformedOrders = availableOrders.map((order, index) => {
          console.log(`🔄 Transforming order ${index + 1}:`, order.orderCode);
          console.log('📍 Restaurant Location structure:', order.restaurantLocation);
          console.log('📍 Delivery Location structure:', order.deliveryLocation);
          
          return {
            orderId: order.orderId, // Use orderId from API
            order_id: order.orderCode, // Use orderCode as order_id
            restaurantLocation: {
              name: order.restaurantName || 'Restaurant',
              address: (typeof order.restaurantLocation === 'object' && order.restaurantLocation?.address) || 'Restaurant Location',
              lat: (typeof order.restaurantLocation === 'object' && order.restaurantLocation?.lat) || 0,
              lng: (typeof order.restaurantLocation === 'object' && order.restaurantLocation?.lng) || 0,
            },
            deliveryLocation: {
              lat: (typeof order.deliveryLocation === 'object' && order.deliveryLocation?.lat) || 0,
              lng: (typeof order.deliveryLocation === 'object' && order.deliveryLocation?.lng) || 0,
              address: (typeof order.deliveryLocation === 'object' && order.deliveryLocation?.address) || 'Delivery Location',
            },
            deliveryFee: order.deliveryFee || 0,
            tip: order.tip || 0,
            grandTotal: order.grandTotal || 0,
            createdAt: order.createdAt || new Date().toISOString(),
            customer: {
              name: 'Customer',
              phone: 'N/A',
            },
            items: [
              { name: 'Order Items', quantity: 1 }
            ],
            specialInstructions: 'Please handle with care',
            orderStatus: 'Cooked', // Assume all orders from this endpoint are ready
          };
        });

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

    // Validate data structure
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
        updatedAt: new Date(order.updatedAt).toISOString(), // Ensure consistent date format
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

  // ✅ Verify delivery function
  const verifyDelivery = useCallback(async (orderId, verificationCode) => {
    if (!token) {
      Alert.alert("Error", "Authentication required. Please log in again.");
      return;
    }
    console.log('🔍 Verifying delivery for order:', orderId, 'with code:', verificationCode);
    console.log('🔍 Token:', token);
  
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
        // Update Firebase status to "Delivered"
        await updateDeliveryStatus(orderId, "Delivered", {
          deliveredAt: new Date().toISOString(),
          verificationCode: verificationCode
        });
        
        setState((prev) => ({ ...prev, activeOrder: null, acceptedOrder: null }));
        
        Alert.alert("🎉 Delivery Verified!", data.message);
        return { success: true, data: data.data };
      }
  
      // Handle different error response formats
      let errorMessage = "Please try again.";
      
      if (data.error) {
        if (typeof data.error === 'string') {
          errorMessage = data.error;
        } else if (data.error.message) {
          errorMessage = data.error.message;
        }
      } else if (data.message) {
        errorMessage = data.message;
      }
      
      console.log('❌ Verification failed:', errorMessage);
      Alert.alert("❌ Verification Failed", errorMessage);
      return { success: false, error: errorMessage };
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
    // Persistent stored order was removed; nothing to refresh.
  }, []);

  // 📍 Location tracking functions
  const startLocationTracking = useCallback(async () => {
    try {
      await locationService.startLocationTracking();
      setState((prev) => ({ 
        ...prev, 
        isLocationTracking: true,
        locationError: null
      }));
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setState((prev) => ({ 
        ...prev, 
        locationError: error.message,
        isLocationTracking: false
      }));
    }
  }, []);

  const stopLocationTracking = useCallback(() => {
    locationService.stopLocationTracking();
    setState((prev) => ({ 
      ...prev, 
      isLocationTracking: false
    }));
    // Clear interval when stopping tracking
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  }, []);

  const getCurrentLocation = useCallback(() => {
    return locationService.getCurrentLocation();
  }, []);

  const getCurrentLocationAsync = useCallback(async () => {
    try {
      return await locationService.getCurrentLocationAsync();
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }, []);

  const calculateDistanceToLocation = useCallback((targetLat, targetLng) => {
    const currentLocation = locationService.getCurrentLocation();
    if (!currentLocation) return null;
    
    return locationService.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      targetLat,
      targetLng
    );
  }, []);

  // 📍 Update delivery status in Firebase
  const updateDeliveryStatus = useCallback(async (orderId, status, additionalData = {}) => {
    if (!state.activeOrder || state.activeOrder.orderId !== orderId) {
      console.warn('No active order found for status update');
      return false;
    }

    try {
      const orderRef = ref(database, `deliveryOrders/${orderId}`);
      const statusUpdate = {
        status: status,
        statusUpdatedAt: new Date().toISOString(),
        ...additionalData
      };

      await update(orderRef, statusUpdate);
      
      // Update local state
      setState((prev) => ({
        ...prev,
        activeOrder: {
          ...prev.activeOrder,
          status: status,
          ...additionalData
        }
      }));

      // Update location tracking interval based on new status
      updateLocationTrackingInterval(status);

      console.log(`✅ Delivery status updated to: ${status}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating delivery status:', error);
      return false;
    }
  }, [state.activeOrder]);

  // 📍 Send location update to Firebase (can be called manually)
  const sendLocationUpdate = useCallback(async (orderId) => {
    if (!orderId) {
      console.warn('Order ID required for location update');
      return false;
    }

    const currentLocation = locationService.getCurrentLocation();
    if (!currentLocation) {
      console.warn('No current location available');
      return false;
    }

    try {
      const orderRef = ref(database, `deliveryOrders/${orderId}`);
      const locationData = {
        deliveryLocation: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          timestamp: currentLocation.timestamp
        },
        lastLocationUpdate: new Date().toISOString(),
        deliveryPerson: {
          id: userId,
          name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          phone: user?.phone || 'N/A',
          deliveryMethod: user?.deliveryMethod || 'N/A'
        }
      };

      await update(orderRef, locationData);
      console.log('📍 Manual location update sent to Firebase');
      return true;
    } catch (error) {
      console.error('❌ Error sending location update:', error);
      return false;
    }
  }, [userId, user]);

  // 📍 Initialize order tracking in Firebase when order is accepted
  const initializeOrderTracking = useCallback(async (orderData) => {
    if (!orderData || !orderData.orderId) {
      console.error('❌ Invalid order data for tracking initialization:', orderData);
      return false;
    }

    console.log('🚀 Initializing Firebase tracking for order:', orderData.orderId);
    console.log('📦 Order Data:', {
      orderId: orderData.orderId,
      orderCode: orderData.orderCode,
      status: orderData.status,
      restaurantLocation: orderData.restaurantLocation,
      deliveryLocation: orderData.deliveryLocation
    });

    try {
      const orderRef = ref(database, `deliveryOrders/${orderData.orderId}`);
      
      // Get current location for initial tracking
      const currentLocation = locationService.getCurrentLocation();
      
      const initialData = {
        orderId: orderData.orderId,
        orderCode: orderData.orderCode || `ORD-${orderData.orderId.slice(-6)}`,
        status: orderData.status || 'Accepted',
        acceptedAt: new Date().toISOString(),
        deliveryPerson: {
          id: userId,
          name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          phone: user?.phone || 'N/A',
          deliveryMethod: user?.deliveryMethod || 'N/A'
        },
        restaurantLocation: orderData.restaurantLocation,
        customerLocation: orderData.deliveryLocation, // Customer destination
        deliveryFee: orderData.deliveryFee || 0,
        tip: orderData.tip || 0,
        distanceKm: orderData.distanceKm || 0,
        description: orderData.description || '',
        trackingEnabled: true,
        lastLocationUpdate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        // Add initial delivery location if available
        ...(currentLocation && {
          deliveryLocation: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            accuracy: currentLocation.accuracy,
            timestamp: currentLocation.timestamp
          }
        })
      };

      await update(orderRef, initialData);
      console.log('✅ Order tracking initialized successfully in Firebase');
      console.log('📍 Firebase Path: deliveryOrders/' + orderData.orderId);
      console.log('🔥 Customer can now track this order in real-time');
      return true;
    } catch (error) {
      console.error('❌ Error initializing order tracking:', error);
      console.error('❌ Error details:', error.message);
      return false;
    }
  }, [userId, user]);

  // 📍 Send delivery guy location directly to Firebase (manual trigger)
  const sendDeliveryGuyLocationToFirebase = useCallback(async () => {
    if (!userId) {
      console.warn('User ID required for location update');
      return false;
    }

    const currentLocation = locationService.getCurrentLocation();
    if (!currentLocation) {
      console.warn('No current location available');
      return false;
    }

    try {
      const deliveryGuyRef = ref(database, `deliveryGuys/${userId}`);
      const locationHistoryRef = ref(database, `deliveryGuys/${userId}/locationHistory`);
      
      const locationData = {
        currentLocation: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          timestamp: currentLocation.timestamp
        },
        lastLocationUpdate: new Date().toISOString(),
        deliveryPerson: {
          id: userId,
          name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          phone: user?.phone || 'N/A',
          deliveryMethod: user?.deliveryMethod || 'N/A'
        },
        isOnline: state.isOnline,
        isTracking: state.isLocationTracking,
        activeOrderId: state.activeOrder?.orderId || null,
        status: state.activeOrder?.status || 'Available'
      };
      
      const historyEntry = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        timestamp: currentLocation.timestamp,
        status: state.activeOrder?.status || 'Available',
        recordedAt: new Date().toISOString(),
        activeOrderId: state.activeOrder?.orderId || null
      };
      
      await Promise.all([
        update(deliveryGuyRef, locationData),
        push(locationHistoryRef, historyEntry)
      ]);
      
      console.log('🔥 Manual delivery guy location sent to Firebase');
      return true;
    } catch (error) {
      console.error('❌ Error sending delivery guy location:', error);
      return false;
    }
  }, [userId, user, state.isOnline, state.isLocationTracking, state.activeOrder]);

  // 📍 Get optimal location update interval based on delivery status
  const getLocationUpdateInterval = useCallback((status) => {
    switch (status) {
      case 'Accepted':
        return 10000; // 10 seconds - driver heading to restaurant
      case 'PickedUp':
        return 5000;  // 5 seconds - driver heading to customer
      case 'InTransit':
        return 3000;  // 3 seconds - actively delivering
      case 'Delivered':
        return 0;     // Stop updates
      default:
        return 10000; // Default 10 seconds
    }
  }, []);

  // 📍 Update location tracking interval based on status
  const updateLocationTrackingInterval = useCallback((status) => {
    const interval = getLocationUpdateInterval(status);
    
    // Clear existing interval
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = null;
    }
    
    // If interval is 0, stop tracking
    if (interval === 0) {
      console.log('📍 Location tracking stopped - order delivered');
      return;
    }
    
    // Set new interval
    locationUpdateIntervalRef.current = setInterval(() => {
      const currentLocation = locationService.getCurrentLocation();
      if (currentLocation && state.activeOrder) {
        // Send location update
        const orderRef = ref(database, `deliveryOrders/${state.activeOrder.orderId}`);
        const locationHistoryRef = ref(database, `deliveryOrders/${state.activeOrder.orderId}/locationHistory`);
        
        const locationData = {
          deliveryLocation: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            accuracy: currentLocation.accuracy,
            timestamp: currentLocation.timestamp
          },
          lastLocationUpdate: new Date().toISOString(),
          status: status
        };
        
        const historyEntry = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          timestamp: currentLocation.timestamp,
          status: status,
          recordedAt: new Date().toISOString()
        };
        
        Promise.all([
          update(orderRef, locationData),
          push(locationHistoryRef, historyEntry)
        ]).catch(error => {
          console.error('❌ Error updating location:', error);
        });
        
        console.log(`📍 Location update sent (${status}) - Interval: ${interval}ms`);
      }
    }, interval);
    
    console.log(`📍 Location tracking interval updated to ${interval}ms for status: ${status}`);
  }, [state.activeOrder, getLocationUpdateInterval]);

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
     
        // Active order functions
        fetchActiveOrder,
        // Location tracking functions
        startLocationTracking,
        stopLocationTracking,
        getCurrentLocation,
        getCurrentLocationAsync,
        calculateDistanceToLocation,
        // Firebase tracking functions
        updateDeliveryStatus,
        sendLocationUpdate,
        initializeOrderTracking,
        sendDeliveryGuyLocationToFirebase,
        getLocationUpdateInterval,
        updateLocationTrackingInterval,
        // Cleanup functions
        clearDeliveryData,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
};