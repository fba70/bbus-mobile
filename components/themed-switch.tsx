import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { Switch, type SwitchProps } from 'react-native';

export type ThemedSwitchProps = SwitchProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedSwitch({
  style,
  lightColor,
  darkColor,
  ...rest
}: ThemedSwitchProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Switch
      thumbColor={color}
      style={[
        style,
      ]}
      {...rest}
    />
  );
}