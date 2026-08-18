import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.canteenhub.app',
  appName: 'CanteenHub',
  webDir: 'dist',
  server: {
    url: 'https://canteen-connecthub.vercel.app',
    cleartext: true
  }
};

export default config;
