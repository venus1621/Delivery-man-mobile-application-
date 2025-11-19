// Example usage of the enhanced delivery tracking system

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDelivery } from '../providers/delivery-provider';
import DeliveryStatusManager from '../components/DeliveryStatusManager';

const DeliveryTrackingExample = () => {
  const { 
    activeOrder, 
    updateDeliveryStatus, 
    sendLocationUpdate,
    getLocationUpdateInterval,
    updateLocationTrackingInterval 
  } = useDelivery();

  // Example: Update status when order is picked up
  const handlePickup = async () => {
    if (activeOrder) {
      const success = await updateDeliveryStatus(activeOrder.orderId, 'PickedUp', {
        pickedUpAt: new Date().toISOString(),
        restaurantName: 'Restaurant Name'
      });
      
      if (success) {
        // Location tracking will automatically adjust to 5-second intervals
      }
    }
  };

  // Example: Update status when starting delivery
  const handleStartDelivery = async () => {
    if (activeOrder) {
      const success = await updateDeliveryStatus(activeOrder.orderId, 'InTransit', {
        inTransitAt: new Date().toISOString()
      });
      
      if (success) {
        // Location tracking will automatically adjust to 3-second intervals
      }
    }
  };

  // Example: Manual location update
  const handleManualLocationUpdate = async () => {
    if (activeOrder) {
      const success = await sendLocationUpdate(activeOrder.orderId);
      if (success) {
      }
    }
  };

  // Example: Get current update interval
  const getCurrentInterval = () => {
    if (activeOrder) {
      const interval = getLocationUpdateInterval(activeOrder.status);
      return interval;
    }
    return null;
  };

  if (!activeOrder) {
    return (
      <View style={styles.container}>
        <Text style={styles.noOrderText}>No active order</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Tracking</Text>
      
      <View style={styles.orderInfo}>
        <Text style={styles.orderText}>Order ID: {activeOrder.orderId}</Text>
        <Text style={styles.orderText}>Status: {activeOrder.status}</Text>
        <Text style={styles.orderText}>Current Interval: {getCurrentInterval()}ms</Text>
      </View>

      <DeliveryStatusManager 
        orderId={activeOrder.orderId}
        currentStatus={activeOrder.status}
        onStatusUpdate={(newStatus) => {
        }}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handlePickup}>
          <Text style={styles.buttonText}>Mark as Picked Up</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleStartDelivery}>
          <Text style={styles.buttonText}>Start Delivery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleManualLocationUpdate}>
          <Text style={styles.buttonText}>Send Location Update</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  orderInfo: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  orderText: {
    fontSize: 16,
    marginBottom: 5,
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noOrderText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
  },
});

export default DeliveryTrackingExample;
