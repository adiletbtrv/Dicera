import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api.js';
import { Map as MapIcon, ChevronLeft, Upload, Check, Image } from 'lucide-react';

export function MapUploaderPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setError('File too large (max 10MB)');
      return;
    }
    setFile(f);
    setError(null);
    const url = URL.createObjectURL(f);
    const img = new window.Image();
    img.onload = () => {
      const MAX_WIDTH = 1920;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Compress heavily as webp
        const compressed = canvas.toDataURL('image/webp', 0.8);
        setPreview(compressed);
      } else {
        setError('Canvas not supported');
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setError('Invalid image file');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !preview || !file) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to read image'));
        img.src = preview!;
      });

      // Convert local DataURL preview into a Blob
      const resBlob = await fetch(preview);
      const blob = await resBlob.blob();

      const formData = new FormData();
      formData.append('image', blob, file.name.replace(/\.[^/.]+$/, "") + '.webp');
      formData.append('name', name);
      formData.append('width_px', img.naturalWidth.toString());
      formData.append('height_px', img.naturalHeight.toString());
      formData.append('grid_size_px', '50');
      formData.append('grid_enabled', 'true');

      await api.post('/maps', formData);
      navigate('/maps');
    } catch (err: any) {
      setError(err?.message || 'Failed to save map');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/maps')} className="btn-ghost mb-4 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Maps
      </button>
      <div className="flex items-center gap-3 mb-6">
        <MapIcon className="w-8 h-8" style={{ color: 'var(--accent)' }} />
        <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Upload Map</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="label">Map Title</label>
          <input required type="text" className="input" placeholder="e.g. The Drunken Dragon Inn" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div>
          <label className="label">Map Image</label>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
          
          {preview ? (
            <div className="relative rounded-xl overflow-hidden border border-[var(--border-strong)] cursor-pointer group" onClick={() => fileRef.current?.click()}>
              <img src={preview} alt="Map preview" className="w-full max-h-[400px] object-contain bg-[var(--bg3)]" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white font-ui font-medium">Click to replace</p>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-xl py-12 flex flex-col items-center justify-center transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border-strong)', background: 'var(--surface-raised)' }}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'var(--border-strong)';
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile) {
                  const fakeEvent = { target: { files: [droppedFile] } } as any;
                  handleFileChange(fakeEvent);
                }
              }}
            >
              <Upload className="w-10 h-10 mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-medium font-ui" style={{ color: 'var(--text-secondary)' }}>Click to upload or drag and drop</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>JPG, PNG, WEBP (Max 10MB)</p>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(239,68,68,.1)', color: 'var(--red2)', border: '1px solid rgba(239,68,68,.3)' }}>
            {error}
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={isSubmitting || !name.trim() || !preview} className="btn-primary flex items-center gap-2">
            <Check className="w-4 h-4" /> {isSubmitting ? 'Uploading...' : 'Save Map'}
          </button>
        </div>
      </form>
    </div>
  );
}
