import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Scroll } from 'lucide-react';
import { useNotificationsStore } from '@/store/notifications';
import { Link } from 'react-router-dom';

export const NotificationsDropdown: React.FC = () => {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } =
    useNotificationsStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="btn-ghost p-2 rounded-xl relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
              style={{
                background: 'var(--dragon)',
                color: 'white',
                border: '2px solid var(--bg)',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-xl), 0 0 30px rgba(139,92,246,.1)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-ui font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="btn-ghost py-1 px-2 text-xs rounded-lg flex items-center gap-1"
                  style={{ color: 'var(--accent)' }}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[320px] overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Scroll className="w-8 h-8 opacity-25" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm font-ui" style={{ color: 'var(--text-muted)' }}>
                    No notifications yet.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.is_read) markAsRead(n.id); }}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      background: n.is_read ? 'transparent' : 'var(--accent-muted)',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = n.is_read ? 'transparent' : 'var(--accent-muted)')}
                  >
                    {/* Unread dot */}
                    <span
                      className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: n.is_read ? 'transparent' : 'var(--accent)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-ui font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {n.title}
                      </p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {n.message}
                      </p>
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => setIsOpen(false)}
                          className="text-xs mt-1 inline-block font-medium transition-colors"
                          style={{ color: 'var(--accent)' }}
                          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--accent-hover)')}
                          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--accent)')}
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
