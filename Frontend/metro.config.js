const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// @tanstack/query-core v5 exports only its "modern" build which uses private
// class fields (#field syntax). The Hermes engine in the dev client doesn't
// support it without Babel transformation. Disabling package exports makes
// Metro fall back to the `main` field which points to the legacy CJS build.
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./global.css" });
