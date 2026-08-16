"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/**
 * True only after the client has hydrated. Use to defer rendering of
 * client-only state (e.g. resolved theme) that would otherwise mismatch
 * the server-rendered markup.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
