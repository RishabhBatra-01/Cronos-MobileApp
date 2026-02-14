#!/bin/bash

echo "🚀 Installing RevenueCat SDK for Cronos App"
echo "==========================================="
echo ""

# Install RevenueCat
echo "📦 Installing react-native-purchases..."
npx expo install react-native-purchases

echo ""
echo "✅ RevenueCat SDK installed successfully!"
echo ""
echo "📝 Next Steps:"
echo "1. Add your RevenueCat API keys to core/constants.ts"
echo "2. Follow REVENUECAT_INTEGRATION_STEPS.md for code changes"
echo "3. Rebuild native apps:"
echo "   - iOS: npx expo run:ios"
echo "   - Android: ./run-android.sh"
echo ""
echo "📚 Documentation:"
echo "   - MONETIZATION_SUMMARY.md - Quick overview"
echo "   - REVENUECAT_IMPLEMENTATION_GUIDE.md - Complete setup"
echo "   - REVENUECAT_INTEGRATION_STEPS.md - Code integration"
echo ""
echo "💰 Ready to monetize! 🎉"
