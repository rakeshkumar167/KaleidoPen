import React, { useState, useEffect } from 'react';
import { History, Plus } from 'lucide-react';

interface ColorMixerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

const PRESET_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#2dd4bf', '#22d3ee', '#38bdf8', '#818cf8', '#a78bfa', '#c084fc', '#f472b6', '#fb7185',
  '#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a', '#0d9488', '#0891b2', '#0284c7', '#4f46e5', '#7c3aed', '#9333ea', '#c026d3', '#db2777',
  '#ffffff', '#e2e8f0', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#000000'
];

export const ColorMixer: React.FC<ColorMixerProps> = ({ currentColor, onColorChange }) => {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!history.includes(currentColor)) {
      setHistory(prev => [currentColor, ...prev].slice(0, 14));
    }
  }, [currentColor]);

  return (
    <div className="flex flex-col gap-6">
      {/* Main Color Input */}
      <div className="flex flex-col gap-3">
        <div className="relative group h-24 w-full rounded-2xl overflow-hidden shadow-inner border-2 border-zinc-800 transition-transform hover:scale-[1.02]">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="absolute -inset-2 w-[120%] h-[120%] cursor-pointer bg-transparent"
          />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus className="text-white" />
          </div>
        </div>
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-mono text-zinc-500">{currentColor.toUpperCase()}</span>
          <button 
            onClick={() => {
              const hex = Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
              onColorChange(`#${hex}`);
            }}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 uppercase tracking-tighter"
          >
            Random
          </button>
        </div>
      </div>

      {/* Preset Palette */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-1">
          <span>Palette</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onColorChange(c)}
              className={`w-full aspect-square rounded-md border border-zinc-800 transition-transform hover:scale-110 ${currentColor === c ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-900' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Recent Colors */}
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-1">
            <History size={10} />
            <span>Recent</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {history.map((c, i) => (
              <button
                key={`${c}-${i}`}
                onClick={() => onColorChange(c)}
                className="w-8 h-8 rounded-full border border-zinc-800 transition-all hover:scale-110 active:scale-95"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
