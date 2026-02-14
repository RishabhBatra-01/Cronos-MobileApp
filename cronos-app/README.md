# Cronos - AI-Powered Productivity App

Cronos is a next-generation productivity application built with React Native and Expo, featuring advanced AI capabilities to help you manage tasks, research topics, and stay organized.

## 🚀 Features

- **AI Task Assistant**: Chat with your tasks to get advice, breakdowns, and creative ideas.
- **Voice Input**: Create tasks naturally using voice commands.
- **Smart Research**: Deep dive into topics with AI-powered research tools.
- **Sub-task Suggestions**: Automatically generate sub-tasks for complex projects.
- **Cross-Platform**: Seamless experience on both iOS and Android.
- **Cloud Sync**: Real-time synchronization across devices using Supabase.

## 🛠 Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Backend / DB**: Supabase
- **Payments**: RevenueCat
- **Styling**: NativeWind (TailwindCSS)
- **AI Integration**: OpenAI & Perplexity API

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or newer)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/client) app on your mobile device (iOS/Android)

## ⚙️ Configuration

**IMPORTANT: API Keys are NOT included in the repository for security.**

1.  **Duplicate the example environment file:**
    ```bash
    cp .env.example .env
    ```

2.  **Edit the `.env` file** and add your API keys:
    ```env
    # OpenAI (for Voice & Chat)
    EXPO_PUBLIC_OPENAI_API_KEY=sk-...

    # Perplexity (for Research)
    EXPO_PUBLIC_PERPLEXITY_API_KEY=pplx-...

    # Supabase (for Auth & Database)
    EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

    # RevenueCat (for Subscriptions)
    EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_...
    EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_...
    ```

3.  **Note:** The `.env` file is added to `.gitignore`, so your keys will remain private safe locally.

## 🏃‍♂️ Running the App

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start the Development Server:**
    ```bash
    npx expo start
    ```

3.  **Run on Device:**
    - Scan the QR code with the **Expo Go** app (Android) or **Camera** app (iOS).
    - Or press `i` to run on iOS Simulator.
    - Or press `a` to run on Android Emulator.

## 🏗 Project Structure

- `/app`: Expo Router screens and layouts.
- `/components`: Reusable UI components.
- `/core`: Core logic, constants, and store configuration.
- `/services`: API services (OpenAI, Perplexity, Sync).
- `/assets`: Images and fonts.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

---
Built with ❤️ by [Rishabh Batra](https://github.com/RishabhBatra-01)
