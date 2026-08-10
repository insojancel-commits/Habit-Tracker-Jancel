import React, { useEffect } from 'react';

/* A single toast at a time is enough for this app — deletes and background
   sync errors are the only things that trigger one. `toast` shape:
   { message, actionLabel?, onAction?, tone? } where tone is 'default' | 'error'. */
export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onDismiss, toast.tone === 'error' ? 6000 : 5000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className={`db-toast${toast.tone === 'error' ? ' db-toast-error' : ''}`}>
      <span>{toast.message}</span>
      {toast.actionLabel && (
        <button
          className="db-toast-action"
          onClick={() => {
            toast.onAction?.();
            onDismiss();
          }}
        >
          {toast.actionLabel}
        </button>
      )}
      <button className="db-toast-close" onClick={onDismiss} aria-label="Dismiss">×</button>
    </div>
  );
}
