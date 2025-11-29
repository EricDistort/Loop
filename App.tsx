import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, Image, View } from 'react-native';
import {
  scale as s,
  verticalScale as vs,
  moderateScale as ms,
} from 'react-native-size-matters';
import { UserProvider } from './utils/UserContext';
import LinearGradient from 'react-native-linear-gradient';

// Screens
import SplashScreen from './SplashScreen'; // Adjust path if needed
import Onboarding from './screens/Onboarding';
import LoginScreen from './screens/LoginScreen';
import StoreScreen from './screens/Store/StoreScreen';
import BannerDetailsScreen from './screens/Store/BannerDetailsScreen';
import CartScreen from './screens/Store/CartScreen';
import ProfileScreen from './screens/Profile/ProfileScreen';
import ProfileEditScreen from './screens/Profile/ProfileEditScreen';
import UserOrdersScreen from './screens/Order/OrderScreen';
import ProductDetails from './screens/Store/ProductDetails';
import FullCatalog from './screens/Store/FullCatalog';
import OrderDetailScreen from './screens/Order/OrderDetailesScreen';
import Explore from './screens/Store/Explore';
import Help from './screens/Store/Help';

const RootStack = createNativeStackNavigator();
const StoreStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const OrderStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function StoreStackScreen() {
  return (
    <StoreStack.Navigator screenOptions={{ headerShown: false }}>
      <StoreStack.Screen name="StoreMain" component={StoreScreen} />
      <StoreStack.Screen
        name="BannerDetailsScreen"
        component={BannerDetailsScreen}
      />
      <StoreStack.Screen name="Cart" component={CartScreen} />
      <StoreStack.Screen name="ProductDetails" component={ProductDetails} />
      <StoreStack.Screen name="FullCatalog" component={FullCatalog} />
    </StoreStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    </ProfileStack.Navigator>
  );
}

function OrderStackScreen() {
  return (
    <OrderStack.Navigator screenOptions={{ headerShown: false }}>
      <OrderStack.Screen name="OrderMain" component={UserOrdersScreen} />
      <OrderStack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </OrderStack.Navigator>
  );
}

function MainTabs() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="Store"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: vs(16),
            left: 0,
            right: 0,
            height: vs(70),
            backgroundColor: 'transparent',
            borderRadius: ms(35),
            borderTopWidth: 0,
            overflow: 'hidden',
            marginHorizontal: '5%',
            paddingBottom: vs(5),
            paddingTop: vs(20),
            elevation: 5,
          },
          tabBarLabelStyle: {
            fontSize: ms(10),
            marginBottom: vs(2),
            fontWeight: '600',
          },
          tabBarBackground: () => (
            <LinearGradient
              colors={['#340052ff', '#770081ff']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={{
                flex: 1,
                borderRadius: ms(35),
              }}
            />
          ),
          tabBarActiveTintColor: '#ffffffff',
          tabBarInactiveTintColor: '#ffffff77',
        }}
      >
        <Tab.Screen
          name="Store"
          component={StoreStackScreen}
          options={{
            tabBarLabel: 'Store',
            tabBarIcon: ({ focused }) => {
              const size = focused ? s(35) : s(29);
              return (
                <Image
                  source={require('./screens/tabMedia/Store.webp')}
                  resizeMode="contain"
                  style={{
                    width: size,
                    height: size,
                    tintColor: '#ffffffff',
                    opacity: focused ? 1 : 0.5,
                  }}
                />
              );
            },
          }}
        />

        <Tab.Screen
          name="Orders"
          component={OrderStackScreen}
          options={{
            tabBarLabel: 'Orders',
            tabBarIcon: ({ focused }) => {
              const size = focused ? s(35) : s(29);
              return (
                <Image
                  source={require('./screens/tabMedia/Profile.webp')}
                  resizeMode="contain"
                  style={{
                    width: size,
                    height: size,
                    tintColor: '#ffffffff',
                    opacity: focused ? 1 : 0.5,
                  }}
                />
              );
            },
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStackScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ focused }) => {
              const size = focused ? s(35) : s(29);
              return (
                <Image
                  source={require('./screens/tabMedia/Order.webp')}
                  resizeMode="contain"
                  style={{
                    width: size,
                    height: size,
                    tintColor: '#ffffffff',
                    opacity: focused ? 1 : 0.5,
                  }}
                />
              );
            },
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // 1. Minimum animation time (5 seconds)
        const minimumWaitTask = new Promise(resolve =>
          setTimeout(resolve, 4250),
        );

        // 2. Actual Data Loading (API calls, Context setup, etc.)
        const loadDataTask = async () => {
          // Put your actual initialization logic here (e.g., waiting for UserProvider)
          // For now, we simulate a quick check
          return new Promise(resolve => setTimeout(resolve, 100));
        };

        // 3. Wait for BOTH
        await Promise.all([minimumWaitTask, loadDataTask()]);
      } catch (e) {
        console.warn(e);
      } finally {
        setIsAppReady(true);
      }
    };

    prepareApp();
  }, []);

  if (!isAppReady) {
    return <SplashScreen />;
  }

  return (
    <UserProvider>
      <StatusBar hidden={true} />
      <NavigationContainer>
        <RootStack.Navigator
          initialRouteName="Onboarding"
          screenOptions={{ headerShown: false }}
        >
          <RootStack.Screen name="Help" component={Help} />
          <RootStack.Screen name="Main" component={MainTabs} />
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Explore" component={Explore} />
          <RootStack.Screen name="Onboarding" component={Onboarding} />
        </RootStack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
