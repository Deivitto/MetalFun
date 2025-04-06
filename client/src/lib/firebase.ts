import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  PhoneAuthProvider 
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase - check if app is already initialized
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Get Auth instance
const auth = getAuth(app);

/**
 * Initialize reCAPTCHA verifier
 * @param containerId - The ID of the container where reCAPTCHA will be rendered
 * @returns RecaptchaVerifier instance
 */
export function initializeRecaptcha(containerId: string) {
  try {
    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'normal',
      'callback': () => {
        console.log('reCAPTCHA solved');
        // reCAPTCHA solved, enable sign-in button
        const sendCodeButton = document.getElementById('send-code-button');
        if (sendCodeButton) {
          sendCodeButton.removeAttribute('disabled');
        }
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
        // Reset reCAPTCHA
        const sendCodeButton = document.getElementById('send-code-button');
        if (sendCodeButton) {
          sendCodeButton.setAttribute('disabled', 'true');
        }
      }
    });
    
    return recaptchaVerifier;
  } catch (error) {
    console.error('Error creating RecaptchaVerifier:', error);
    throw error;
  }
}

/**
 * Send verification code to phone number
 * @param phoneNumber - Phone number with country code (e.g. +1234567890)
 * @param recaptchaVerifier - RecaptchaVerifier instance
 * @returns Promise that resolves with confirmation result
 */
export async function sendVerificationCode(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return { success: true, confirmationResult };
  } catch (error) {
    console.error("Error sending verification code:", error);
    return { success: false, error };
  }
}

/**
 * Verify phone number with code
 * @param confirmationResult - Confirmation result from sendVerificationCode
 * @param verificationCode - Code received via SMS
 * @returns Promise that resolves with verification result
 */
export async function verifyPhoneNumber(confirmationResult: any, verificationCode: string) {
  try {
    const result = await confirmationResult.confirm(verificationCode);
    return { success: true, user: result.user };
  } catch (error) {
    console.error("Error verifying code:", error);
    return { success: false, error };
  }
}

export { auth };