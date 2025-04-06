// Environment variables for client
export const env = {
  METAL_API_KEY: import.meta.env.VITE_METAL_API_KEY || '6888265e-48e6-56fb-95b9-759afc0bd1fe',
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || '',
  FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID || '',
};