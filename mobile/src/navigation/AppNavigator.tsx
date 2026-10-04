import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

// Screens
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { NewAssessmentScreen } from '../screens/NewAssessmentScreen';
import { ImageCaptureScreen } from '../screens/ImageCaptureScreen';
import { ProcessingScreen } from '../screens/ProcessingScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { ReportScreen } from '../screens/ReportScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { AssessmentDetailsScreen } from '../screens/AssessmentDetailsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="NewAssessment" component={NewAssessmentScreen} />
        <Stack.Screen name="ImageCapture" component={ImageCaptureScreen} />
        <Stack.Screen name="AIProcessing" component={ProcessingScreen} />
        <Stack.Screen name="QualityResults" component={ResultsScreen} />
        <Stack.Screen name="DigitalReport" component={ReportScreen} />
        <Stack.Screen name="AssessmentHistory" component={HistoryScreen} />
        <Stack.Screen name="AssessmentDetails" component={AssessmentDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
