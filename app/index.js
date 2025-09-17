import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../providers/auth-provider';
import { LinearGradient } from 'expo-linear-gradient';
import { Truck } from 'lucide-react-native';
import DashboardScreen from './tabs/dashboard';
import LoginScreen from './login';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {

      if (isAuthenticated) {
        // If authenticated, go to dashboard
        router.replace(DashboardScreen);
      } else {
        // Always start with login page when not authenticated
        router.replace(LoginScreen);
      }
    }
  }, [isAuthenticated, isLoading]);

  
  return (
    <View style={styles.container}>
      {/* <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.gradient}
      >
        <View style={styles.logoContainer}>
          <Truck color="#FFFFFF" size={48} />
        </View>r
        <ActivityIndicator 
          size="large" 
          color="#FFFFFF" 
          style={styles.loader}
        />
      </LinearGradient> */}
      <LoginScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  loader: {
    marginTop: 16,
  },
});
