'use client';

import { useEffect, useRef } from 'react';
import toast, { Toaster, ToastBar, useToasterStore } from 'react-hot-toast';

export default function ClientToaster() {
  const { toasts } = useToasterStore();
  const scheduledIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    toasts.forEach((t) => {
      // Only schedule auto-dismiss for non-loading toasts that haven't been scheduled yet
      if (t.type !== 'loading' && !scheduledIds.current.has(t.id)) {
        scheduledIds.current.add(t.id);
        
        // Force dismiss after 2500ms (2.5 seconds) as requested
        const duration = t.duration === Infinity ? Infinity : 2500;
        
        if (duration !== Infinity) {
          setTimeout(() => {
            toast.dismiss(t.id);
          }, duration);
        }
      }
    });

    // Clean up scheduled IDs for toasts that have been removed
    const activeIds = new Set(toasts.map((t) => t.id));
    scheduledIds.current.forEach((id) => {
      if (!activeIds.has(id)) {
        scheduledIds.current.delete(id);
      }
    });
  }, [toasts]);

  return (
    <Toaster
      position="top-center"
      containerStyle={{
        top: '64px',
      }}
      toastOptions={{
        duration: 2500, // Sync default duration to 2.5 seconds
        style: {
          background: '#181818',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.08)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <div
              onClick={() => toast.dismiss(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                cursor: 'pointer',
              }}
            >
              {icon}
              <div style={{ flex: 1, minWidth: 0 }}>{message}</div>
              {t.type !== 'loading' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.dismiss(t.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: t.style?.background === '#ffffff' || t.style?.background === '#fff' ? 'rgba(43, 34, 26, 0.4)' : 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    padding: '4px',
                    marginLeft: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'color 0.15s, background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = t.style?.background === '#ffffff' || t.style?.background === '#fff' ? '#221a15' : '#fff';
                    e.currentTarget.style.backgroundColor = t.style?.background === '#ffffff' || t.style?.background === '#fff' ? 'rgba(43, 34, 26, 0.06)' : 'rgba(255, 255, 255, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = t.style?.background === '#ffffff' || t.style?.background === '#fff' ? 'rgba(43, 34, 26, 0.4)' : 'rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label="Dismiss notification"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
