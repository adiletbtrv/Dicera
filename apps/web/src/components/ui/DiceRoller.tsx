import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api.js';
import { useDiceStore } from '@/store/dice.js';
import { cn } from '@/lib/utils.js';
import { Dices, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

function Real3DDice({ isRolling, dieType }: { isRolling: boolean, dieType: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const isRollingRef = useRef(isRolling);
  const sceneRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    isRollingRef.current = isRolling;
  }, [isRolling]);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 8;
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(400, 400);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    let geometry: THREE.BufferGeometry;
    let targetRot = { x: 0, y: 0, z: 0 };

    if (dieType === 'd4') {
      geometry = new THREE.TetrahedronGeometry(2.2);
      targetRot = { x: 0.615, y: -0.785, z: 0 };
    } else if (dieType === 'd6') {
      geometry = new THREE.BoxGeometry(2.8, 2.8, 2.8);
      targetRot = { x: 0, y: 0, z: 0 };
    } else if (dieType === 'd8') {
      geometry = new THREE.OctahedronGeometry(2.4);
      targetRot = { x: -0.615, y: -0.785, z: 0 };
    } else if (dieType === 'd10' || dieType === 'd100') {
      geometry = new THREE.OctahedronGeometry(2.4); // fallback D10 to Octahedron for now
      targetRot = { x: -0.615, y: -0.785, z: 0 };
    } else if (dieType === 'd12') {
      geometry = new THREE.DodecahedronGeometry(2.2);
      targetRot = { x: 0, y: 0, z: 0 };
    } else {
      geometry = new THREE.IcosahedronGeometry(2.4, 0); // d20
      targetRot = { x: -0.5535, y: 0, z: 0 };
    }

    const material = new THREE.MeshStandardMaterial({ 
      color: 0x8b5cf6, roughness: 0.15, metalness: 0.7 
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xd8b4fe, linewidth: 2 }));
    mesh.add(line);
    
    const group = new THREE.Group();
    group.add(mesh);
    scene.add(group);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(10, 10, 5);
    scene.add(dirLight);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (isRollingRef.current) {
        mesh.rotation.x += 0.15;
        mesh.rotation.y += 0.20;
        mesh.rotation.z += 0.10;
        group.position.y = Math.sin(Date.now() * 0.01) * 0.3;
      } else {
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, targetRot.x, 0.1);
        mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, targetRot.y, 0.1);
        mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, targetRot.z, 0.1);
        group.position.y = THREE.MathUtils.lerp(group.position.y, 0, 0.05);
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [dieType]);

  return <div ref={mountRef} className="absolute inset-0 flex items-center justify-center opacity-80" />;
}

interface RollResult {
  expression: string;
  total: number;
  rolls: Array<{ die: number; value: number }>;
  modifier: number;
  breakdown: string;
  label?: string;
}

const QUICK_DICE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

interface DiceRollerProps {
  campaignId?: string;
  compact?: boolean;
}

export function DiceRoller({ campaignId, compact = false }: DiceRollerProps) {
  const [expression, setExpression] = useState('1d20');
  const [label, setLabel] = useState('');
  const [lastResult, setLastResult] = useState<RollResult | null>(null);
  
  const [isRolling, setIsRolling] = useState(false);
  const [enableAnimation, setEnableAnimation] = useState(true);
  const [fakeValue, setFakeValue] = useState(20);
  
  const addRoll = useDiceStore((s) => s.addRoll);
  const history = useDiceStore((s) => s.history);

  useEffect(() => {
    let interval: number;
    if (isRolling && enableAnimation) {
      interval = window.setInterval(() => {
        setFakeValue(Math.floor(Math.random() * 20) + 1);
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isRolling, enableAnimation]);

  async function rollDice(expr?: string) {
    const rollExpr = expr ?? expression;
    setIsRolling(true);
    setLastResult(null);
    
    try {
      const result = await api.post<RollResult>('/dice/roll', {
        expression: rollExpr,
        label: label || undefined,
        campaign_id: campaignId,
      });

      if (enableAnimation) {
        await new Promise(r => setTimeout(r, 1200));
      }

      setLastResult(result);
      addRoll(result);
    } catch (err) {
      console.error('Roll failed:', err);
    } finally {
      setIsRolling(false);
    }
  }

  function handleQuickRoll(die: string) {
    const expr = `1${die}`;
    setExpression(expr);
    rollDice(expr);
  }

  const match = expression.match(/d(\d+)/i);
  const currentDieType = match ? `d${match[1]}`.toLowerCase() : 'd20';

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-4">

        <div className="flex flex-wrap gap-2">
          {QUICK_DICE.map((die) => (
            <button
              key={die}
              onClick={() => handleQuickRoll(die)}
              className={cn(
                'font-ui font-semibold shadow-sm transition-all duration-200 active:scale-95',
                die === 'd20' 
                  ? 'bg-[var(--accent)] text-white hover:brightness-110 border border-transparent' 
                  : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
                compact ? 'text-xs px-2.5 py-1.5 rounded-lg' : 'text-sm px-4 py-2 rounded-xl',
              )}
            >
              {die}
            </button>
          ))}
        </div>


        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && rollDice()}
            placeholder="e.g. 2d6+3, 1d20+5"
            className="input font-mono flex-1 min-w-[120px]"
          />
          {!compact && (
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (optional)"
              className="input w-32 sm:w-40 flex-shrink-0"
            />
          )}
          <button
            onClick={() => rollDice()}
            disabled={isRolling}
            className="btn-primary flex items-center gap-2 px-5 font-bold shadow-lg"
          >
            {isRolling ? 'Rolling...' : (
              <>
                <Dices className="w-5 h-5" /> Roll
              </>
            )}
          </button>
        </div>


        <button 
          onClick={() => setEnableAnimation(!enableAnimation)}
          className="flex items-center gap-2 text-xs font-ui text-[var(--text-muted)] hover:text-[var(--text-primary)] w-fit transition-colors"
        >
          {enableAnimation ? <CheckSquare className="w-4 h-4 text-[var(--accent)]" /> : <Square className="w-4 h-4" />}
          Enable 3D Rolling Animations
        </button>
      </div>


      <div className="relative min-h-[300px] flex items-center justify-center p-6 rounded-2xl border shadow-inner overflow-hidden" style={{ background: 'var(--bg)', borderColor: 'var(--border-strong)' }}>
        

        {enableAnimation && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
             {(isRolling || lastResult) && <Real3DDice isRolling={isRolling} dieType={currentDieType} />}
          </div>
        )}

        <div className="relative z-10 w-full flex flex-col items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">

            {isRolling && enableAnimation && (
              <motion.div
                key="rolling"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                className="flex items-center justify-center"
              >

                <motion.span 
                  className="font-rubik font-black text-6xl lg:text-7xl text-white drop-shadow-2xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.08, repeat: Infinity }}
                >
                  {fakeValue}
                </motion.span>
              </motion.div>
            )}


            {!isRolling && lastResult && (
              <motion.div
                key="result"
                initial={enableAnimation ? { opacity: 0, y: 50, scale: 1.5, rotate: -15 } : { opacity: 0 }}
                animate={enableAnimation ? { opacity: 1, y: 0, scale: 1, rotate: 0 } : { opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-center"
              >
                <div className="mb-6 pointer-events-auto">
                  {lastResult.label && <span className="text-xs font-montserrat uppercase tracking-widest font-bold drop-shadow-md" style={{ color: 'var(--accent)' }}>{lastResult.label}</span>}
                  <div className="font-mono text-sm drop-shadow-md" style={{ color: 'var(--text-muted)' }}>{lastResult.expression}</div>
                </div>
                
                <motion.div 
                  className="inline-block relative"
                  animate={enableAnimation ? { 
                    filter: ['drop-shadow(0 0 0px var(--accent))', 'drop-shadow(0 0 40px var(--accent))', 'drop-shadow(0 0 10px var(--accent-muted))'],
                  } : {}}
                  transition={{ duration: 1 }}
                >
                  <span className="font-rubik font-black text-7xl lg:text-8xl" style={{ 
                    color: 'white',
                    WebkitTextStroke: '2px var(--accent)'
                  }}>
                    {lastResult.total}
                  </span>
                </motion.div>

                <div className="mt-8 font-mono text-sm max-w-[280px] mx-auto break-words bg-[var(--surface-overlay)] backdrop-blur-md p-3 rounded-lg border border-[var(--border-subtle)] pointer-events-auto" style={{ color: 'var(--text-secondary)' }}>
                  {lastResult.breakdown}
                </div>
              </motion.div>
            )}

            {!isRolling && !lastResult && (
               <motion.div 
                 key="empty" 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="font-ui text-[var(--text-muted)] italic"
               >
                 Cast your dice...
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>


      {!compact && history.length > 0 && (
        <div className="space-y-2 mt-8 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <h4 className="font-montserrat text-[0.65rem] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>Recent Rolls</h4>
          <div className="grid gap-2 max-h-48 overflow-y-auto scrollbar-thin pr-2">
            {history.map((roll) => (
              <div key={roll.id} className="flex justify-between items-center bg-[var(--surface)] p-3 rounded-xl border border-[var(--border-subtle)]">
                <div className="flex flex-col">
                  {roll.label && <span className="text-[0.65rem] font-montserrat uppercase font-bold text-[var(--text-secondary)]">{roll.label}</span>}
                  <span className="font-mono text-xs text-[var(--text-muted)]">{roll.expression} {roll.modifier !== 0 && `(Mod: ${roll.modifier > 0 ? '+'+roll.modifier : roll.modifier})`}</span>
                </div>
                <div className="font-rubik font-bold text-xl text-[var(--text-primary)] pl-4 border-l border-[var(--border)]">{roll.total}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

