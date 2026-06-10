module.exports = {
  expo: {
    name: "Passtime",
    slug: "passtime-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/PasstimeIconMixed.jpg",
    scheme: "passtime",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },

    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.passtime.app",
      googleServicesFile: "./GoogleService-Info.plist",
    },

    android: {
      package: "com.passtime.app",
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/favicon.png",
    },

    plugins: [
      "expo-router",
      "expo-secure-store",
      ["@react-native-firebase/app", {}],
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            forceStaticLinking: [
              "RNFBApp",
              "RNFBAuth",
              "RNFBDatabase",
              "RNFBStorage",
            ],
            deploymentTarget: "15.1",
          },
          android: {
            minSdkVersion: 25,
          },
        },
      ],
      [
        "@stripe/stripe-react-native",
        {
          merchantIdentifier: "merchant.com.passtime.app",
          enableGooglePay: true,
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      router: {},
      eas: {
        projectId: "0672d58c-18b5-4f30-8bc9-98fe8d2b9b23",
      },
    },

    owner: "zinga-deployme",
  },
};