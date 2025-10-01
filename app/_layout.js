import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack ,Tabs} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DeliveryProvider } from "../providers/delivery-provider";
import { AuthProvider } from "../providers/auth-provider";
 
SplashScreen.preventAutoHideAsync();
 
const queryClient = new QueryClient();
 
function RootLayoutNav() {
  return (
   
   
<Tabs screenOptions={{     headerShown: false,                tabBarStyle: { display: 'none', }, }} >
      <Stack screenOptions={{ headerBackTitle: "Back" }} options={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false ,title:"home" }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="order/[orderId]" options={{
        title: "Order Details",
        headerStyle: { backgroundColor: "#1E40AF" },
        headerTintColor: "#fff",
        
      }} />
    </Stack>
    </Tabs>
  );
}
 
export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
 
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <DeliveryProvider>
            <RootLayoutNav />
          </DeliveryProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}