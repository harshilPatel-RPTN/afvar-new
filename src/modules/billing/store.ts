import { create } from "zustand";
import type { Feature } from "./entitlements";
import type { BillingInterval } from "./prices";

export type UpgradeReason = Feature | "generic";

interface BillingUiState {
  upgradeReason: UpgradeReason | null;
  checkoutInterval: BillingInterval | null;
  openUpgrade: (reason?: UpgradeReason) => void;
  closeUpgrade: () => void;
  openCheckout: (interval?: BillingInterval) => void;
  closeCheckout: () => void;
}

/** Which billing overlay is open. One upgrade modal and one checkout serve the whole app. */
export const useBillingStore = create<BillingUiState>((set) => ({
  upgradeReason: null,
  checkoutInterval: null,
  openUpgrade: (reason = "generic") => set({ upgradeReason: reason }),
  closeUpgrade: () => set({ upgradeReason: null }),
  openCheckout: (interval = "monthly") => set({ upgradeReason: null, checkoutInterval: interval }),
  closeCheckout: () => set({ checkoutInterval: null }),
}));
