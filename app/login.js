import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Truck, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../providers/auth-provider';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      setErrorMessage('Please enter both phone number and password');
      return;
    }
    const fullPhone = `+251${phone.trim()}`;
    const result = await login(fullPhone, password.trim());
    
    if (result.success) {
      setSuccessMessage('Login successful! Redirecting...');
      setTimeout(() => {
        router.replace('/tabs/dashboard');
      }, 1500);
    } else {
      setErrorMessage(result.message || 'Invalid credentials');
    }
  };

  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                  style={styles.logoContainer}
                >
                  <Truck color="#667eea" size={32} />
                </LinearGradient>
                <Text style={styles.title}>Gebeta Delivery</Text>
                <Text style={styles.subtitle}>Sign in to start delivering</Text>
              </View>

              {/* Form Card */}
              <View style={styles.formCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                  style={styles.formGradient}
                >
                  {/* Phone Input */}
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.countryCodeContainer}>
                        <Text style={styles.countryCode}>+251</Text>
                      </View>
                      <TextInput
                        style={[styles.input, { backgroundColor: 'transparent' }]}
                        placeholder="911111111"
                        placeholderTextColor="#9ca3af"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        autoCorrect={false}
                        testID="phone-input"
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <View style={[styles.inputIcon, { backgroundColor: 'rgba(107, 114, 128, 0.1)' }]}>
                        <Lock color="#6b7280" size={20} />
                      </View>
                      <TextInput
                        style={[styles.input, { backgroundColor: 'transparent' }]}
                        placeholder="Password"
                        placeholderTextColor="#9ca3af"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        testID="password-input"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                      >
                        {showPassword ? (
                          <EyeOff color="#6b7280" size={20} />
                        ) : (
                          <Eye color="#6b7280" size={20} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Login Button */}
                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    disabled={isLoading}
                    testID="login-button"
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.loginGradient}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.loginButtonText}>Sign In</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>         
                </LinearGradient>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Don&apos;t have an account? Contact your administrator
                </Text>
              </View>

              {/* Message Banner */}
              {(errorMessage || successMessage) && (
                <View style={[
                  styles.messageBanner,
                  errorMessage ? styles.errorBanner : styles.successBanner
                ]}>
                  <View style={styles.messageIcon}>
                    {errorMessage ? (
                      <AlertCircle color="#ef4444" size={20} />
                    ) : (
                      <CheckCircle color="#10b981" size={20} />
                    )}
                  </View>
                  <Text style={[
                    styles.messageText,
                    errorMessage ? styles.errorText : styles.successText
                  ]}>
                    {errorMessage || successMessage}
                  </Text>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
  },
  formCard: {
    marginBottom: 32,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  formGradient: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  countryCode: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loginGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#e5e7eb',
    textAlign: 'center',
  },
  messageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 24,
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  messageIcon: {
    marginRight: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  successText: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#FFFFFF',
  },
});