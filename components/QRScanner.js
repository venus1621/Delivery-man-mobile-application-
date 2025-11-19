import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { X, Camera as CameraIcon, AlertCircle, Scan } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function QRScanner({ visible, onClose, onScanSuccess, orderId }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (visible) {
      requestCameraPermission();
    }
  }, [visible]);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to scan QR codes.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert('Error', 'Failed to request camera permission');
    }
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);

    try {
      // Parse the QR code data
      let verificationData;
      
      // Try to parse as JSON first
      try {
        verificationData = JSON.parse(data);
      } catch {
        // If not JSON, treat as plain verification code
        verificationData = { code: data };
      }

      // Extract verification code
      const verificationCode = verificationData.code || 
                               verificationData.verificationCode || 
                               verificationData.orderId || 
                               data;

      // Success feedback
      if (Platform.OS === 'android') {
        const { Vibration } = require('react-native');
        Vibration.vibrate(200);
      }

      // Pass the scanned data to the parent component
      setTimeout(() => {
        onScanSuccess(verificationCode, verificationData);
        setIsProcessing(false);
        setScanned(false);
      }, 500);

    } catch (error) {
      console.error('❌ Error processing QR code:', error);
      Alert.alert(
        'Invalid QR Code',
        'The scanned QR code is not valid. Please try again or enter the code manually.',
        [
          { 
            text: 'Try Again', 
            onPress: () => {
              setScanned(false);
              setIsProcessing(false);
            }
          },
          { text: 'Cancel', onPress: onClose }
        ]
      );
    }
  };

  const handleClose = () => {
    setScanned(false);
    setIsProcessing(false);
    onClose();
  };

  if (!visible) return null;

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <AlertCircle color="#EF4444" size={48} />
          <Text style={styles.permissionTitle}>Camera Access Denied</Text>
          <Text style={styles.permissionMessage}>
            Please enable camera access in your device settings to scan QR codes.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'pdf417'],
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.4)']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Scan color="#FFFFFF" size={24} />
                <Text style={styles.headerTitle}>Scan QR Code</Text>
              </View>
              <TouchableOpacity
                style={styles.closeIconButton}
                onPress={handleClose}
                disabled={isProcessing}
              >
                <X color="#FFFFFF" size={24} />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerSubtitle}>
              Position the QR code within the frame
            </Text>
          </LinearGradient>
        </View>

        {/* Scanning Frame */}
        <View style={styles.scanFrame}>
          <View style={styles.scanFrameOverlay}>
            <View style={styles.scanBox}>
              {/* Corner borders */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
              
              {/* Scanning indicator */}
              {!scanned && !isProcessing && (
                <View style={styles.scanLineContainer}>
                  <View style={styles.scanLine} />
                </View>
              )}

              {isProcessing && (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.processingText}>Verifying...</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Footer Instructions */}
        <View style={styles.footer}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.8)']}
            style={styles.footerGradient}
          >
            <View style={styles.instructionContainer}>
              <CameraIcon color="#FFFFFF" size={20} />
              <Text style={styles.instructionText}>
                Ask the customer to show their verification QR code
              </Text>
            </View>

            {scanned && (
              <TouchableOpacity
                style={styles.scanAgainButton}
                onPress={() => {
                  setScanned(false);
                  setIsProcessing(false);
                }}
              >
                <Text style={styles.scanAgainText}>Scan Again</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#1F2937',
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  camera: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  closeIconButton: {
    padding: 8,
  },
  scanFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrameOverlay: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBox: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#10B981',
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanLineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    paddingBottom: 40,
  },
  footerGradient: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 20,
  },
  scanAgainButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  scanAgainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});




