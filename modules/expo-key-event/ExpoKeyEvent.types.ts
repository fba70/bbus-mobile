export type KeyPressEvent = {
  key: string;
};

export type ExpoKeyEventModuleEvents = {
  onKeyPress: (event: KeyPressEvent) => void;
};
