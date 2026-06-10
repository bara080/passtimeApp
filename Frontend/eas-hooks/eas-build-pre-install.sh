#!/usr/bin/env bash
set -euo pipefail

# Copy Firebase config files from EAS secret file variables to the
# native locations expected by Gradle (Android) and Xcode (iOS).
# The env vars are injected by EAS as file paths on the build machine.

if [ -n "${GOOGLE_SERVICES_JSON:-}" ]; then
  echo "Copying google-services.json to android/app/"
  cp "$GOOGLE_SERVICES_JSON" android/app/google-services.json
else
  echo "WARNING: GOOGLE_SERVICES_JSON not set — Android Firebase config missing"
fi

if [ -n "${GOOGLE_SERVICE_INFO_PLIST:-}" ]; then
  echo "Copying GoogleService-Info.plist to ios/Passtime/"
  cp "$GOOGLE_SERVICE_INFO_PLIST" ios/Passtime/GoogleService-Info.plist
else
  echo "WARNING: GOOGLE_SERVICE_INFO_PLIST not set — iOS Firebase config missing"
fi
