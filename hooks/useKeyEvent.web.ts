import { useCallback, useEffect, useState } from "react";

import { KeyPressEvent } from "@/modules/expo-key-event/ExpoKeyEvent.types";

/**
 *
 * @param listenOnMount Pass 'false' to prevent automatic key event listening
 * - Use startListening/stopListening to control the listener manually
 * @returns
 *
 */
export function useKeyEvent(listenOnMount = true) {
  const [keyEvent, setKeyEvent] = useState<KeyPressEvent | null>(null);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    setKeyEvent({ key: event.code });
  }, []);

  const startListening = useCallback(
    () => addEventListener("keydown", onKeyDown),
    [onKeyDown],
  );

  const stopListening = useCallback(
    () => removeEventListener("keydown", onKeyDown),
    [onKeyDown],
  );

  useEffect(() => {
    if (listenOnMount) startListening();
    return () => {
      stopListening();
    };
  }, [listenOnMount, startListening, stopListening]);

  return {
    /**
     * Start listening for key events
     */
    startListening,
    /**
     * Stop listening for key events
     */
    stopListening,
    keyEvent,
  };
}
