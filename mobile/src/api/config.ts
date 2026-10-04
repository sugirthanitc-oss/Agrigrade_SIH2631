import { Platform } from 'react-native';

// Public ngrok tunnel URL (if tunnel is active)
export const NGROK_PUBLIC_URL = 'https://shining-luxury-exporter.ngrok-free.dev';

// Local machine addresses:
// - Web / iOS / Desktop: http://localhost:8000
// - Android Emulator: http://10.0.2.2:8000
// - Physical LAN devices: http://10.153.139.84:8000
export const LOCAL_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

// Default to local host for locally hosted runs
let currentBackendUrl = LOCAL_HOST;

export const getBackendUrl = (): string => currentBackendUrl;

export const setBackendUrl = (url: string): void => {
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  currentBackendUrl = cleanUrl;
};
