import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mecatech.iceapp',
  appName: 'ICE Mobile',
  webDir: 'dist',
  android: {
    allowMixedContent: true
  },
  server: {
    // ⚠️ DEVELOPMENT ONLY — Commenter ce bloc avant le build de production mobile.
    // En production, l'app utilise les assets embarqués dans le bundle natif.
    url: 'http://192.168.1.75:3000',
    cleartext: true,
    allowNavigation: ['192.168.1.75']
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
