import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToastStore } from '@/store/toast.js';

const ICONS = {
  success: <CheckCircle className="w-4 h-4" />,
  error: <AlertCircle className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
};

const COLORS = {
  success: { bg: 'rgba(34,197,94,0.12)', border: '#22c55e', text: '#22c55e' },
  error: { bg: 'rgba(239,68,68,0.12)', border: 'var(--dragon)', text: 'var(--dragon)' },
  warning: { bg: 'rgba(251,191,36,0.12)', border: 'var(--gold2)', text: 'var(--gold2)' },
  info: { bg: 'var(--accent-muted)', border: 'var(--accent)', text: 'var(--accent)' },
};

export function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const color = COLORS[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="pointer-events-auto rounded-xl px-4 py-3 shadow-xl flex items-start gap-3"
              style={{ background: color.bg, border: `1px solid ${color.border}` }}
            >
              <span style={{ color: color.text, flexShrink: 0, marginTop: 1 }}>{ICONS[toast.type]}</span>
              <p className="text-sm font-ui flex-1" style={{ color: 'var(--text-primary)' }}>{toast.message}</p>
              <button
                onClick={() => remove(toast.id)}
                className="btn-ghost p-0.5 rounded-lg flex-shrink-0"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
