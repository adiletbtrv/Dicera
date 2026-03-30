import { cn } from '@/lib/utils.js';
import type { Spell } from '@dnd/data';

interface SpellCardProps {
  spell: Spell;
  compact?: boolean;
  className?: string;
  onClick?: () => void;
}

const SCHOOL_COLORS: Record<string, string> = {
  abjuration: 'bg-blue-900 text-blue-300 border-blue-700',
  conjuration: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  divination: 'bg-cyan-900 text-cyan-300 border-cyan-700',
  enchantment: 'bg-pink-900 text-pink-300 border-pink-700',
  evocation: 'bg-orange-900 text-orange-300 border-orange-700',
  illusion: 'bg-purple-900 text-purple-300 border-purple-700',
  necromancy: 'bg-gray-900 text-gray-300 border-gray-700',
  transmutation: 'bg-green-900 text-green-300 border-green-700',
};

function levelLabel(level: number): string {
  if (level === 0) return 'Cantrip';
  const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
  return `${ordinals[level] ?? level}-level`;
}

export function SpellCard({ spell, compact = false, className, onClick }: SpellCardProps) {
  const schoolColor = SCHOOL_COLORS[spell.school] ?? 'bg-gray-900 text-gray-300 border-gray-700';

  return (
    <div
      className={cn(
        'card h-full flex flex-col cursor-pointer transition-all duration-200',
        onClick && 'hover:shadow-md',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{spell.name}</h3>
          <p className="text-xs capitalize font-ui" style={{ color: 'var(--text-muted)' }}>
            {levelLabel(spell.level)} {spell.school}
            {spell.ritual ? ' (ritual)' : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={cn('badge border', schoolColor)}>{spell.school}</span>
          <span className="badge-level">{spell.level === 0 ? 'C' : spell.level}</span>
        </div>
      </div>

      {!compact && (
        <div className="flex-1 flex flex-col">
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
            <p><span style={{ color: 'var(--text-muted)' }}>Casting Time:</span> {spell.casting_time}</p>
            <p><span style={{ color: 'var(--text-muted)' }}>Range:</span> {spell.range}</p>
            <p><span style={{ color: 'var(--text-muted)' }}>Duration:</span> {spell.duration}</p>
            <p>
              <span style={{ color: 'var(--text-muted)' }}>Components:</span>{' '}
              {[
                spell.components.verbal && 'V',
                spell.components.somatic && 'S',
                spell.components.material && 'M',
              ].filter(Boolean).join(', ')}
            </p>
          </div>

          {spell.concentration && (
            <div className="mt-2">
              <span className="inline-block badge bg-amber-900 text-amber-300 border border-amber-700">
                Concentration
              </span>
            </div>
          )}

          <p className="mt-3 text-sm line-clamp-3 font-body flex-1" style={{ color: 'var(--text-secondary)' }}>{spell.description}</p>

          {spell.classes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {spell.classes.map((cls: any, i: number) => (
                <span key={i} className="badge capitalize" style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  {cls}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-auto pt-4 text-xs font-ui" style={{ color: 'var(--text-muted)' }}>{spell.source}{spell.page ? ` p.${spell.page}` : ''}</p>
    </div>
  );
}
