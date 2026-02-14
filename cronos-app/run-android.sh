#!/bin/bash

# Set Java 17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# Set Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk

# Run Android build
npx expo run:android
