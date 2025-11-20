import { KeyCodeMapping } from "../constants/KeyCodeMapping";

export function unifyKeyCode(keyCode: string): string {
  const res = KeyCodeMapping?.[keyCode];
  if (__DEV__ && !res) {
    console.warn(`No mapping found for keyCode: ${keyCode}`);
  }
  return res ?? keyCode;
}
