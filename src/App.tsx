import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Download, Minus, Plus } from 'lucide-react';

type Layout = {
  type: 'radial' | 'kaleidoscope' | 'vertical' | 'horizontal';
  segments: number;
  label: string;
};

const LAYOUTS: Layout[] = [
  { type: 'radial', segments: 8, label: 'Radial 8' },
  { type: 'radial', segments: 12, label: 'Radial 12' },
  { type: 'kaleidoscope', segments: 8, label: 'Kaleidoscope 8' },
  { type: 'kaleidoscope', segments: 12, label: 'Kaleidoscope 12' },
  { type: 'vertical', segments: 1, label: 'Vertical' },
  { type: 'horizontal', segments: 1, label: 'Horizontal' },
];

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#800000', '#008000', '#000080', '#808000',
  '#800080', '#008080', '#808080', '#C0C0C0', '#FF8080', '#80FF80',
  '#8080FF', '#FFB366', '#FF80FF', '#80FFFF', '#4D4D4D', '#999999',
  '#FF3333', '#33FF33', '#3333FF', '#FFCC00', '#FF33FF', '#33FFFF'
];

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guidelineCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [activeLayout, setActiveLayout] = useState<Layout>(LAYOUTS[0]);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const drawGuidelines = () => {
    const guidelineCanvas = guidelineCanvasRef.current;
    const mainCanvas = canvasRef.current;
    if (!guidelineCanvas || !mainCanvas) return;

    const ctx = guidelineCanvas.getContext('2d');
    if (!ctx) return;

    // Clear the guidelines
    ctx.clearRect(0, 0, guidelineCanvas.width, guidelineCanvas.height);
    
    // Set up guidelines style
    ctx.strokeStyle = '#cccccc';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;

    const centerX = Math.floor(guidelineCanvas.width / 2);
    const centerY = Math.floor(guidelineCanvas.height / 2);
    const maxLength = Math.max(guidelineCanvas.width, guidelineCanvas.height) * 2;

    switch (activeLayout.type) {
      case 'radial':
        for (let i = 0; i < activeLayout.segments; i++) {
          const angle = (2 * Math.PI * i) / activeLayout.segments;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(
            centerX + Math.cos(angle) * maxLength,
            centerY + Math.sin(angle) * maxLength
          );
          ctx.stroke();
        }
        break;

      case 'kaleidoscope':
        for (let i = 0; i < activeLayout.segments; i++) {
          const angle = (Math.PI * i) / activeLayout.segments;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(
            centerX + Math.cos(angle) * maxLength,
            centerY + Math.sin(angle) * maxLength
          );
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(guidelineCanvas.width, centerY);
        ctx.stroke();
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
    }
  };

  const updateCanvasSize = () => {
    if (!canvasRef.current || !guidelineCanvasRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Calculate the size based on the viewport while maintaining aspect ratio
    const aspectRatio = 4/3;
    const maxWidth = Math.min(containerRect.width, 800);
    const maxHeight = Math.min(window.innerHeight * 0.6, 600);
    
    let width = maxWidth;
    let height = width / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    // Round the dimensions to whole pixels
    width = Math.floor(width);
    height = Math.floor(height);
    
    // Set both canvases to the same size
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    guidelineCanvasRef.current.width = width;
    guidelineCanvasRef.current.height = height;
    
    // Set up the main canvas context
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = color;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = brushSize;
      setContext(ctx);
      
      // Set white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
    }

    // Update guidelines
    drawGuidelines();
  };

  useEffect(() => {
    updateCanvasSize();
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener('resize', updateCanvasSize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  useEffect(() => {
    if (context) {
      context.strokeStyle = color;
      context.lineWidth = brushSize;
    }
  }, [color, brushSize, context]);

  useEffect(() => {
    drawGuidelines();
  }, [activeLayout]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = Math.floor((clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((clientY - rect.top) * (canvas.height / rect.height));

    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    setIsDrawing(true);
    setLastX(coords.x);
    setLastY(coords.y);
  };

  const drawMirroredLine = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    centerX: number,
    centerY: number,
    angle: number
  ) => {
    ctx.beginPath();
    const rotatedX1 = centerX + (x1 - centerX) * Math.cos(angle) - (y1 - centerY) * Math.sin(angle);
    const rotatedY1 = centerY + (x1 - centerX) * Math.sin(angle) + (y1 - centerY) * Math.cos(angle);
    const rotatedX2 = centerX + (x2 - centerX) * Math.cos(angle) - (y2 - centerY) * Math.sin(angle);
    const rotatedY2 = centerY + (x2 - centerX) * Math.sin(angle) + (y2 - centerY) * Math.cos(angle);
    ctx.moveTo(Math.floor(rotatedX1), Math.floor(rotatedY1));
    ctx.lineTo(Math.floor(rotatedX2), Math.floor(rotatedY2));
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || !canvasRef.current) return;

    e.preventDefault(); // Prevent scrolling on touch devices
    
    const coords = getCanvasCoordinates(e);
    const centerX = Math.floor(canvasRef.current.width / 2);
    const centerY = Math.floor(canvasRef.current.height / 2);

    // Draw the main line
    context.beginPath();
    context.moveTo(lastX, lastY);
    context.lineTo(coords.x, coords.y);
    context.stroke();

    switch (activeLayout.type) {
      case 'radial':
        for (let i = 0; i < activeLayout.segments; i++) {
          const angle = (2 * Math.PI * i) / activeLayout.segments;
          drawMirroredLine(context, lastX, lastY, coords.x, coords.y, centerX, centerY, angle);
        }
        break;

      case 'kaleidoscope':
        for (let i = 0; i < activeLayout.segments; i++) {
          const angle = (Math.PI * i) / activeLayout.segments;
          drawMirroredLine(context, lastX, lastY, coords.x, coords.y, centerX, centerY, angle);
          drawMirroredLine(context, 2 * centerX - lastX, lastY, 2 * centerX - coords.x, coords.y, centerX, centerY, angle);
        }
        break;

      case 'vertical':
        context.beginPath();
        context.moveTo(2 * centerX - lastX, lastY);
        context.lineTo(2 * centerX - coords.x, coords.y);
        context.stroke();
        break;

      case 'horizontal':
        context.beginPath();
        context.moveTo(lastX, 2 * centerY - lastY);
        context.lineTo(coords.x, 2 * centerY - coords.y);
        context.stroke();
        break;
    }

    setLastX(coords.x);
    setLastY(coords.y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const downloadCanvas = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'kaleidopen-drawing.png';
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const clearCanvas = () => {
    if (context && canvasRef.current) {
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const changeLayout = (layout: Layout) => {
    setActiveLayout(layout);
    clearCanvas();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
          <div className="flex flex-col space-y-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">KaleidoPen</h1>
              <div className="flex flex-wrap gap-2 sm:gap-4">
                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                  {showColorPicker && (
                    <div className="absolute z-10 mt-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200" style={{ left: 0, width: '160px' }}>
                      <div className="grid grid-cols-5 gap-1">
                        {COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => {
                              setColor(c);
                              setShowColorPicker(false);
                            }}
                            className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Minus className="text-gray-600 w-4 h-4" />
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-24 sm:w-32"
                  />
                  <Plus className="text-gray-600 w-4 h-4" />
                </div>
                <button
                  onClick={clearCanvas}
                  className="flex items-center space-x-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <Eraser size={16} className="sm:w-5 sm:h-5" />
                  <span>Clear</span>
                </button>
                <button
                  onClick={downloadCanvas}
                  className="flex items-center space-x-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Download size={16} className="sm:w-5 sm:h-5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {LAYOUTS.map((layout) => (
                <button
                  key={`${layout.type}-${layout.segments}`}
                  onClick={() => changeLayout(layout)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg transition-colors ${
                    activeLayout.type === layout.type && activeLayout.segments === layout.segments
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {layout.label}
                </button>
              ))}
            </div>
          </div>
          
          <div ref={containerRef} className="flex justify-center relative canvas-container touch-none">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="border border-gray-300 rounded-lg shadow-inner bg-white cursor-crosshair max-w-full"
            />
            <canvas
              ref={guidelineCanvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;