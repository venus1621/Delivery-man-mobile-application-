import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { logger } from './logger';

/**
 * Check if notification sounds are enabled
 * @returns {Promise<boolean>} True if sounds are enabled, false otherwise
 */
export const isNotificationSoundEnabled = async () => {
  try {
    const soundEnabled = await AsyncStorage.getItem('notificationSoundEnabled');
    // Default to true if not set
    return soundEnabled === null || soundEnabled === 'true';
  } catch (error) {
    console.error('Error checking notification sound settings:', error);
    return true; // Default to enabled on error
  }
};

/**
 * Play a notification sound if enabled
 * @param {string} soundFile - Path to the sound file
 */
export const playNotificationSound = async (soundFile = null) => {
  try {
    const isEnabled = await isNotificationSoundEnabled();
    
    if (!isEnabled) {
      logger.log('🔕 Notification sound is muted by user settings');
      return;
    }

    // Play default notification sound or custom sound
    // For now, we'll use the system notification sound
    logger.log('🔔 Playing notification sound...');
    
    // You can implement actual sound playing logic here
    // For example, using expo-av:
    // const { sound } = await Audio.Sound.createAsync(
    //   require('../assets/sounds/notification.mp3')
    // );
    // await sound.playAsync();
    
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

/**
 * Update notification sound preference
 * @param {boolean} enabled - Whether sounds should be enabled
 */
export const setNotificationSoundEnabled = async (enabled) => {
  try {
    await AsyncStorage.setItem('notificationSoundEnabled', enabled.toString());
    logger.log(`🔔 Notification sounds ${enabled ? 'enabled' : 'muted'}`);
  } catch (error) {
    console.error('Error setting notification sound preference:', error);
  }
};

