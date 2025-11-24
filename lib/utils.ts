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

export function vehicleNumberTranslate(text: string) {
  const transl: any = {};
  transl['А'] = 'A';
  transl['В'] = 'B';
  transl['Е'] = 'E';
  transl['К'] = 'K';
  transl['М'] = 'M';
  transl['Н'] = 'H';
  transl['О'] = 'O';
  transl['Р'] = 'P';
  transl['С'] = 'C';
  transl['Т'] = 'T';
  transl['У'] = 'Y';
  transl['Х'] = 'X';

  let result: string = '';
  for (let i = 0; i < text.length; i++) {
    if (transl[text[i]] !== undefined) {
      result += transl[text[i]];
    } else {
      result += text[i];
    }
  }
  return result;
}