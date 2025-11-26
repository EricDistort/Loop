import React from 'react';
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
import Onboarding from './screens/Onboarding';
import LoginScreen from './screens/LoginScreen';
import StoreScreen from './screens/Store/StoreScreen';
import BannerDetailsScreen from './screens/Store/BannerDetailsScreen';
import CartScreen from './screens/Store/CartScreen';
import ProfileScreen from './screens/Profile/ProfileScreen';
import UserOrdersScreen from './screens/Order/OrderScreen';
import ProductDetails from './screens/Store/ProductDetails';
import FullCatalog from './screens/Store/FullCatalog';
import OrderDetailScreen from './screens/Order/OrderDetailesScreen';
import Explore from './screens/Store/Explore';

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
      {/* Add more Profile-related screens here later */}
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
          tabBarStyle: {
            position: 'absolute',
            bottom: vs(16),
            left: 0,
            right: 0,
            height: vs(65),
            backgroundColor: 'rgba(0, 0, 0, 1)',
            borderRadius: ms(35),

            borderTopWidth: 0,
            overflow: 'hidden',
            //elevation: 5,
            marginHorizontal: '5%',
            paddingBottom: vs(10),
            paddingTop: vs(10),
          },
          tabBarBackground: () => (
            <LinearGradient
              colors={['#340052ff', '#960096ff']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={{
                flex: 1,
                borderRadius: ms(35),
                padding: ms(2),
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0)',
                  borderRadius: ms(35),
                }}
              />
            </LinearGradient>
          ),
          tabBarActiveTintColor: '#ffffffff',
          tabBarInactiveTintColor: '#ffffff77',
        }}
      >
        <Tab.Screen
          name="Store"
          component={StoreStackScreen}
          options={{
            tabBarIcon: ({ focused }) => {
              const size = focused ? s(29) : s(24);
              return (
                <Image
                  source={require('./screens/tabMedia/Store.webp')}
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
            tabBarIcon: ({ focused }) => {
              const size = focused ? s(29) : s(24);
              return (
                <Image
                  source={require('./screens/tabMedia/Profile.webp')}
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
            tabBarIcon: ({ focused }) => {
              const size = focused ? s(29) : s(24);
              return (
                <Image
                  source={require('./screens/tabMedia/Order.webp')}
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
  return (
    <UserProvider>
      <StatusBar hidden={true} />
      <NavigationContainer>
        <RootStack.Navigator
          initialRouteName="Onboarding"
          screenOptions={{ headerShown: false }}
        >
          <RootStack.Screen name="Main" component={MainTabs} />
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Explore" component={Explore} />
          <RootStack.Screen name="Onboarding" component={Onboarding} />
        </RootStack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
