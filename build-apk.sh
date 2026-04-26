#!/bin/bash

# CAF Pharmacy APK Build Script
# This script automates the APK build process

echo "========================================"
echo "  CAF Pharmacy APK Builder"
echo "========================================"
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the frontend directory"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "Please edit .env file with your production API URL before continuing!"
    echo "Press any key to continue after editing .env..."
    read -n 1 -s
fi

# Check if keystore.properties exists
if [ ! -f "android/keystore.properties" ]; then
    echo "Error: android/keystore.properties not found!"
    echo "Please follow these steps:"
    echo "1. Generate keystore: keytool -genkeypair -v -keystore release-key.jks -alias caf_release -keyalg RSA -keysize 2048 -validity 10000"
    echo "2. Copy android/keystore.properties.example to android/keystore.properties"
    echo "3. Edit android/keystore.properties with your keystore details"
    exit 1
fi

# Check ANDROID_HOME
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo "Warning: ANDROID_HOME or ANDROID_SDK_ROOT not set!"
    echo "Please set it to your Android SDK location, e.g.:"
    echo 'export ANDROID_HOME="$HOME/Android/Sdk"'
    echo ""
    echo "Do you want to continue anyway? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        exit 1
    fi
fi

echo "Step 1: Installing dependencies..."
pnpm install
if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies"
    exit 1
fi

echo ""
echo "Step 2: Building React app..."
pnpm run build
if [ $? -ne 0 ]; then
    echo "Error: Failed to build React app"
    exit 1
fi

echo ""
echo "Step 3: Syncing with Capacitor..."
pnpm exec cap sync android
if [ $? -ne 0 ]; then
    echo "Error: Failed to sync with Capacitor"
    exit 1
fi

echo ""
echo "Step 4: Building signed APK..."
./android/gradlew -p android assembleRelease
if [ $? -ne 0 ]; then
    echo "Error: Failed to build APK"
    exit 1
fi

echo ""
echo "========================================"
echo "  BUILD SUCCESSFUL!"
echo "========================================"
echo ""
echo "Your APK is ready at:"
echo "android/app/build/outputs/apk/release/app-release.apk"
echo ""

# Get APK size
apkPath="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$apkPath" ]; then
    apkSize=$(du -h "$apkPath" | cut -f1)
    echo "APK Size: $apkSize"
fi

echo ""
echo "Next steps:"
echo "1. Copy the APK to your Android device"
echo "2. Install it (you may need to allow installation from unknown sources)"
echo "3. Test all features with your production backend"
echo ""
echo "Or install via ADB:"
echo "adb install $apkPath"
echo ""
