import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChevronLeft, Users, Map, Scroll, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { abilityModifier, formatModifier, capitalize } from '@/lib/utils.js';
import { useToastStore } from '@/store/toast';
import { DetailSkeleton } from '@/components/SkeletonLoader';

interface NPC { id: string; name: string; role: string; description?: string }
interface Session { id: string; title: string; session_number: number; date: string; summary: string }
interface Campaign {
  id: string; name: string; description?: string; setting?: string; status: string;
  dm_notes?: string; npcs?: NPC[]; sessions?: Session[];
}

type Tab = 'Overview' | 'NPCs' | 'Sessions' | 'DM Notes';
const TABS: Tab[] = ['Overview', 'NPCs', 'Sessions', 'DM Notes'];

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.add);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  const [addingNpc, setAddingNpc] = useState(false);
  const [npcForm, setNpcForm] = useState({ name: '', role: '', description: '' });

  const [addingSession, setAddingSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title: '', summary: '', date: '' });

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => api.get<Campaign>(`/campaigns/${id}`),
    enabled: !!id,
    retry: 1,
  });

  const addNpcMut = useMutation({
    mutationFn: (npc: typeof npcForm) => api.post(`/campaigns/${id}/npcs`, npc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign', id] });
      setAddingNpc(false);
      setNpcForm({ name: '', role: '', description: '' });
      toast({ type: 'success', message: 'NPC added', duration: 2000 });
    },
    onError: () => toast({ type: 'error', message: 'Failed to add NPC', duration: 3000 }),
  });

  const addSessionMut = useMutation({
    mutationFn: (session: typeof sessionForm & { session_number: number }) => api.post(`/campaigns/${id}/sessions`, session),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign', id] });
      setAddingSession(false);
      setSessionForm({ title: '', summary: '', date: '' });
      toast({ type: 'success', message: 'Session logged', duration: 2000 });
    },
    onError: () => toast({ type: 'error', message: 'Failed to log session', duration: 3000 }),
  });

  const deleteNpcMut = useMutation({
    mutationFn: (npcId: string) => api.delete(`/campaigns/${id}/npcs/${npcId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaign', id] }); toast({ type: 'info', message: 'NPC removed', duration: 2000 }); },
  });

  const updateNotesMut = useMutation({
    mutationFn: (notes: string) => api.patch(`/campaigns/${id}`, { dm_notes: notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign', id] });
      setEditingNotes(false);
      toast({ type: 'success', message: 'Notes saved', duration: 2000 });
    },
    onError: () => toast({ type: 'error', message: 'Failed to save notes. Run DB migrations.', duration: 5000 }),
  });

  if (isLoading || !data) {
    if (isError) throw new Error('Campaign not found or failed to load.');
    return <div className="py-12"><DetailSkeleton /></div>;
  }

  const npcs = data.npcs ?? [];
  const sessions = data.sessions ?? [];
  const reversedSessions = useMemo(() => [...sessions].reverse(), [sessions]);

  const handleSaveSession = () => {
    const nextSessionNumber = sessions.length > 0 ? Math.max(...sessions.map(s => s.session_number || 0)) + 1 : 1;
    addSessionMut.mutate({ ...sessionForm, session_number: nextSessionNumber });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={() => navigate('/campaigns')} className="btn-ghost mb-4 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Campaigns
      </button>

      <div className="relative rounded-3xl p-8 mb-6 overflow-hidden" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 blur-3xl pointer-events-none" style={{ background: 'var(--accent)', opacity: 0.05 }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl font-bold mb-2">{data.name}</h1>
            <div className="flex gap-2 flex-wrap">
              <span className="badge-level capitalize">{data.status ?? 'active'}</span>
              {data.setting && <span className="badge-level">{data.setting}</span>}
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {npcs.length} NPCs &bull; {sessions.length} sessions
              </span>
            </div>
          </div>
          <button onClick={() => navigate(`/campaigns/${id}/edit`)} className="btn-secondary flex items-center gap-2">
            <Edit2 className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="relative px-4 py-2 text-sm font-ui font-medium transition-colors" style={{ color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)' }}>
            {tab}
            {activeTab === tab && <motion.div layoutId="campaign-tab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ background: 'var(--accent)' }} />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="font-heading font-semibold mb-3">Description</h3>
                <p className="text-sm leading-relaxed" style={{ color: data.description ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                  {data.description ?? 'No description yet.'}
                </p>
              </div>
              <div className="card">
                <h3 className="font-heading font-semibold mb-3">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { icon: Users, label: 'NPCs', value: npcs.length },
                    { icon: Scroll, label: 'Sessions', value: sessions.length },
                    { icon: Map, label: 'Setting', value: data.setting ?? 'Not set' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span className="ml-auto font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'NPCs' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={() => setAddingNpc(true)} className="btn-primary flex items-center gap-1.5 text-sm">
                  <Plus className="w-4 h-4" /> Add NPC
                </button>
              </div>
              <AnimatePresence>
                {addingNpc && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="card space-y-3">
                    <h3 className="font-heading font-semibold">New NPC</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <input className="input" placeholder="Name" value={npcForm.name} onChange={(e) => setNpcForm((p) => ({ ...p, name: e.target.value }))} />
                      <input className="input" placeholder="Role (e.g. Villain, Ally)" value={npcForm.role} onChange={(e) => setNpcForm((p) => ({ ...p, role: e.target.value }))} />
                    </div>
                    <textarea className="input" rows={2} placeholder="Description..." value={npcForm.description} onChange={(e) => setNpcForm((p) => ({ ...p, description: e.target.value }))} />
                    <div className="flex gap-2">
                      <button onClick={() => addNpcMut.mutate(npcForm)} disabled={!npcForm.name || addNpcMut.isPending} className="btn-primary text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Save</button>
                      <button onClick={() => setAddingNpc(false)} className="btn-secondary text-sm"><X className="w-4 h-4" /></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {npcs.length === 0 ? (
                <div className="card text-center py-10" style={{ color: 'var(--text-muted)' }}>
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No NPCs yet. Add the first one above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {npcs.map((npc) => (
                    <div key={npc.id} className="card flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-heading font-semibold">{npc.name}</h3>
                        {npc.role && <p className="text-xs font-ui mb-1" style={{ color: 'var(--accent)' }}>{npc.role}</p>}
                        {npc.description && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{npc.description}</p>}
                      </div>
                      <button onClick={() => deleteNpcMut.mutate(npc.id)} className="btn-ghost p-1.5 rounded-lg text-red-400 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Sessions' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={() => setAddingSession(true)} className="btn-primary flex items-center gap-1.5 text-sm">
                  <Plus className="w-4 h-4" /> Log Session
                </button>
              </div>
              <AnimatePresence>
                {addingSession && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="card space-y-3">
                    <h3 className="font-heading font-semibold">New Session</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <input className="input" placeholder="Title" value={sessionForm.title} onChange={(e) => setSessionForm((p) => ({ ...p, title: e.target.value }))} />
                      <input type="date" className="input" value={sessionForm.date} onChange={(e) => setSessionForm((p) => ({ ...p, date: e.target.value }))} />
                    </div>
                    <textarea className="input" rows={3} placeholder="Session summary..." value={sessionForm.summary} onChange={(e) => setSessionForm((p) => ({ ...p, summary: e.target.value }))} />
                    <div className="flex gap-2">
                      <button onClick={handleSaveSession} disabled={!sessionForm.title || addSessionMut.isPending} className="btn-primary text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Save</button>
                      <button onClick={() => setAddingSession(false)} className="btn-secondary text-sm"><X className="w-4 h-4" /></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {sessions.length === 0 ? (
                <div className="card text-center py-10" style={{ color: 'var(--text-muted)' }}>
                  <Scroll className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No sessions logged yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reversedSessions.map((s) => (
                    <div key={s.id} className="card">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-heading font-semibold">Session {s.session_number}: {s.title}</h3>
                        <span className="text-xs font-ui" style={{ color: 'var(--text-muted)' }}>{s.date ? new Date(s.date).toLocaleDateString() : ''}</span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'DM Notes' && (
            <div className="card relative group">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-heading font-semibold">DM Notes</h3>
                {!editingNotes && (
                  <button onClick={() => { setNotesDraft(data.dm_notes ?? ''); setEditingNotes(true); }} className="btn-ghost text-sm p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 items-center">
                    <Edit2 className="w-3.5 h-3.5" /> Edit inline
                  </button>
                )}
              </div>

              {editingNotes ? (
                <div className="space-y-3">
                  <textarea autoFocus className="input w-full min-h-[150px]" value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} placeholder="Secret notes goes here..." />
                  <div className="flex gap-2">
                    <button onClick={() => updateNotesMut.mutate(notesDraft)} disabled={updateNotesMut.isPending} className="btn-primary text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Save Note</button>
                    <button onClick={() => setEditingNotes(false)} className="btn-secondary text-sm"><X className="w-4 h-4" /> Cancel</button>
                  </div>
                </div>
              ) : (
                <p onDoubleClick={() => { setNotesDraft(data.dm_notes ?? ''); setEditingNotes(true); }} className="text-sm whitespace-pre-wrap leading-relaxed cursor-text" style={{ color: data.dm_notes ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                  {data.dm_notes ?? 'No DM notes yet. Double-click to edit.'}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}