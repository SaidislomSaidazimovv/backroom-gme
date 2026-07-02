import { useSyncExternalStore } from "react";
import { settings } from "../engine/settings.js";

/**
 * Subscribe a component to the shared settings store. Returns the current
 * settings object; write with `settings.set(patch)`.
 */
export function useSettings() {
  return useSyncExternalStore(settings.subscribe, settings.get, settings.get);
}
