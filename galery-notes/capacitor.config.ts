import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'galery-notes',
  webDir: 'www',
  plugins: {
    Camera: {
      // Puedes agregar configuraciones específicas aquí si es necesario
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert", ],
      
    },
    FCM: {
      enabled: true
    }
  },
};

export default config;
