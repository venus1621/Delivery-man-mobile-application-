import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { FIREBASE_CONFIG } from './config';

// Firebase configuration is now embedded directly in the code
// See config.js for all environment variables
const firebaseConfig = FIREBASE_CONFIG;

console.log('✅ Firebase configuration loaded from embedded config');

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

export default app;