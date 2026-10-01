import type { CapacitorConfig } from '@capacitor/cli'

// IMPORTANT: change appId to your own reverse-domain id BEFORE creating store listings.
// It must match the bundle id / package name registered in App Store Connect, Google Play
// and the RevenueCat dashboard.
const config: CapacitorConfig = {
  appId: 'com.stemdetective.app',
  appName: 'STEM Detective',
  webDir: 'out',
  backgroundColor: '#F5F1E8',
  android: { allowMixedContent: false },
  server: { androidScheme: 'https' },
  plugins: {
    SplashScreen: { launchShowDuration: 0, backgroundColor: '#141B22' },
  },
}

export default config
