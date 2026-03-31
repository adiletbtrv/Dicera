import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function CustomSelect({ options, value, onChange, placeholder = 'Select...', className }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // FIXED: Explicitly defined the state to allow undefined values to satisfy strict TS
  const [pos, setPos] = useState<{ top: number | undefined; bottom: number | undefined; left: number; width: number; isUp: boolean }>({
    top: undefined, bottom: undefined, left: 0, width: 0, isUp: false
  });

  const selectedOption = options.find((o) => o.value === value);

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // If there is less than 280px below, and more space above, open upwards!
      const openUpwards = spaceBelow < 280 && spaceAbove > spaceBelow;

      setPos({
        top: openUpwards ? undefined : rect.bottom + 6,
        bottom: openUpwards ? window.innerHeight - rect.top + 6 : undefined,
        left: rect.left,
        width: rect.width,
        isUp: openUpwards,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  const dropdownMenu = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: pos.isUp ? 4 : -4, scaleY: 0.95 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: pos.isUp ? 4 : -4, scaleY: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed rounded-lg shadow-lg border overflow-hidden"
          style={{
            top: pos.top,
            bottom: pos.bottom,
            left: pos.left,
            width: pos.width,
            zIndex: 99999,
            transformOrigin: pos.isUp ? 'bottom' : 'top',
            background: 'var(--header-bg, var(--surface-raised))',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderColor: 'var(--border-strong)',
            boxShadow: '0 8px 32px rgba(0,0,0,.6), 0 0 20px rgba(139,92,246,.15)',
          }}
        >
          <ul className="max-h-60 overflow-auto scrollbar-thin py-1">
            {options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                No options
              </li>
            ) : (
              options.map((option) => (
                <li
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-sm transition-colors"
                  style={{
                    color: value === option.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: value === option.value ? 'var(--sidebar-active)' : 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = value === option.value ? 'var(--sidebar-active)' : 'transparent')}
                >
                  <span className={cn('block truncate capitalize', value === option.value ? 'font-medium' : 'font-normal')}>
                    {option.label}
                  </span>

                  {value === option.value ? (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <Check className="h-4 w-4" style={{ color: 'var(--accent)' }} aria-hidden="true" />
                    </span>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={cn('relative w-full', className)}>
      <button
        ref={buttonRef}
        type="button"
        className="input w-full flex items-center justify-between !pr-3"
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'var(--bg3, var(--surface))' }}
      >
        <span className={cn('block truncate', !selectedOption && 'text-[var(--text-muted)]')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180')}
          style={{ color: 'var(--accent)' }}
        />
      </button>

      {createPortal(dropdownMenu, document.body)}
    </div>
  );
}