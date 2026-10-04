import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './src/context/LanguageContext';
import { AssessmentProvider } from './src/context/AssessmentContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AssessmentProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </AssessmentProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
