import { KeyCodeMapping } from "../constants/KeyCodeMapping";

export const debounce = (func: Function, wait: number, immediate: boolean = false) => {
  let timeout: number | undefined;

  return function executedFunction(this: any) {
    const context: any = this;
    let args = arguments;

    let later = function () {
      timeout = undefined;
      if (!immediate) func.apply(context, args);
    };

    let callNow = immediate && !timeout;

    clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
};

export function unifyKeyCode(keyCode: string): string {
  const res = KeyCodeMapping?.[keyCode];
  if (__DEV__ && !res) {
    console.warn(`No mapping found for keyCode: ${keyCode}`);
  }
  return res ?? keyCode;
}