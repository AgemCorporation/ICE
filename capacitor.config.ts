import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mecatech.icemobileapp',
  appName: 'ICE Mobile',
  webDir: 'dist',
  android: {
    allowMixedContent: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
