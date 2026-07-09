module.exports = {
  expo: {
    name: "Passtime",
    slug: "passtime-app",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/app-icon.png",
    scheme: "passtime",
    platforms: ["ios", "android"],
    runtimeVersion: "1.0.0",
    updates: {
      url: "https://u.expo.dev/0672d58c-18b5-4f30-8bc9-98fe8d2b9b23",
    },
    userInterfaceStyle: "automatic",
    // TODO: re-enable once react-native-svg fully supports New Architecture on Android (topSvgLayout error)
    newArchEnabled: false,

    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },

    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.passtime.app",
      googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST ?? "./GoogleService-Info.plist",
    },

    android: {
      package: "tech.clickbuild.passtime",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon-foreground.png",
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
      [
        "@sentry/react-native/expo",
        {
          url: "https://sentry.io/",
          organization: "clickbuild-tech",
          project: "passtime-mobile",
        },
      ],
      "@logrocket/react-native",
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