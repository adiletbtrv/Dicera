import { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChevronLeft, ZoomIn, ZoomOut, RotateCcw, Download, MapPin, Trash2, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomSelect } from '@/components/ui/CustomSelect.js';

interface MapData { id: string; name: string; description?: string; image_url?: string; tags?: string[]; width?: number; height?: number; }
type Pin = { id: string; x: number; y: number; label: string; color: string; size: number };
const PIN_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7'];
const PIN_SIZES = [16, 24, 32, 48];

export function MapDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [pins, setPins] = useState<Pin[]>([]);
  const [pinMode, setPinMode] = useState(false);
  const [pinForm, setPinForm] = useState({ color: PIN_COLORS[0]!, size: 24, label: '' });
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['map', id],
    queryFn: () => api.get<MapData>(`/maps/${id}`),
    enabled: !!id,
  });

  useEffect(() => {
    if (!data?.image_url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgRef.current = img; setImgLoaded(true); };
    img.src = data.image_url;
  }, [data?.image_url]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setPinMode(false); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleZoom(delta: number) { setScale((s) => Math.max(0.25, Math.min(5, s + delta))); }

  function handleMouseDown(e: React.MouseEvent) {
    if (pinMode || editingPin) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }

  function handleMouseUp() { setIsDragging(false); }

  function handleContainerClick(e: React.MouseEvent) {
    if (!pinMode) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const imgX = (clickX - offset.x) / scale;
    const imgY = (clickY - offset.y) / scale;

    const img = imgRef.current;
    if (!img || !imgLoaded) return;

    const newPin: Pin = {
      id: Math.random().toString(36).substring(2, 9),
      x: imgX / img.naturalWidth,
      y: imgY / img.naturalHeight,
      label: pinForm.label,
      color: pinForm.color,
      size: pinForm.size,
    };

    setPins((prev) => [...prev, newPin]);
    setPinMode(false);
    setPinForm({ ...pinForm, label: '' });
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    handleZoom(e.deltaY < 0 ? 0.1 : -0.1);
  }

  function saveEditedPin() {
    if (!editingPin) return;
    setPins(pins.map(p => p.id === editingPin.id ? editingPin : p));
    setEditingPin(null);
  }

  function deleteEditedPin() {
    if (!editingPin) return;
    setPins(pins.filter(p => p.id !== editingPin.id));
    setEditingPin(null);
  }

  if (isLoading) return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading map...</div>;
  if (!data) return <div className="text-center py-12" style={{ color: 'var(--dragon)' }}>Map not found.</div>;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-4" style={{ height: 'calc(100vh - 12rem)' }}>
      <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate('/maps')} className="btn-ghost flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Maps
        </button>
        <h1 className="font-heading text-2xl font-bold flex-1">{data.name}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => handleZoom(0.25)} className="btn-secondary p-2"><ZoomIn className="w-4 h-4" /></button>
          <button onClick={() => handleZoom(-0.25)} className="btn-secondary p-2"><ZoomOut className="w-4 h-4" /></button>
          <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} className="btn-secondary p-2"><RotateCcw className="w-4 h-4" /></button>

          <div className="h-6 w-px bg-white/10 mx-1" />

          <div className="flex gap-1 bg-white/5 rounded-full p-1 border border-white/10">
            {PIN_COLORS.map((c) => (
              <button key={c} onClick={() => { setPinForm({ ...pinForm, color: c }); setPinMode(true); setEditingPin(null); }} className="w-6 h-6 rounded-full border-2" style={{ background: c, borderColor: pinForm.color === c && pinMode ? 'white' : 'transparent' }} />
            ))}
          </div>
          {pinMode && (
            <div className="flex items-center gap-2">
              <input className="input px-2 py-1 text-sm w-32" placeholder="Pin label..." value={pinForm.label} onChange={(e) => setPinForm({ ...pinForm, label: e.target.value })} autoFocus />
              <div className="w-24">
                <CustomSelect
                  value={String(pinForm.size)}
                  onChange={(val) => setPinForm({ ...pinForm, size: Number(val) })}
                  options={PIN_SIZES.map(s => ({ value: String(s), label: `${s}px` }))}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 rounded-2xl overflow-hidden relative"
        style={{ border: '1px solid var(--border)', background: 'var(--surface)', cursor: pinMode ? 'crosshair' : isDragging ? 'grabbing' : 'grab', minHeight: '400px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleContainerClick}
        onWheel={handleWheel}
      >
        {!data.image_url ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 font-ui font-medium">No map image uploaded</div>
        ) : !imgLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 font-ui font-medium">Loading map...</div>
        ) : (
          <div
            className="absolute"
            style={{
              left: offset.x, top: offset.y, transformOrigin: '0 0', transform: `scale(${scale})`,
              width: imgRef.current?.naturalWidth, height: imgRef.current?.naturalHeight,
              backgroundImage: `url(${data.image_url})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat'
            }}
          />
        )}

        {imgLoaded && imgRef.current && pins.map(pin => {
          const px = offset.x + pin.x * imgRef.current!.naturalWidth * scale;
          const py = offset.y + pin.y * imgRef.current!.naturalHeight * scale;
          return (
            <div key={pin.id} className="absolute z-10 transition-transform hover:scale-110" style={{ left: px, top: py, transform: 'translate(-50%, -100%)' }}>
              <div className="relative group cursor-pointer filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" onClick={(e) => { e.stopPropagation(); setEditingPin(pin); setPinMode(false); }}>
                <MapPin style={{ color: pin.color, fill: pin.color, width: pin.size, height: pin.size }} />
                {pin.label && <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 text-xs font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)] whitespace-nowrap pointer-events-none">{pin.label}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {editingPin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditingPin(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card shadow-2xl space-y-4 min-w-[320px]"
              style={{ border: `2px solid ${editingPin.color}` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading font-bold text-lg">Edit Pin</h3>
                <button onClick={() => setEditingPin(null)} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
              </div>
              <div>
                <label className="label text-sm">Label</label>
                <input autoFocus className="input" value={editingPin.label} onChange={(e) => setEditingPin({ ...editingPin, label: e.target.value })} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="label text-sm">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {PIN_COLORS.map(c =>
                      <button key={c} onClick={() => setEditingPin({ ...editingPin, color: c })} className="w-8 h-8 rounded-full border-2" style={{ background: c, borderColor: editingPin.color === c ? 'white' : 'transparent' }} />
                    )}
                  </div>
                </div>
                <div>
                  <label className="label text-sm">Size</label>
                  <CustomSelect
                    value={String(editingPin.size)}
                    onChange={(val) => setEditingPin({ ...editingPin, size: Number(val) })}
                    options={PIN_SIZES.map(s => ({ value: String(s), label: `${s}px` }))}
                  />
                </div>
              </div>
              <div className="flex justify-between pt-4 mt-2 border-t border-white/10">
                <button onClick={deleteEditedPin} className="btn-ghost text-red-400 px-3 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
                <button onClick={saveEditedPin} className="btn-primary px-4 flex items-center gap-2"><Check className="w-4 h-4" /> Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}