"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface FeatureFocusValue {
  /** Index into capability.features currently shown in the preview window. */
  selected: number;
  /** True once the visitor picked a feature; autoplay stops for the rest of the visit. */
  pinned: boolean;
  select: (index: number, byUser: boolean) => void;
}

const FeatureFocusContext = createContext<FeatureFocusValue | null>(null);

/** Shares the previewed feature between the capability preview and the feature grid. */
export function FeatureFocusProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState(0);
  const [pinned, setPinned] = useState(false);
  const select = (index: number, byUser: boolean) => {
    setSelected(index);
    if (byUser) setPinned(true);
  };
  return <FeatureFocusContext.Provider value={{ selected, pinned, select }}>{children}</FeatureFocusContext.Provider>;
}

/** Context when inside a capability page; otherwise local state (overview tour). */
export function useFeatureFocus(): FeatureFocusValue {
  const shared = useContext(FeatureFocusContext);
  const [selected, setSelected] = useState(0);
  const [pinned, setPinned] = useState(false);
  if (shared) return shared;
  return {
    selected,
    pinned,
    select: (index, byUser) => {
      setSelected(index);
      if (byUser) setPinned(true);
    },
  };
}

export const PREVIEW_ANCHOR = "capability-preview";
