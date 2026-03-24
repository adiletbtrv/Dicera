import { useState } from 'react';
import { api } from '@/lib/api.js';
import { useAuthStore } from '@/store/auth.js';
import { Link } from 'react-router-dom';
import { Bot, BookOpen, Drama, Scroll, Dice5, Send } from 'lucide-react';

type Tab = 'rules' | 'npc' | 'story' | 'dm';
interface Message { role: 'user' | 'assistant'; content: string }

export function AiPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('rules');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Bot className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--accent)' }} />
        <h2 className="font-heading text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>AI Assistants</h2>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Sign in to access AI-powered rules Q&A, NPC dialogue, story generation, and DM advice.</p>
        <Link to="/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; placeholder: string }[] = [
    { id: 'rules', label: 'Rules Q&A', icon: <BookOpen className="w-4 h-4" />, placeholder: 'Ask a rules question...' },
    { id: 'npc', label: 'NPC Dialogue', icon: <Drama className="w-4 h-4" />, placeholder: 'Describe an NPC and what you say to them...' },
    { id: 'story', label: 'Story Generator', icon: <Scroll className="w-4 h-4" />, placeholder: 'Describe your campaign context for a session hook...' },
    { id: 'dm', label: 'DM Assistant', icon: <Dice5 className="w-4 h-4" />, placeholder: 'Ask for DM advice, encounter ideas...' },
  ];

  async function sendMessage() {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput(''); setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    try {
      let reply = '';
      if (tab === 'rules') { reply = (await api.post<{ answer: string }>('/ai/rules', { question: userMessage })).answer; }
      else if (tab === 'dm') { reply = (await api.post<{ reply: string }>('/ai/dm/chat', { history: messages.slice(-10), message: userMessage })).reply; }
      else if (tab === 'story') { reply = (await api.post<{ hook: string }>('/ai/story/hook', { context: { campaignName: 'Your Campaign', recentEvents: userMessage } })).hook; }
      else { reply = (await api.post<{ reply: string }>('/ai/npc/dialogue', { persona: { name: 'Unknown NPC', personality: 'Mysterious' }, message: userMessage, history: messages.slice(-10) })).reply; }
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) { setError(err instanceof Error ? err.message : 'AI request failed'); }
    finally { setIsLoading(false); }
  }

  const currentTab = tabs.find((t) => t.id === tab)!;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Bot className="w-7 h-7" style={{ color: 'var(--accent)' }} />
        <div>
          <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Assistants</h1>
          <p className="mt-1 font-ui text-sm" style={{ color: 'var(--text-secondary)' }}>AI-powered tools for your D&D sessions</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setMessages([]); setError(null); }}
            className="btn-ghost text-sm flex items-center gap-2"
            style={{ background: tab === t.id ? 'var(--accent-muted)' : undefined, color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="card min-h-96 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-96 scrollbar-thin">
          {messages.length === 0 && (
            <div className="text-center py-8 flex flex-col items-center">
              <div className="mb-3 p-3 rounded-xl" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                <span className="[&>svg]:w-8 [&>svg]:h-8">{currentTab.icon}</span>
              </div>
              <p className="font-heading font-medium" style={{ color: 'var(--text-primary)' }}>{currentTab.label}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Ask anything about D&D 5e</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%] rounded-xl px-4 py-2.5 text-sm font-body"
                style={msg.role === 'user'
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
                }
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                Thinking...
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm rounded-xl px-4 py-3 mb-3 flex flex-col gap-1" style={{ color: 'var(--dragon)', background: 'var(--dragon-muted)', border: '1px solid var(--border)' }}>
            <strong>{error}</strong>
            {error.includes('503') && (
              <span style={{ color: 'var(--text-secondary)' }}>
                Your server does not have an AI provider configured! Please open <code className="bg-[var(--surface)] px-1 rounded">apps/api/.env</code> and add your OpenAI or Gemini API Key to enable the AI Assistant.
              </span>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={currentTab.placeholder} className="input flex-1" disabled={isLoading} />
          <button onClick={sendMessage} disabled={isLoading || !input.trim()} className="btn-primary flex items-center gap-2">
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>

      <div className="mt-4 text-xs text-center font-ui" style={{ color: 'var(--text-muted)' }}>
        AI responses may contain errors. Always verify rules with official sources.
      </div>
    </div>
  );
}
