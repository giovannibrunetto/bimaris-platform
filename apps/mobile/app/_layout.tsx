import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { theme } from "@/src/theme";

export default function RootLayout() {
  return <><StatusBar style="light" /><Stack screenOptions={{ headerStyle:{backgroundColor:theme.navy}, headerTintColor:theme.white, contentStyle:{backgroundColor:"#fbfbfa"} }}><Stack.Screen name="index" options={{headerShown:false}}/><Stack.Screen name="experiences" options={{title:"Esperienze"}}/></Stack></>;
}
