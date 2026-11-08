import { useSyncExternalStore } from "react";
import { getStoredToken } from "../services/apiClient";

function subscribe(onChange) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

// Read the existing token without changing its storage or authentication flow.
export function useSessionToken() {
  return useSyncExternalStore(subscribe, getStoredToken);
}
