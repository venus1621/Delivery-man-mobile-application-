import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [state, setState] = useState({
    isAuthenticated: false,
    isLoading: true,
    token: null,
    userId: null,
    userRole: null,
    user: null,
  });

  const checkAuthStatus = useCallback(async () => {
    try {
      console.log('🔍 Checking authentication status...');
      
      const [token, userId, userRole, userProfile] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('userRole'),
        AsyncStorage.getItem('userProfile'),
      ]);

      console.log('📱 Stored data found:');
      console.log('- Token:', token ? 'Present' : 'Missing');
      console.log('- User ID:', userId || 'Missing');
      console.log('- User Role:', userRole || 'Missing');
      console.log('- User Profile:', userProfile ? 'Present' : 'Missing');

      if (token && userId) {
        let user = null;
        if (userProfile) {
          try {
            user = JSON.parse(userProfile);
            console.log('👤 User profile loaded:', user);
          } catch (e) {
            console.error('Error parsing user profile:', e);
          }
        }

        // Check if user is a Delivery Person
        if (user && user.role !== 'Delivery_Person') {
          console.log('❌ User is not a Delivery Person - logging out');
          // Clear all stored data
          await Promise.all([
            AsyncStorage.removeItem('authToken'),
            AsyncStorage.removeItem('userId'),
            AsyncStorage.removeItem('userRole'),
            AsyncStorage.removeItem('userProfile'),
          ]);
          
          setState({
            isAuthenticated: false,
            isLoading: false,
            token: null,
            userId: null,
            userRole: null,
            user: null,
          });
          return;
        }

        setState({
          isAuthenticated: true,
          isLoading: false,
          token,
          userId,
          userRole: userRole || 'Delivery_Person',
          user,
        });
        
        console.log('✅ User authenticated, delivery person ID:', userId);
      } else {
        setState({
          isAuthenticated: false,
          isLoading: false,
          token: null,
          userId: null,
          userRole: null,
          user: null,
        });
        
        console.log('❌ User not authenticated - redirecting to login');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setState({
        isAuthenticated: false,
        isLoading: false,
        token: null,
        userId: null,
        userRole: null,
        user: null,
      });
    }
  }, []);

  const login = useCallback(async (phone, password) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      console.log('🔐 Attempting login for phone:', phone);
      
      const response = await fetch('https://gebeta-delivery1.onrender.com/api/v1/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        const { token, data: { user } } = data;
        
        console.log('👤 User data received:', user);
        console.log('🆔 Delivery Person ID:', user._id);
        
        // Store all user data in AsyncStorage
        await Promise.all([
          AsyncStorage.setItem('authToken', token),
          AsyncStorage.setItem('userId', user._id),
          AsyncStorage.setItem('userRole', user.role),
          AsyncStorage.setItem('userProfile', JSON.stringify(user)),
        ]);

        setState({
          isAuthenticated: true,
          isLoading: false,
          token,
          userId: user._id,
          userRole: user.role,
          user,
        });

        console.log('✅ Login successful, delivery person ID stored:', user._id);
        return { success: true, userId: user._id, user };
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        console.log('❌ Login failed:', data.message);
        
        // Display server error message
        const serverMessage = data.message || data.error || 
                             (data.errors && data.errors[0]?.msg) || 
                             'Login failed';
        return { success: false, message: serverMessage };
      }
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      // Check if it's a network error or something else
      const errorMessage = error.message === 'Failed to fetch' || error.message.includes('Network request failed')
        ? 'Unable to connect to server. Please check your internet connection and try again.'
        : 'Something went wrong. Please try again later.';
      
      return { success: false, message: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Logging out user...');
      
      // Clear all stored data
      await Promise.all([
        AsyncStorage.removeItem('authToken'),
        AsyncStorage.removeItem('userId'),
        AsyncStorage.removeItem('userRole'),
        AsyncStorage.removeItem('userProfile'),
        AsyncStorage.removeItem('isOnline'),
        // Clear delivery-related stored data
  // delivery-related persistent storage removed from app
      ]);

      console.log('🧹 All stored data cleared');

      // Update auth state
      setState({
        isAuthenticated: false,
        isLoading: false,
        token: null,
        userId: null,
        userRole: null,
        user: null,
      });

      // Navigate to login screen
      router.replace('/login');
      
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Even if there's an error, try to navigate to login
      router.replace('/login');
    }
  }, []);

  const clearAllData = useCallback(async () => {
    try {
      console.log('🧹 Clearing all stored data...');
      
      await Promise.all([
        AsyncStorage.removeItem('authToken'),
        AsyncStorage.removeItem('userId'),
        AsyncStorage.removeItem('userRole'),
        AsyncStorage.removeItem('userProfile'),
        AsyncStorage.removeItem('isOnline'),
      ]);

      console.log('✅ All data cleared successfully');
      
      setState({
        isAuthenticated: false,
        isLoading: false,
        token: null,
        userId: null,
        userRole: null,
        user: null,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error clearing data:', error);
      return { success: false, error: error.message };
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return useMemo(() => ({
    ...state,
    login,
    checkAuthStatus,
    logout,
    clearAllData,
  }), [state, login, checkAuthStatus, logout, clearAllData]);
});
