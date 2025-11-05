import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Truck, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Phone, X, Key } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../providers/auth-provider';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [touched, setTouched] = useState({ phone: false, password: false });

  // Forgot Password Modal States
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: Phone, 2: OTP & New Password
  const [resetPhone, setResetPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Validation logic
  const validation = useMemo(() => {
    const phoneValid = phone.trim().length === 9 && /^\d+$/.test(phone);
    const passwordValid = password.trim().length >= 3;
    return {
      phoneValid,
      passwordValid,
      isValid: phoneValid && passwordValid,
    };
  }, [phone, password]);

  const handleLogin = useCallback(async () => {
    // Mark all fields as touched
    setTouched({ phone: true, password: true });

    // Validation
    if (!phone.trim() || !password.trim()) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (phone.trim().length !== 9 || !/^\d+$/.test(phone)) {
      setErrorMessage('Please enter a valid 9-digit phone number');
      return;
    }

    if (password.trim().length < 3) {
      setErrorMessage('Password must be at least 3 characters');
      return;
    }

    // Clear error and close keyboard
    setErrorMessage('');
    Keyboard.dismiss();

    const fullPhone = `+251${phone.trim()}`;
    const result = await login(fullPhone, password.trim());
    
    if (result.success) {
      // Check if user is a Delivery Person
      if (result.user?.role !== 'Delivery_Person') {
        setErrorMessage('Access denied. Only delivery personnel can login to this app.');
        return;
      }
      
      setSuccessMessage('Login successful! Redirecting...');
      // Immediate navigation
      router.replace('/tabs/dashboard');
    } else {
      setErrorMessage(result.message || 'Invalid credentials. Please try again.');
    }
  }, [phone, password, login]);

  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  // Forgot Password - Step 1: Request OTP
  const handleRequestOTP = useCallback(async () => {
    setResetError('');
    setResetSuccess('');

    if (resetPhone.trim().length !== 9 || !/^\d+$/.test(resetPhone)) {
      setResetError('Please enter a valid 9-digit phone number');
      return;
    }

    setIsResettingPassword(true);
    Keyboard.dismiss();

    try {
      const fullPhone = `+251${resetPhone.trim()}`;
      const response = await fetch('https://gebeta-delivery1.onrender.com/api/v1/users/requestResetOTP', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setVerificationId(data.data?.verificationId || '');
        setResetSuccess(data.data?.message || 'OTP sent successfully!');
        setTimeout(() => {
          setForgotPasswordStep(2);
          setResetSuccess('');
        }, 1500);
      } else {
        // Display server error message
        const serverMessage = data.message || data.error || 
                             (data.errors && data.errors[0]?.msg) || 
                             'Failed to send OTP. Please try again.';
        setResetError(serverMessage);
      }
    } catch (error) {
      console.error('Error requesting OTP:', error);
      
      // Check if it's a network error or something else
      const errorMessage = error.message === 'Failed to fetch' || error.message.includes('Network request failed')
        ? 'Unable to connect to server. Please check your internet connection and try again.'
        : 'Something went wrong. Please try again later.';
      
      setResetError(errorMessage);
    } finally {
      setIsResettingPassword(false);
    }
  }, [resetPhone]);

  // Forgot Password - Step 2: Reset Password with OTP
  const handleResetPassword = useCallback(async () => {
    setResetError('');
    setResetSuccess('');

    // Validation
    if (!otp.trim()) {
      setResetError('Please enter the OTP code');
      return;
    }

    if (otp.trim().length !== 6) {
      setResetError('OTP must be 6 digits');
      return;
    }

    if (!newPassword.trim() || newPassword.trim().length < 3) {
      setResetError('Password must be at least 3 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    setIsResettingPassword(true);
    Keyboard.dismiss();

    try {
      const fullPhone = `+251${resetPhone.trim()}`;
      const response = await fetch('https://gebeta-delivery1.onrender.com/api/v1/users/resetPasswordOTP', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: fullPhone,
          code: otp.trim(),
          password: newPassword.trim(),
          passwordConfirm: confirmPassword.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Check if user is a Delivery Person
        if (data.data?.user?.role !== 'Delivery_Person') {
          setResetError('Access denied. Only delivery personnel can access this app.');
          return;
        }
        
        setResetSuccess('Password reset successful! Logging you in...');
        
        // Auto-login with the returned token
        if (data.token && data.data?.user) {
          const { token, data: { user } } = data;
          
          // Store auth data in AsyncStorage (same as login flow)
          await Promise.all([
            AsyncStorage.setItem('authToken', token),
            AsyncStorage.setItem('userId', user._id),
            AsyncStorage.setItem('userRole', user.role),
            AsyncStorage.setItem('userProfile', JSON.stringify(user)),
          ]);

          console.log('✅ Password reset successful, user authenticated:', user._id);
          
          setTimeout(() => {
            // Close modal and navigate
            setShowForgotPasswordModal(false);
            setSuccessMessage('Password reset successful! Welcome back!');
            router.replace('/tabs/dashboard');
            
            // Reset forgot password form
            setForgotPasswordStep(1);
            setResetPhone('');
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
            setResetError('');
            setResetSuccess('');
          }, 1500);
        }
      } else {
        // Display server error message
        const serverMessage = data.message || data.error || 
                             (data.errors && data.errors[0]?.msg) || 
                             'Failed to reset password. Please try again.';
        setResetError(serverMessage);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      
      // Check if it's a network error or something else
      const errorMessage = error.message === 'Failed to fetch' || error.message.includes('Network request failed')
        ? 'Unable to connect to server. Please check your internet connection and try again.'
        : 'Something went wrong. Please try again later.';
      
      setResetError(errorMessage);
    } finally {
      setIsResettingPassword(false);
    }
  }, [resetPhone, otp, newPassword, confirmPassword]);

  // Close forgot password modal
  const handleCloseForgotPassword = useCallback(() => {
    setShowForgotPasswordModal(false);
    setForgotPasswordStep(1);
    setResetPhone('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setResetSuccess('');
  }, []);

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
                    <View style={[
                      styles.inputWrapper,
                      touched.phone && !validation.phoneValid && styles.inputError
                    ]}>
                      <View style={styles.inputIconContainer}>
                        <Phone color={touched.phone && !validation.phoneValid ? "#ef4444" : "#6b7280"} size={20} />
                      </View>
                      <View style={styles.countryCodeContainer}>
                        <Text style={styles.countryCode}>+251</Text>
                      </View>
                      <TextInput
                        style={[styles.input, { backgroundColor: 'transparent' }]}
                        placeholder="911111111"
                        placeholderTextColor="#9ca3af"
                        value={phone}
                        onChangeText={(text) => {
                          setPhone(text.replace(/[^0-9]/g, '').slice(0, 9));
                          if (touched.phone) setTouched(prev => ({ ...prev, phone: true }));
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={9}
                        testID="phone-input"
                      />
                    </View>
                    {touched.phone && !validation.phoneValid && phone.length > 0 && (
                      <Text style={styles.validationText}>Enter a valid 9-digit number</Text>
                    )}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <View style={[
                      styles.inputWrapper,
                      touched.password && !validation.passwordValid && styles.inputError
                    ]}>
                      <View style={styles.inputIconContainer}>
                        <Lock color={touched.password && !validation.passwordValid ? "#ef4444" : "#6b7280"} size={20} />
                      </View>
                      <TextInput
                        style={[styles.input, { backgroundColor: 'transparent' }]}
                        placeholder="Password (min 3 characters)"
                        placeholderTextColor="#9ca3af"
                        value={password}
                        onChangeText={setPassword}
                        onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                        onSubmitEditing={handleLogin}
                        returnKeyType="go"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        testID="password-input"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                        testID="toggle-password"
                      >
                        {showPassword ? (
                          <EyeOff color="#6b7280" size={20} />
                        ) : (
                          <Eye color="#6b7280" size={20} />
                        )}
                      </TouchableOpacity>
                    </View>
                    {touched.password && !validation.passwordValid && password.length > 0 && (
                      <Text style={styles.validationText}>Password must be at least 4 characters</Text>
                    )}
                  </View>

                  {/* Forgot Password Link */}
                  <TouchableOpacity
                    onPress={() => setShowForgotPasswordModal(true)}
                    style={styles.forgotPasswordButton}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>

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

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPasswordModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseForgotPassword}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalIconContainer}>
                    <Key color="#FFFFFF" size={32} />
                  </View>
                  <Text style={styles.modalTitle}>
                    {forgotPasswordStep === 1 ? 'Reset Password' : 'Verify & Reset'}
                  </Text>
                  <TouchableOpacity
                    onPress={handleCloseForgotPassword}
                    style={styles.closeButton}
                    activeOpacity={0.7}
                  >
                    <X color="#6b7280" size={22} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {forgotPasswordStep === 1 ? (
                    /* Step 1: Phone Number */
                    <View style={styles.modalBody}>
                      <Text style={styles.modalDescription}>
                        Enter your registered phone number and we'll send you a 6-digit verification code to reset your password.
                      </Text>

                      {/* Phone Input */}
                      <View style={styles.modalInputContainer}>
                        <View style={[styles.inputWrapper, styles.modalInputWrapper]}>
                          <View style={styles.inputIconContainer}>
                            <Phone color="#6b7280" size={20} />
                          </View>
                          <View style={styles.countryCodeContainer}>
                            <Text style={styles.countryCode}>+251</Text>
                          </View>
                          <TextInput
                            style={[styles.input, styles.modalInput]}
                            placeholder="911111111"
                            placeholderTextColor="#9ca3af"
                            value={resetPhone}
                            onChangeText={(text) => {
                              setResetPhone(text.replace(/[^0-9]/g, '').slice(0, 9));
                            }}
                            keyboardType="phone-pad"
                            autoCapitalize="none"
                            autoCorrect={false}
                            maxLength={9}
                          />
                        </View>
                      </View>

                      {/* Request OTP Button */}
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={handleRequestOTP}
                        disabled={isResettingPassword}
                      >
                        <LinearGradient
                          colors={['#667eea', '#764ba2']}
                          style={styles.modalButtonGradient}
                        >
                          {isResettingPassword ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text style={styles.modalButtonText}>Send OTP</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* Step 2: OTP & New Password */
                    <View style={styles.modalBody}>
                      <Text style={styles.modalDescription}>
                        We've sent a verification code to +251{resetPhone}. Enter the code below and create a new password.
                      </Text>

                      {/* OTP Input */}
                      <View style={styles.modalInputContainer}>
                        <Text style={styles.inputLabel}>Verification Code</Text>
                        <View style={[styles.inputWrapper, styles.modalInputWrapper]}>
                          <View style={styles.inputIconContainer}>
                            <Key color="#6b7280" size={20} />
                          </View>
                          <TextInput
                            style={[styles.input, styles.modalInput]}
                            placeholder="Enter 6-digit code"
                            placeholderTextColor="#9ca3af"
                            value={otp}
                            onChangeText={(text) => {
                              setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
                            }}
                            keyboardType="number-pad"
                            autoCapitalize="none"
                            autoCorrect={false}
                            maxLength={6}
                          />
                        </View>
                      </View>

                      {/* New Password Input */}
                      <View style={styles.modalInputContainer}>
                        <Text style={styles.inputLabel}>New Password</Text>
                        <View style={[styles.inputWrapper, styles.modalInputWrapper]}>
                          <View style={styles.inputIconContainer}>
                            <Lock color="#6b7280" size={20} />
                          </View>
                          <TextInput
                            style={[styles.input, styles.modalInput]}
                            placeholder="Enter new password"
                            placeholderTextColor="#9ca3af"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showNewPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                          <TouchableOpacity
                            onPress={() => setShowNewPassword(!showNewPassword)}
                            style={styles.eyeIcon}
                          >
                            {showNewPassword ? (
                              <EyeOff color="#6b7280" size={20} />
                            ) : (
                              <Eye color="#6b7280" size={20} />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Confirm Password Input */}
                      <View style={styles.modalInputContainer}>
                        <Text style={styles.inputLabel}>Confirm Password</Text>
                        <View style={[styles.inputWrapper, styles.modalInputWrapper]}>
                          <View style={styles.inputIconContainer}>
                            <Lock color="#6b7280" size={20} />
                          </View>
                          <TextInput
                            style={[styles.input, styles.modalInput]}
                            placeholder="Confirm new password"
                            placeholderTextColor="#9ca3af"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                          <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeIcon}
                          >
                            {showConfirmPassword ? (
                              <EyeOff color="#6b7280" size={20} />
                            ) : (
                              <Eye color="#6b7280" size={20} />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Reset Password Button */}
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={handleResetPassword}
                        disabled={isResettingPassword}
                      >
                        <LinearGradient
                          colors={['#667eea', '#764ba2']}
                          style={styles.modalButtonGradient}
                        >
                          {isResettingPassword ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text style={styles.modalButtonText}>Reset Password</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Back Button */}
                      <TouchableOpacity
                        onPress={() => setForgotPasswordStep(1)}
                        style={styles.backButton}
                      >
                        <Text style={styles.backButtonText}>← Back to Phone Number</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Error/Success Messages */}
                  {(resetError || resetSuccess) && (
                    <View style={[
                      styles.modalMessageBanner,
                      resetError ? styles.errorBanner : styles.successBanner
                    ]}>
                      <View style={styles.messageIconContainer}>
                        {resetError ? (
                          <AlertCircle color="#ef4444" size={22} strokeWidth={2.5} />
                        ) : (
                          <CheckCircle color="#10b981" size={22} strokeWidth={2.5} />
                        )}
                      </View>
                      <Text style={[
                        styles.modalMessageText,
                        resetError ? styles.errorText : styles.successText
                      ]}>
                        {resetError || resetSuccess}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    marginRight: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  countryCode: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '700',
  },
  inputIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  validationText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 16,
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
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  messageIcon: {
    marginRight: 12,
  },
  messageIconContainer: {
    marginTop: 2,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  successText: {
    color: '#065f46',
  },
  errorText: {
    color: '#991b1b',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalKeyboardView: {
    width: '100%',
    maxWidth: 480,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  modalContent: {
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  modalTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalBody: {
    paddingTop: 8,
    paddingBottom: 0,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
    textAlign: 'left',
  },
  modalInputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalButtonGradient: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  backButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  backButtonText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  modalMessageBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 8,
    borderWidth: 1,
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
  modalMessageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
    lineHeight: 20,
  },
  modalInput: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
  modalInputWrapper: {
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
});