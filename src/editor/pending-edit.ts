import { useEffect, useRef } from "react";

// Unconfirmed property forms belong to the UI, not the project/history/store.
const pendingEditors = new Set<symbol>();
export function usePendingEditorEdit(pending: boolean) {
  const token = useRef(Symbol());
  useEffect(() => {
    const id = token.current;
    if (pending) pendingEditors.add(id);
    else pendingEditors.delete(id);
    return () => {
      pendingEditors.delete(id);
    };
  }, [pending]);
}
export const hasPendingEditorEdits = () => pendingEditors.size > 0;
