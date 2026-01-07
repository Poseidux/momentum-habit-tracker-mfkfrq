
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useColorScheme,
} from 'react-native';
import { useRouter, usePathname, Href } from 'expo-router';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

interface TabBarItem {
  name: string;
  title: string;
  ios_icon: string;
  android_icon: any;
  route: Href;
}

interface FloatingTabBarProps {
  tabs?: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = 90,
  borderRadius = 24,
  bottomMargin = 20,
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const defaultTabs: TabBarItem[] = [
    {
      name: '(home)',
      title: 'Today',
      ios_icon: 'house.fill',
      android_icon: 'home',
      route: '/(tabs)/(home)' as Href,
    },
    {
      name: 'progress',
      title: 'Progress',
      ios_icon: 'chart.bar.fill',
      android_icon: 'bar-chart',
      route: '/(tabs)/progress' as Href,
    },
    {
      name: 'settings',
      title: 'Settings',
      ios_icon: 'gearshape.fill',
      android_icon: 'settings',
      route: '/(tabs)/settings' as Href,
    },
  ];

  const tabItems = tabs || defaultTabs;
  const activeIndex = useSharedValue(0);

  // Determine active tab
  const currentIndex = tabItems.findIndex(tab => {
    if (tab.name === '(home)') {
      return pathname.includes('/(tabs)/(home)') || pathname === '/(tabs)';
    }
    return pathname.includes(`/(tabs)/${tab.name}`);
  });

  if (currentIndex !== -1 && currentIndex !== activeIndex.value) {
    activeIndex.value = currentIndex;
  }

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(activeIndex.value * (containerWidth / tabItems.length), {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
    };
  });

  function handleTabPress(route: Href) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={[styles.container, { marginBottom: bottomMargin }]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 100}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={[
            styles.tabBar,
            {
              borderRadius,
              backgroundColor: Platform.OS === 'ios' 
                ? 'transparent' 
                : colorScheme === 'dark' 
                  ? 'rgba(31, 31, 31, 0.95)' 
                  : 'rgba(255, 255, 255, 0.95)',
              borderColor: theme.border,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.indicator,
              {
                width: `${100 / tabItems.length}%`,
                backgroundColor: theme.primary + '20',
                borderRadius: borderRadius - 4,
              },
              indicatorStyle,
            ]}
          />
          {tabItems.map((tab, index) => {
            const isActive = currentIndex === index;

            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => handleTabPress(tab.route)}
                style={styles.tab}
              >
                <IconSymbol
                  ios_icon_name={tab.ios_icon}
                  android_material_icon_name={tab.android_icon}
                  size={24}
                  color={isActive ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? theme.primary : theme.textSecondary,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                >
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    paddingHorizontal: 20,
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  indicator: {
    position: 'absolute',
    height: '80%',
    top: '10%',
    left: 0,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
  },
});
