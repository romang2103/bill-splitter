import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ScanBill from "./components/ScanBill";

/**
 * @description Renders a React Native screen with a title.
 */
const HomeScreen = () => (
  <View style={styles.container}>
    <Text>My Bill Splitter App</Text>
  </View>
);

/**
 * @description Renders a React Native screen component displaying the text 'History'
 * within a styled container.
 */
const HistoryScreen = () => (
  <View style={styles.container}>
    <Text>History</Text>
  </View>
);

const Tab = createBottomTabNavigator();

/**
 * @description Renders a tab-based navigation interface with three screens: Home,
 * Scan Bill, and History. Each screen is associated with a custom icon, and the tab
 * bar's active and inactive colors are set to blue and gray, respectively.
 *
 * @returns {object} A JSX element representing a navigation container with a tab navigator.
 */
const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "blue",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: [
            {
              display: "flex",
            },
          ],
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            /**
             * @description Returns a React component that displays an Ionicons "home" icon. It
             * accepts two props: `color` and `size`, which are used to customize the icon's appearance.
             *
             * @param {object} obj - Defined as an object with two properties: `color` and `size`.
             *
             * @param {string | number} obj.color - Used to set the color of the Ionicons icon.
             *
             * @param {number} obj.size - Used to set the size of the Ionicons icon.
             */
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Scan Bill"
          component={ScanBill}
          options={{
            /**
             * @description Returns an `Ionicons` component, which is an icon from the Ionicons
             * library. It takes two props: `color` and `size`, which are passed from the parent
             * component to customize the icon's appearance.
             *
             * @param {object} obj -  destructured into two properties: `color` and `size`. It
             * represents the color and size attributes of the Ionicons icon to be displayed.
             *
             * @param {string} obj.color - Used to set the color of the Ionicons icon.
             *
             * @param {number} obj.size - Used to specify the size of the Ionicons icon.
             */
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            /**
             * @description Returns an Ionicons icon with customizable color and size. It takes
             * an object with `color` and `size` properties as an argument, passing these values
             * to the `color` and `size` props of the Ionicons icon.
             *
             * @param {object} obj -  destructured into two properties: `color` and `size`. Both
             * `color` and `size` are function parameters that accept values to customize the
             * appearance of the Ionicons icon.
             *
             * @param {string | number} obj.color - Used to specify the color of the Ionicons
             * icon displayed in the tab bar.
             *
             * @param {number} obj.size - Determining the size of the icon.
             */
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default App;
