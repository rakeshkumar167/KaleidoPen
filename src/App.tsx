import React, { useRef, useState, useEffect } from 'react';
import { 
  Eraser, 
  Download, 
  Undo2, 
  Redo2, 
  Trash2, 
  Paintbrush, 
  Settings2, 
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  Palette
} from 'lucide-react';
import { ColorMixer } from './ColorMixer';

type Layout = {
  type: 'radial' | 'kaleidoscope' | 'vertical' | 'horizontal' | 'mandala' | 'grid';
  segments: number;
  label: string;
};

const LAYOUTS: Layout[] = [
  { type: 'radial', segments: 8, label: 'Radial 8' },
  { type: 'radial', segments: 12, label: 'Radial 12' },
  { type: 'mandala', segments: 8, label: 'Mandala 8' },
  { type: 'mandala', segments: 12, label: 'Mandala 12' },
  { type: 'kaleidoscope', segments: 6, label: 'Hexagon 6' },
  { type: 'grid', segments: 1, label: 'Grid' },
  { type: 'vertical', segments: 1, label: 'Vertical' },
  { type: 'horizontal', segments: 1, label: 'Horizontal' },
];

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guidelineCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(3);
  const [opacity, setOpacity] = useState(100);
  const [softness, setSoftness] = useState(0);
  const [isEraser, setIsEraser] = useState(false);
  const [activeLayout, setActiveLayout] = useState<Layout>(LAYOUTS[0]);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  const saveToHistory = () => {
    if (!canvasRef.current) return;
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(canvasRef.current.toDataURL());
    if (newHistory.length > 30) newHistory.shift();
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
  };

  const undo = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      const img = new Image();
      img.src = history[newStep];
      img.onload = () => {
        if (context && canvasRef.current) {
          context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          context.drawImage(img, 0, 0);
        }
      };
    }
  };

  const redo = () => {
    if (currentStep < history.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      const img = new Image();
      img.src = history[newStep];
      img.onload = () => {
        if (context && canvasRef.current) {
          context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          context.drawImage(img, 0, 0);
        }
      };
    }
  };

  const drawGuidelines = () => {
    const guidelineCanvas = guidelineCanvasRef.current;
    if (!guidelineCanvas) return;
    const ctx = guidelineCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, guidelineCanvas.width, guidelineCanvas.height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;

    const centerX = guidelineCanvas.width / 2;
    const centerY = guidelineCanvas.height / 2;
    const radius = Math.max(guidelineCanvas.width, guidelineCanvas.height);

    switch (activeLayout.type) {
      case 'radial':
      case 'mandala':
        for (let i = 0; i < activeLayout.segments; i++) {
          const angle = (2 * Math.PI * i) / activeLayout.segments;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
          ctx.stroke();
        }
        break;
      case 'kaleidoscope':
        const hexRadius = 100;
        const hexHeight = hexRadius * Math.sqrt(3);
        for (let x = -centerX; x < centerX + hexRadius * 2; x += hexRadius * 1.5) {
          for (let y = -centerY; y < centerY + hexHeight; y += hexHeight) {
            const offsetX = (Math.floor(x / (hexRadius * 1.5)) % 2 === 0) ? 0 : hexHeight / 2;
            ctx.beginPath();
            for (let k = 0; k < 6; k++) {
              const angle = (Math.PI / 3) * k;
              ctx.lineTo(x + hexRadius * Math.cos(angle), y + offsetX + hexRadius * Math.sin(angle));
            }
            ctx.closePath();
            ctx.stroke();
          }
        }
        break;
      case 'vertical':
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, guidelineCanvas.height);
        ctx.stroke();
        break;
      case 'horizontal':
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(guidelineCanvas.width, centerY);
        ctx.stroke();
        break;
      case 'grid':
        const step = 100;
        for (let x = 0; x <= guidelineCanvas.width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, guidelineCanvas.height);
          ctx.stroke();
        }
        for (let y = 0; y <= guidelineCanvas.height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(guidelineCanvas.width, y);
          ctx.stroke();
        }
        break;
    }
  };

  const updateCanvasSize = () => {
    if (!canvasRef.current || !guidelineCanvasRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    guidelineCanvasRef.current.width = width;
    guidelineCanvasRef.current.height = height;
    
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      setContext(ctx);
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);

      if (history.length === 0) {
        setHistory([canvasRef.current.toDataURL()]);
        setCurrentStep(0);
      }
    }
    drawGuidelines();
  };

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    drawGuidelines();
  }, [activeLayout]);

  const getCanvasCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e: any) => {
    const coords = getCanvasCoordinates(e);
    setIsDrawing(true);
    setLastX(coords.x);
    setLastY(coords.y);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const drawMirroredLine = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    centerX: number,
    centerY: number,
    angle: number,
    mirror: boolean = false
  ) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    if (mirror) ctx.scale(1, -1);
    ctx.beginPath();
    ctx.moveTo(x1 - centerX, y1 - centerY);
    ctx.lineTo(x2 - centerX, y2 - centerY);
    ctx.stroke();
    ctx.restore();
  };

  const draw = (e: any) => {
    if (!isDrawing || !context || !canvasRef.current) return;
    const coords = getCanvasCoordinates(e);
    
    context.save();
    context.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    context.globalAlpha = opacity / 100;
    
    if (softness > 0) {
      context.shadowBlur = softness;
      context.shadowColor = color;
    }

    const centerX = canvasRef.current.width / 2;
    const centerY = canvasRef.current.height / 2;

    switch (activeLayout.type) {
      case 'radial':
        for (let i = 0; i < activeLayout.segments; i++) {
          const angle = (2 * Math.PI * i) / activeLayout.segments;
          drawMirroredLine(context, lastX, lastY, coords.x, coords.y, centerX, centerY, angle);
        }
        break;
      case 'mandala':
        for (let i = 0; i < activeLayout.segments; i++) {
          const angle = (2 * Math.PI * i) / activeLayout.segments;
          drawMirroredLine(context, lastX, lastY, coords.x, coords.y, centerX, centerY, angle, false);
          drawMirroredLine(context, lastX, lastY, coords.x, coords.y, centerX, centerY, angle, true);
        }
        break;
      case 'kaleidoscope':
        const hexRadius = 100;
        const hexHeight = hexRadius * Math.sqrt(3);
        for (let x = -centerX; x < centerX + hexRadius * 2; x += hexRadius * 1.5) {
          for (let y = -centerY; y < centerY + hexHeight; y += hexHeight) {
            const offsetX = (Math.floor(x / (hexRadius * 1.5)) % 2 === 0) ? 0 : hexHeight / 2;
            const hX = x;
            const hY = y + offsetX;
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i;
              drawMirroredLine(context, lastX, lastY, coords.x, coords.y, hX, hY, angle, false);
              drawMirroredLine(context, lastX, lastY, coords.x, coords.y, hX, hY, angle, true);
            }
          }
        }
        break;
      case 'vertical':
        context.beginPath();
        context.moveTo(lastX, lastY);
        context.lineTo(coords.x, coords.y);
        context.stroke();
        context.beginPath();
        context.moveTo(2 * centerX - lastX, lastY);
        context.lineTo(2 * centerX - coords.x, coords.y);
        context.stroke();
        break;
      case 'horizontal':
        context.beginPath();
        context.moveTo(lastX, lastY);
        context.lineTo(coords.x, coords.y);
        context.stroke();
        context.beginPath();
        context.moveTo(lastX, 2 * centerY - lastY);
        context.lineTo(coords.x, 2 * centerY - coords.y);
        context.stroke();
        break;
      case 'grid':
        const step = 200;
        for (let i = -3; i <= 3; i++) {
          for (let j = -3; j <= 3; j++) {
            context.beginPath();
            context.moveTo(lastX + i * step, lastY + j * step);
            context.lineTo(coords.x + i * step, coords.y + j * step);
            context.stroke();
          }
        }
        break;
      default:
        context.beginPath();
        context.moveTo(lastX, lastY);
        context.lineTo(coords.x, coords.y);
        context.stroke();
    }
    
    context.restore();
    setLastX(coords.x);
    setLastY(coords.y);
  };

  return (
    <div className="flex h-screen w-screen bg-zinc-950 overflow-hidden font-sans text-zinc-200">
      {/* Left Sidebar - Tools */}
      <aside className={`panel z-20 flex flex-col items-center py-6 transition-all duration-300 ${isSidebarOpen ? 'w-20' : 'w-0 overflow-hidden border-none'}`}>
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => setIsEraser(false)}
            className={`tool-btn ${!isEraser ? 'tool-btn-active' : 'tool-btn-inactive'}`}
            title="Brush"
          >
            <Paintbrush size={24} />
          </button>
          <button 
            onClick={() => setIsEraser(true)}
            className={`tool-btn ${isEraser ? 'tool-btn-active' : 'tool-btn-inactive'}`}
            title="Eraser"
          >
            <Eraser size={24} />
          </button>
          <div className="h-px bg-zinc-800 my-2" />
          <button onClick={undo} disabled={currentStep <= 0} className="tool-btn tool-btn-inactive" title="Undo">
            <Undo2 size={24} />
          </button>
          <button onClick={redo} disabled={currentStep >= history.length - 1} className="tool-btn tool-btn-inactive" title="Redo">
            <Redo2 size={24} />
          </button>
          <div className="h-px bg-zinc-800 my-2" />
          <button onClick={() => {
            if (context && canvasRef.current) {
              context.fillStyle = 'white';
              context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              saveToHistory();
            }
          }} className="tool-btn tool-btn-inactive text-red-400 hover:text-red-300" title="Clear Canvas">
            <Trash2 size={24} />
          </button>
          <button onClick={() => {
            if (canvasRef.current) {
              const link = document.createElement('a');
              link.download = 'kaleidopen.png';
              link.href = canvasRef.current.toDataURL();
              link.click();
            }
          }} className="tool-btn tool-btn-inactive text-emerald-400 hover:text-emerald-300" title="Save">
            <Download size={24} />
          </button>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="relative flex-1 flex items-center justify-center p-4 bg-zinc-950">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-1 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div ref={containerRef} className="relative w-full h-full max-w-[1200px] max-h-[900px] canvas-shadow rounded-2xl overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="absolute inset-0 touch-none cursor-crosshair"
          />
          <canvas
            ref={guidelineCanvasRef}
            className="absolute inset-0 pointer-events-none opacity-50"
          />
        </div>

        <button 
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-1 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
        >
          {isSettingsOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </main>

      {/* Right Sidebar - Settings */}
      <aside className={`panel z-20 flex flex-col p-6 transition-all duration-300 custom-scrollbar overflow-y-auto ${isSettingsOpen ? 'w-80' : 'w-0 overflow-hidden border-none p-0'}`}>
        <div className="flex flex-col gap-8">
          {/* Symmetry Selection */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-zinc-400 uppercase text-xs font-bold tracking-widest">
              <Grid3X3 size={14} />
              <span>Symmetry</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUTS.map((l) => (
                <button
                  key={l.label}
                  onClick={() => setActiveLayout(l)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    activeLayout.label === l.label 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </section>

          {/* Brush Properties */}
          <section>
            <div className="flex items-center gap-2 mb-6 text-zinc-400 uppercase text-xs font-bold tracking-widest">
              <Settings2 size={14} />
              <span>Brush Settings</span>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Size</span>
                  <span className="text-indigo-400 font-mono">{brushSize}px</span>
                </div>
                <input 
                  type="range" min="1" max="100" value={brushSize} 
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Opacity</span>
                  <span className="text-indigo-400 font-mono">{opacity}%</span>
                </div>
                <input 
                  type="range" min="1" max="100" value={opacity} 
                  onChange={(e) => setOpacity(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Softness</span>
                  <span className="text-indigo-400 font-mono">{softness}</span>
                </div>
                <input 
                  type="range" min="0" max="50" value={softness} 
                  onChange={(e) => setSoftness(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </section>

          {/* Color Picker */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-zinc-400 uppercase text-xs font-bold tracking-widest">
              <Palette size={14} />
              <span>Color</span>
            </div>
            <ColorMixer currentColor={color} onColorChange={setColor} />
          </section>
        </div>
      </aside>
    </div>
  );
}

export default App;