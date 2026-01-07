
import React from 'react';
import { Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface IconSymbolProps {
  ios_icon_name: string;
  android_material_icon_name: keyof typeof MaterialIcons.glyphMap;
  size?: number;
  color: string;
  style?: any;
}

export function IconSymbol({
  ios_icon_name,
  android_material_icon_name,
  size = 24,
  color,
  style,
}: IconSymbolProps) {
  if (Platform.OS === 'android' || Platform.OS === 'web') {
    return (
      <MaterialIcons
        name={android_material_icon_name}
        size={size}
        color={color}
        style={style}
      />
    );
  }
  
  // iOS will use the .ios.tsx version
  return null;
}
