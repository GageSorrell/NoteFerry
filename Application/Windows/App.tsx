
import {
    SafeAreaProvider,
    useSafeAreaInsets
} from "react-native-safe-area-context";
import { StatusBar, StyleSheet, View, useColorScheme } from "react-native";
import { NewAppScreen } from "@react-native/new-app-screen";
import React from "react";

function App()
{
    const isDarkMode = useColorScheme() === "dark";

    return (
        <SafeAreaProvider>
            <StatusBar barStyle={ isDarkMode ? "light-content" : "dark-content" } />
            <AppContent />
        </SafeAreaProvider>
    );
}

function AppContent()
{
    const safeAreaInsets = useSafeAreaInsets();

    const templateFileName = "App.tsx";

    return (
        <View style={ styles.container }>
            <NewAppScreen  { ...{ safeAreaInsets, templateFileName } } />
        </View>
    );
}

const styles = StyleSheet.create({
    container:
    {
        flex: 1
    }
});

export default App;
