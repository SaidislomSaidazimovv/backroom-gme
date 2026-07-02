import { useEffect } from "react";
import { initBackrooms } from "../engine/backrooms-engine.js";

/**
 * Mounts the imperative Backrooms engine exactly once, after the DOM the engine
 * queries (by id) has been committed. Returns the engine's teardown on unmount.
 */
export function useBackroomsEngine() {
  useEffect(() => {
    const cleanup = initBackrooms();
    return cleanup;
  }, []);
}
