import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { TextInput, type TextInputProps } from 'react-native';

export type ThemedTextInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedTextInput({
  style,
  lightColor,
  darkColor,
  ...rest
}: ThemedTextInputProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <TextInput
      placeholderTextColor={color}
      style={[
        { color },
        {borderColor: "#D1D5DC", borderWidth: 1, padding: 10},
        style,
      ]}
      {...rest}
    />
  );
}