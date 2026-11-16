import { useSyncExternalStore } from "react";
import { getStoredToken } from "../services/apiClient";
import { getSessionKey, isM1Auth, SESSION_EVENT } from "../services/authSession";

function subscribe(onChange) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SESSION_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SESSION_EVENT, onChange);
  };
}

// Renewal keeps the same view identity, so a refresh does not discard forms.
export function getCurrentSessionKey() { return isM1Auth ? getSessionKey() : getStoredToken(); }
export function useSessionToken() {
  return useSyncExternalStore(subscribe, getCurrentSessionKey);
}
