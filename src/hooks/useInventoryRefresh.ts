// src/hooks/useInventoryRefresh.ts
import { useEffect } from "react";
import { useProductStore } from "../store/productStore";

interface UseInventoryRefreshOptions {
  enabled?: boolean; // გააქტიურებული თუ არა
  interval?: number; // რამდენ მილისეკუნდში (default: 45 წამი)
}

/**
 * Hook for real-time inventory checking
 * გამოიყენება პროდუქტების გვერდებზე და checkout-ზე
 */
export const useInventoryRefresh = (options: UseInventoryRefreshOptions = {}) => {
  const { enabled = true, interval = 45000 } = options; // 45 წამი default
  const { refreshInventory } = useProductStore();

  useEffect(() => {
    if (!enabled) return;

    // პირველი გაშვება 5 წამის შემდეგ (რომ page load-ის შემდეგ)
    const initialTimer = setTimeout(() => {
      refreshInventory();
    }, 5000);

    // შემდეგ ყოველ 45 წამში
    const intervalTimer = setInterval(() => {
      refreshInventory();
    }, interval);

    // Cleanup
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [enabled, interval, refreshInventory]);
};