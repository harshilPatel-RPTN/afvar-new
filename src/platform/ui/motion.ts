// Motion presets from DESIGN-GUIDE §10. The repo ships framer-motion, which
// exposes the same API as the `motion` package named in the guide.
import type { Transition, Variants } from "framer-motion";

export const motionTokens = {
  duration: { instant: 0.08, fast: 0.14, normal: 0.2, panel: 0.24, modal: 0.28, section: 0.45 },
  ease: {
    standard: [0.2, 0, 0, 1] as const,
    enter: [0.16, 1, 0.3, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
  },
};

export const indicatorSpring: Transition = { type: "spring", stiffness: 420, damping: 36, mass: 0.75 };

export const variants = {
  /** One-time viewport reveal for sections. */
  reveal: {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.26, ease: motionTokens.ease.enter } },
  },
  list: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
  },
  listItem: {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: motionTokens.ease.enter } },
  },
  dialog: {
    hidden: { opacity: 0, y: 8, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: motionTokens.ease.enter } },
    exit: { opacity: 0, y: 4, scale: 0.99, transition: { duration: 0.14, ease: motionTokens.ease.exit } },
  },
  menu: {
    hidden: { opacity: 0, y: -4 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.16, ease: motionTokens.ease.enter } },
    exit: { opacity: 0, y: -4, transition: { duration: 0.12, ease: motionTokens.ease.exit } },
  },
  crossfade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.16 } },
    exit: { opacity: 0, transition: { duration: 0.12 } },
  },
} satisfies Record<string, Variants>;
