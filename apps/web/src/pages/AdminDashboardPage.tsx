import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Database, Trash2, AlertTriangle, X, ChevronUp, ChevronDown, BookMarked } from 'lucide-react';
import { api } from '@/lib/api.js';
import { useToastStore } from '@/store/toast';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface AdminStats {
  users: { total: number; by_role: Record<string, number> };
  campaigns: number;
  characters: number;
  homebrew: number;
}

interface UserData {
  id: string;
  email: string;
  username: string;
  display_name: string;
  role: string;
  is_verified: boolean;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'admin', label: 'Admin' },
];

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: number | undefined;
  color: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay, ease: [0.25, 1, 0.5, 1] }}
    className="card flex items-center gap-4"
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}1a`, border: `1px solid ${color}40` }}
    >
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
        {value ?? '—'}
      </p>
      <p className="text-xs font-ui" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
    </div>
  </motion.div>
);

// ── Delete confirmation modal ──────────────────────────────────────────────────
const DeleteUserModal = ({
  user,
  onConfirm,
  onCancel,
}: {
  user: UserData;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[9999] flex items-center justify-center"
    style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
    onClick={onCancel}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93, y: 12 }}
      transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
      className="relative w-full max-w-sm mx-4 rounded-2xl p-6 space-y-4"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--dragon)',
        boxShadow: 'var(--shadow-xl), 0 0 40px rgba(239,68,68,.15)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Icon */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--dragon-muted)', border: '1px solid var(--dragon)' }}
        >
          <AlertTriangle className="w-5 h-5" style={{ color: 'var(--dragon)' }} />
        </div>
        <div>
          <h3 className="font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
            Delete User
          </h3>
          <p className="text-xs font-ui" style={{ color: 'var(--text-muted)' }}>
            This action is permanent and cannot be undone.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="btn-ghost p-1.5 rounded-lg ml-auto"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User card preview */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-sm flex-shrink-0"
          style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
        >
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-ui font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {user.username}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {user.email}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="btn flex-1 font-ui font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, var(--dragon), #b91c1c)',
            border: '1px solid var(--dragon)',
            boxShadow: '0 0 20px rgba(239,68,68,.25)',
          }}
        >
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ── Main page component ────────────────────────────────────────────────────────
export const AdminDashboardPage: React.FC = () => {
  const toast = useToastStore((s) => s.add);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<UserData | null>(null);
  const [sortKey, setSortKey] = useState<'username' | 'role' | 'created_at'>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        api.get<AdminStats>('/admin/stats'),
        api.get<UserData[]>('/admin/users'),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch {
      toast({ type: 'error', message: 'Failed to load admin data', duration: 4000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast({ type: 'success', message: 'Role updated successfully', duration: 2500 });
    } catch {
      toast({ type: 'error', message: 'Failed to update role', duration: 3000 });
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await api.delete(`/admin/users/${target.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      toast({ type: 'info', message: `User "${target.username}" has been removed`, duration: 3000 });
    } catch {
      toast({ type: 'error', message: 'Failed to delete user', duration: 3000 });
    }
  };

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
  };

  const sorted = [...users].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const SortIcon = ({ col }: { col: typeof sortKey }) =>
    sortKey === col
      ? sortAsc
        ? <ChevronUp className="w-3.5 h-3.5 inline ml-1" style={{ color: 'var(--accent)' }} />
        : <ChevronDown className="w-3.5 h-3.5 inline ml-1" style={{ color: 'var(--accent)' }} />
      : <ChevronDown className="w-3.5 h-3.5 inline ml-1 opacity-30" />;

  const roleBadge = (role: string) => {
    const fallback = { bg: 'var(--surface-raised)', color: 'var(--text-secondary)' };
    const cfg: Record<string, { bg: string; color: string }> = {
      admin: { bg: 'var(--accent-muted)', color: 'var(--accent)' },
      moderator: { bg: 'rgba(20,184,166,.15)', color: 'var(--teal)' },
      user: fallback,
    };
    const s = cfg[role] ?? fallback;
    return (
      <span
        className="px-2.5 py-0.5 rounded-full text-xs font-ui font-medium capitalize"
        style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}40` }}
      >
        {role}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
        />
        <p className="text-sm font-ui" style={{ color: 'var(--text-muted)' }}>
          Loading admin data…
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-muted)', border: '1px solid var(--border-strong)' }}
          >
            <Shield className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Admin Dashboard
            </h1>
            <p className="text-xs font-ui" style={{ color: 'var(--text-muted)' }}>
              Manage users and monitor platform activity
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Users" value={stats?.users.total} color="var(--accent)" delay={0} />
          <StatCard icon={Database} label="Campaigns" value={stats?.campaigns} color="var(--teal)" delay={0.05} />
          <StatCard icon={BookMarked} label="Characters" value={stats?.characters} color="var(--gold2)" delay={0.1} />
          <StatCard icon={Database} label="Homebrew" value={stats?.homebrew} color="var(--dragon)" delay={0.15} />
        </div>

        {/* Users table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface)' }}
        >
          {/* Table header */}
          <div
            className="px-6 py-4 flex items-center gap-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <Users className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h2 className="font-heading font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
              User Management
            </h2>
            <span
              className="ml-auto text-xs font-ui px-2 py-0.5 rounded-full"
              style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              {users.length} users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}>
                  {(['username', 'role', 'created_at'] as const).map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left font-ui font-medium text-xs uppercase tracking-wider cursor-pointer select-none transition-colors"
                      style={{ color: sortKey === col ? 'var(--accent)' : 'var(--text-muted)' }}
                      onClick={() => toggleSort(col)}
                    >
                      {col === 'created_at' ? 'Joined' : col.charAt(0).toUpperCase() + col.slice(1)}
                      <SortIcon col={col} />
                    </th>
                  ))}
                  <th className="px-5 py-3 text-left font-ui font-medium text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Change Role
                  </th>
                  <th className="px-5 py-3 text-right font-ui font-medium text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {sorted.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2, delay: i * 0.02 }}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Username */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-heading font-bold text-xs"
                            style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                          >
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-ui font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                              {user.username}
                            </p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Current role badge */}
                      <td className="px-5 py-3.5">{roleBadge(user.role)}</td>

                      {/* Joined date */}
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-ui" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </td>

                      {/* Role selector */}
                      <td className="px-5 py-3.5">
                        <div className="w-36">
                          <CustomSelect
                            value={user.role}
                            onChange={(val) => handleChangeRole(user.id, val)}
                            options={ROLE_OPTIONS}
                          />
                        </div>
                      </td>

                      {/* Delete */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setPendingDelete(user)}
                          className="btn-ghost p-2 rounded-xl transition-colors"
                          title="Delete user"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--dragon)';
                            e.currentTarget.style.background = 'var(--dragon-muted)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Delete confirmation modal (portaled via AnimatePresence) */}
      <AnimatePresence>
        {pendingDelete && (
          <DeleteUserModal
            user={pendingDelete}
            onConfirm={confirmDelete}
            onCancel={() => setPendingDelete(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
