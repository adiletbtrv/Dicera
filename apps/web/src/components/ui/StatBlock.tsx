import { abilityModifier, formatModifier, cn } from '@/lib/utils.js';
import type { Monster } from '@dnd/data';

interface StatBlockProps {
  monster: Monster;
  className?: string;
}

const ABILITY_LABELS = [
  { key: 'str', label: 'STR' },
  { key: 'dex', label: 'DEX' },
  { key: 'con', label: 'CON' },
  { key: 'int', label: 'INT' },
  { key: 'wis', label: 'WIS' },
  { key: 'cha', label: 'CHA' },
] as const;

export function StatBlock({ monster, className }: StatBlockProps) {
  return (
    <div 
      className={cn('stat-block font-body text-sm rounded-xl p-6 shadow-xl', className)}
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border-strong)',
        color: 'var(--text-secondary)'
      }}
    >
      <div className="border-b-[3px] pb-3 mb-3" style={{ borderColor: 'var(--accent)' }}>
        <h2 className="font-heading text-3xl font-bold tracking-tight" style={{ color: 'var(--accent)' }}>{monster.name}</h2>
        <p className="italic font-ui mt-1" style={{ color: 'var(--text-muted)' }}>
          {monster.size} {monster.type}
          {monster.subtype ? ` (${monster.subtype})` : ''}, {monster.alignment}
        </p>
      </div>

      <div className="space-y-1.5 border-b border-dashed pb-3 mb-3" style={{ borderColor: 'var(--border-strong)' }}>
        <p>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Armor Class</span>{' '}
          {monster.armor_class}{monster.armor_desc ? ` (${monster.armor_desc})` : ''}
        </p>
        <p>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Hit Points</span>{' '}
          <span style={{ color: 'var(--purple2)' }}>{monster.hit_points}</span> ({monster.hit_dice})
        </p>
        <p>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Speed</span>{' '}
          {Object.entries(monster.speed || {})
            .filter(([k]) => k !== 'hover')
            .map(([key, val]) => `${key === 'walk' ? '' : key + ' '}${val} ft.`)
            .join(', ')}
          {monster.speed?.hover ? ' (hover)' : ''}
        </p>
        <p>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Challenge</span>{' '}
          <span style={{ color: 'var(--teal2)' }}>{monster.challenge_rating}</span> ({monster.xp?.toLocaleString() ?? 0} XP)
        </p>
        <p>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Proficiency Bonus</span>{' '}
          {formatModifier(monster.proficiency_bonus)}
        </p>
      </div>

      <div className="grid grid-cols-6 gap-2 text-center border-b pb-3 mb-4" style={{ borderColor: 'var(--border-strong)' }}>
        {ABILITY_LABELS.map(({ key, label }) => {
          const score = monster.ability_scores[key];
          const mod = abilityModifier(score);
          return (
            <div key={key} className="flex flex-col items-center p-2 rounded-lg" style={{ background: 'var(--surface)' }}>
              <span className="font-bold text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--accent)' }}>{label}</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {score}
              </span>
              <span className="text-xs font-ui mt-0.5" style={{ color: 'var(--text-muted)' }}>
                ({formatModifier(mod)})
              </span>
            </div>
          );
        })}
      </div>

      {Object.keys(monster.saving_throws ?? {}).length > 0 && (
        <p className="mb-1">
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Saving Throws</span>{' '}
          {Object.entries(monster.saving_throws ?? {})
            .map(([k, v]) => `${k.toUpperCase()} ${formatModifier(v)}`)
            .join(', ')}
        </p>
      )}

      {Object.keys(monster.skills ?? {}).length > 0 && (
        <p className="mb-1">
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Skills</span>{' '}
          {Object.entries(monster.skills ?? {})
            .map(([k, v]) => `${k} ${formatModifier(v)}`)
            .join(', ')}
        </p>
      )}

      {(monster.damage_vulnerabilities?.length ?? 0) > 0 && (
        <p className="mb-1">
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Damage Vulnerabilities</span>{' '}
          <span style={{ color: 'var(--dragon)' }}>{monster.damage_vulnerabilities?.join('; ')}</span>
        </p>
      )}
      {(monster.damage_resistances?.length ?? 0) > 0 && (
        <p className="mb-1">
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Damage Resistances</span>{' '}
          {monster.damage_resistances?.join('; ')}
        </p>
      )}
      {(monster.damage_immunities?.length ?? 0) > 0 && (
        <p className="mb-1">
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Damage Immunities</span>{' '}
          {monster.damage_immunities?.join('; ')}
        </p>
      )}
      {(monster.condition_immunities?.length ?? 0) > 0 && (
        <p className="mb-1">
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Condition Immunities</span>{' '}
          {monster.condition_immunities?.join(', ')}
        </p>
      )}

      {monster.senses && Object.keys(monster.senses).length > 0 && (
        <p className="mb-1">
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Senses</span>{' '}
          {Object.entries(monster.senses)
            .map(([k, v]) => `${k.replace(/_/g, ' ')} ${v}`)
            .join(', ')}
        </p>
      )}

      <p className="mb-4 pb-4 border-b border-dashed" style={{ borderColor: 'var(--border-strong)' }}>
        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Languages</span>{' '}
        {monster.languages || '—'}
      </p>

      {(monster.special_abilities?.length ?? 0) > 0 && (
        <div className="mb-4">
          {monster.special_abilities!.map((ability, i) => (
            <p key={i} className="mb-2 leading-relaxed">
              <span className="font-bold italic" style={{ color: 'var(--text-primary)' }}>{ability.name}.</span> {ability.desc}
            </p>
          ))}
        </div>
      )}

      {(monster.actions?.length ?? 0) > 0 && (
        <div className="mb-4 pt-4 border-t" style={{ borderColor: 'var(--border-strong)' }}>
          <h3 className="font-heading font-bold text-xl mb-3" style={{ color: 'var(--accent)' }}>Actions</h3>
          {monster.actions!.map((action, i) => (
            <p key={i} className="mb-2 leading-relaxed">
              <span className="font-bold italic" style={{ color: 'var(--text-primary)' }}>{action.name}.</span> {action.desc}
            </p>
          ))}
        </div>
      )}

      {(monster.bonus_actions?.length ?? 0) > 0 && (
        <div className="mb-4 pt-4 border-t border-dashed" style={{ borderColor: 'var(--border-strong)' }}>
          <h3 className="font-heading font-bold text-lg mb-2" style={{ color: 'var(--teal2)' }}>Bonus Actions</h3>
          {monster.bonus_actions!.map((action, i) => (
            <p key={i} className="mb-2 leading-relaxed">
              <span className="font-bold italic" style={{ color: 'var(--text-primary)' }}>{action.name}.</span> {action.desc}
            </p>
          ))}
        </div>
      )}

      {(monster.reactions?.length ?? 0) > 0 && (
        <div className="mb-4 pt-4 border-t border-dashed" style={{ borderColor: 'var(--border-strong)' }}>
          <h3 className="font-heading font-bold text-lg mb-2" style={{ color: 'var(--teal2)' }}>Reactions</h3>
          {monster.reactions!.map((action, i) => (
            <p key={i} className="mb-2 leading-relaxed">
              <span className="font-bold italic" style={{ color: 'var(--text-primary)' }}>{action.name}.</span> {action.desc}
            </p>
          ))}
        </div>
      )}

      {(monster.legendary_actions?.length ?? 0) > 0 && (
        <div className="pt-4 border-t" style={{ borderColor: 'var(--border-strong)' }}>
          <h3 className="font-heading font-bold text-xl mb-3" style={{ color: 'var(--accent)' }}>Legendary Actions</h3>
          {monster.legendary_actions!.map((action, i) => (
            <p key={i} className="mb-2 leading-relaxed">
              <span className="font-bold italic" style={{ color: 'var(--text-primary)' }}>{action.name}.</span> {action.desc}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
