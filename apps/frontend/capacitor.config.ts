import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.educationalgorithm.lms',
  appName: 'Education Algorithm',
  webDir: 'public',
  server: {
    url: 'https://educationalgorithm.com/dashboard',
    cleartext: false,
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0A0D14',
      showSpinner: true,
      spinnerColor: '#6366F1'
    },
    StatusBar: {
      backgroundColor: '#0A0D14',
      style: 'DARK'
    }
  }
};

export default config;
