import { useEvent } from "expo";
import { useEffect, useMemo } from "react";
import { DevSettings } from "react-native";

import ExpoKeyEventModule from "../ExpoKeyEventModule";
import { unifyKeyCode } from "../utils/unifyKeyCode";

/**
 *
 * @param listenOnMount Pass 'false' to prevent automatic key event listening
 * - Use startListening/stopListening to control the listener manually
 * @param preventReload Prevent reloading the app when pressing 'r'
 * @returns
 *
 */
export function useKeyEvent(listenOnMount = true, preventReload = false) {
  const event = useEvent(ExpoKeyEventModule, "onKeyPress");

  useEffect(() => {
    if (listenOnMount) ExpoKeyEventModule.startListening();

    return () => {
      ExpoKeyEventModule.stopListening();
    };
  }, [listenOnMount]);

  const keyEvent = useMemo(() => {
    if (!event) return null;
    const uniKey = unifyKeyCode(event.key);
    if (!preventReload && __DEV__ && uniKey === "KeyR") DevSettings.reload();
    return {
      key: uniKey,
    };
  }, [event]);

  return {
    /**
     * Start listening for key events
     */
    startListening: ExpoKeyEventModule.startListening,
    /**
     * Stop listening for key events
     */
    stopListening: ExpoKeyEventModule.stopListening,
    keyEvent,
  };
}
