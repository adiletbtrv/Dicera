import { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api.js';
import { ChevronLeft, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

interface MapData {
  id: string; name: string; description?: string; image_url?: string;
  tags?: string[]; width?: number; height?: number;
}

type Pin = { x: number; y: number; label: string; color: string };
const PIN_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7'];

export function MapDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pins, setPins] = useState<Pin[]>([]);
  const [pinColor, setPinColor] = useState(PIN_COLORS[0]!);
  const [pinMode, setPinMode] = useState(false);
  const [pinLabel, setPinLabel] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['map', id],
    queryFn: () => api.get<MapData>(`/maps/${id}`),
    enabled: !!id,
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    if (imgRef.current && imgLoaded) {
      const img = imgRef.current;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const drawW = canvas.width / scale;
      const drawH = drawW / aspectRatio;
      ctx.drawImage(img, 0, 0, drawW, drawH);

      pins.forEach((pin) => {
        const px = pin.x * drawW;
        const py = pin.y * drawH;
        ctx.beginPath();
        ctx.arc(px, py, 8 / scale, 0, Math.PI * 2);
        ctx.fillStyle = pin.color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
        if (pin.label) {
          ctx.font = `${12 / scale}px sans-serif`;
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.fillText(pin.label, px, py - 12 / scale);
        }
      });
    } else if (!imgRef.current && data?.image_url) {
      ctx.fillStyle = 'rgba(139,92,246,0.05)';
      ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
      ctx.font = `${14 / scale}px sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'center';
      ctx.fillText('Loading map...', (canvas.width / scale) / 2, (canvas.height / scale) / 2);
    } else if (!data?.image_url) {
      ctx.fillStyle = 'rgba(139,92,246,0.05)';
      ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
      ctx.font = `${14 / scale}px sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'center';
      ctx.fillText('No map image uploaded', (canvas.width / scale) / 2, (canvas.height / scale) / 2);
    }

    ctx.restore();
  }, [scale, offset, pins, imgLoaded, data?.image_url]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    draw();
  }, [draw]);

  useEffect(() => {
    if (!data?.image_url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imgRef.current = img; setImgLoaded(true); };
    img.src = data.image_url;
  }, [data?.image_url]);

  function handleZoom(delta: number) {
    setScale((s) => Math.max(0.25, Math.min(5, s + delta)));
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (pinMode) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }

  function handleMouseUp() { setIsDragging(false); }

  function handleClick(e: React.MouseEvent) {
    if (!pinMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - offset.x) / scale;
    const my = (e.clientY - rect.top - offset.y) / scale;
    const img = imgRef.current;
    if (!img || !imgLoaded) return;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    const drawW = canvas.width / scale;
    const drawH = drawW / aspectRatio;
    setPins((prev) => [...prev, { x: mx / drawW, y: my / drawH, color: pinColor, label: pinLabel || `Pin ${prev.length + 1}` }]);
    setPinMode(false);
    setPinLabel('');
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    handleZoom(e.deltaY < 0 ? 0.1 : -0.1);
  }

  function handleExport() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${data?.name ?? 'map'}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }

  if (isLoading) return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading map...</div>;
  if (!data) return <div className="text-center py-12" style={{ color: 'var(--dragon)' }}>Map not found.</div>;

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-4" style={{ height: 'calc(100vh - 12rem)' }}>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate('/maps')} className="btn-ghost flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Maps
        </button>
        <h1 className="font-heading text-2xl font-bold flex-1">{data.name}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => handleZoom(0.25)} className="btn-secondary p-2"><ZoomIn className="w-4 h-4" /></button>
          <button onClick={() => handleZoom(-0.25)} className="btn-secondary p-2"><ZoomOut className="w-4 h-4" /></button>
          <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} className="btn-secondary p-2" title="Reset view"><RotateCcw className="w-4 h-4" /></button>
          <div className="flex gap-1">
            {PIN_COLORS.map((c) => (
              <button key={c} onClick={() => { setPinColor(c); setPinMode(true); }} className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110" style={{ background: c, borderColor: pinColor === c && pinMode ? 'white' : 'transparent' }} title={`Place ${c} pin`} />
            ))}
          </div>
          {pinMode && (
            <input className="input px-2 py-1 text-sm w-32" placeholder="Pin label..." value={pinLabel} onChange={(e) => setPinLabel(e.target.value)} />
          )}
          {pins.length > 0 && <button onClick={() => setPins([])} className="btn-secondary text-xs px-2">Clear Pins</button>}
          <button onClick={handleExport} className="btn-secondary p-2" title="Export as PNG"><Download className="w-4 h-4" /></button>
        </div>
        <span className="text-xs font-ui" style={{ color: 'var(--text-muted)' }}>{Math.round(scale * 100)}%</span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 rounded-2xl overflow-hidden relative"
        style={{ border: '1px solid var(--border)', background: 'var(--surface)', cursor: pinMode ? 'crosshair' : isDragging ? 'grabbing' : 'grab', minHeight: '400px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {pinMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-ui backdrop-blur-sm pointer-events-none" style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
            Click to place pin — press Esc to cancel
          </div>
        )}
        <div className="absolute bottom-3 right-3 text-xs font-ui px-3 py-1.5 rounded-lg pointer-events-none" style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.6)' }}>
          {pins.length} pin{pins.length !== 1 ? 's' : ''} &bull; scroll to zoom &bull; drag to pan
        </div>
      </div>
    </div>
  );
}
