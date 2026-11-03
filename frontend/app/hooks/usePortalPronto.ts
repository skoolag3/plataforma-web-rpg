"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function usePortalPronto() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
