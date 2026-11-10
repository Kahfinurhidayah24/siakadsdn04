import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Trash2, Check, X, Sparkles, Upload, RotateCcw } from 'lucide-react';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  studentName: string;
  initialSignature?: string;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  studentName,
  initialSignature
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [inkColor, setInkColor] = useState('#0f172a'); // Default royal dark ink

  // Setup canvas
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High resolution backing store
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = initialSignature;
    } else {
      setHasDrawn(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(initCanvas, 100);
    }
  }, [isOpen, initialSignature]);

  // Drawing handlers
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
  };

  // Generate artistic cursive signature automatically from student name
  const generateArtisticSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.strokeStyle = inkColor;
    ctx.fillStyle = inkColor;
    ctx.lineWidth = 2;

    const nameParts = studentName.trim().split(' ');
    const firstName = nameParts[0] || 'Siswa';
    const lastNameInitial = nameParts.length > 1 ? nameParts[1].charAt(0) : '';

    // Draw artistic cursive text
    ctx.save();
    ctx.font = 'italic 34px "Brush Script MT", "Caveat", "Segoe Script", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${firstName} ${lastNameInitial ? lastNameInitial + '.' : ''}`, rect.width / 2, rect.height / 2 - 5);

    // Add signature flourish stroke underneath
    ctx.beginPath();
    ctx.moveTo(rect.width * 0.2, rect.height * 0.72);
    ctx.bezierCurveTo(
      rect.width * 0.45, rect.height * 0.85,
      rect.width * 0.65, rect.height * 0.60,
      rect.width * 0.85, rect.height * 0.75
    );
    ctx.stroke();
    ctx.restore();

    setHasDrawn(true);
  };

  // Handle image upload as signature
  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
        // Draw centered and preserve aspect ratio
        const scale = Math.min((rect.width - 20) / img.width, (rect.height - 20) / img.height);
        const nw = img.width * scale;
        const nh = img.height * scale;
        const nx = (rect.width - nw) / 2;
        const ny = (rect.height - nh) / 2;
        ctx.drawImage(img, nx, ny, nw, nh);
        setHasDrawn(true);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    // Export canvas as data URL
    const signatureDataUrl = canvas.toDataURL('image/png');
    onSave(signatureDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-cream/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div 
        id="modal-digital-signature"
        className="relative w-full max-w-lg bg-cream border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200"
      >
        {/* Top Gold Accent Bar */}
        <div className="h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600" />

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif-luxury">
                  Tanda Tangan Digital Kartu Pelajar
                </h3>
                <p className="text-xs text-amber-700">
                  Untuk Siswa: {studentName}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-700">
            Tanda tangani langsung di bidang putih di bawah ini menggunakan mouse atau sentuhan jari di layar, atau klik <strong>Buat Otomatis</strong>.
          </p>

          {/* Canvas Signature Area */}
          <div className="relative rounded-2xl border-2 border-dashed border-amber-500/40 bg-white p-2 shadow-inner overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-44 rounded-xl cursor-crosshair touch-none block"
            />
            
            {/* Guide baseline */}
            <div className="absolute bottom-8 left-6 right-6 border-b border-slate-300 pointer-events-none flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>Garis Dasar Tanda Tangan (X)</span>
              <span>SDN LB 04 PAGI</span>
            </div>
          </div>

          {/* Tool actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearCanvas}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-300"
                title="Hapus gambar tanda tangan"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Hapus</span>
              </button>

              <button
                type="button"
                onClick={generateArtisticSignature}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-amber-500/40"
                title="Buat tanda tangan otomatis dari nama siswa"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Buat Otomatis</span>
              </button>

              <label className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-300">
                <Upload className="w-3.5 h-3.5 text-sky-600" />
                <span>Unggah File</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  className="hidden"
                  onChange={handleUploadSignature}
                />
              </label>
            </div>

            {/* Ink selection */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-[11px]">Warna:</span>
              <button
                type="button"
                onClick={() => setInkColor('#0f172a')}
                className={`w-5 h-5 rounded-full bg-cream border-2 transition ${inkColor === '#0f172a' ? 'border-amber-400 scale-110' : 'border-transparent'}`}
                title="Tinta Hitam Pekat"
              />
              <button
                type="button"
                onClick={() => setInkColor('#1e40af')}
                className={`w-5 h-5 rounded-full bg-blue-700 border-2 transition ${inkColor === '#1e40af' ? 'border-amber-400 scale-110' : 'border-transparent'}`}
                title="Tinta Biru Resmi"
              />
            </div>
          </div>

          {/* Modal Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              id="btn-save-signature"
              disabled={!hasDrawn}
              onClick={handleSave}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Simpan ke Kartu Pelajar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
