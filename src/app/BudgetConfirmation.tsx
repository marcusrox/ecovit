import { createContext, useContext } from "react";

// Only confirmations already triggered by normal field events are awaited.
// Export never confirms unrelated drafts or waits for remote persistence.
export const BudgetConfirmationContext = createContext<
  (confirmation: Promise<void>) => void
>(() => {});

export function useBudgetConfirmation() {
  return useContext(BudgetConfirmationContext);
}
