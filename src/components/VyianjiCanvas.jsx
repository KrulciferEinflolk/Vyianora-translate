import React, { useRef, useEffect, useState } from 'react';
import { Undo2, Redo2, RotateCw, MoveUp, MoveDown, MoveLeft, MoveRight, Trash2, Circle } from 'lucide-react';

const SYMBOLS = [
    { id: 'solid_core', label: '•', name: 'Núcleo sólido', meaning: 'esencia / existencia' },
    { id: 'empty_core', label: '◯', name: 'Núcleo vacío', meaning: 'potencial / vacío' },
    { id: 'vertical_line', label: '│', name: 'Línea vertical', meaning: 'poder / jerarquía' },
    { id: 'horizontal_line', label: '─', name: 'Línea horizontal', meaning: 'estabilidad / control' },
    { id: 'diag_up', label: '╱', name: 'Diagonal ascendente', meaning: 'acción / avance' },
    { id: 'diag_down', label: '╲', name: 'Diagonal descendente', meaning: 'consecuencia / caída' },
    { id: 'open_curve', label: '⌒', name: 'Curva abierta', meaning: 'emoción / flujo' },
    { id: 'closed_curve', label: '⌢', name: 'Curva cerrada', meaning: 'unión / contención' },
    { id: 'angular_form', label: '⟡', name: 'Forma angular', meaning: 'conflicto / ruptura' },
    { id: 'expanded_core', label: '⊙', name: 'Núcleo expandido', meaning: 'energía activa' },
];

export default function VyianjiCanvas({ onExport, clearSignal, initialData, readOnly = false, size = 300 }) {
    const canvasRef = useRef(null);
    const [placedSymbols, setPlacedSymbols] = useState([]);
    const [history, setHistory] = useState([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [activeLayer, setActiveLayer] = useState(1);

    // Configuration
    const GRID_SIZE = 7;
    const STROKE_COLOR = '#8b5cf6';
    const GRID_COLOR = 'rgba(139, 92, 246, 0.1)';
    const SELECT_COLOR = '#ec4899';
    const LAYER2_COLOR = '#3b82f6'; // Blue for layer 2

    useEffect(() => {
        if (clearSignal) clear();
    }, [clearSignal]);

    useEffect(() => {
        if (initialData && typeof initialData === 'string' && initialData.startsWith('[')) {
            try {
                const data = JSON.parse(initialData).map(s => ({ ...s, layer: s.layer || 1 })); // Ensure layer property exists
                setPlacedSymbols(data);
                setHistory([data]);
                setHistoryIndex(0);
            } catch (e) {
                console.error("Error parsing initial data as JSON", e);
            }
        }
    }, [initialData]);

    useEffect(() => {
        renderCanvas();
        if (!readOnly) {
            onExport(JSON.stringify(placedSymbols));
        }
    }, [placedSymbols, selectedIndex, activeLayer]);

    const addToHistory = (newSymbols) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newSymbols);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setPlacedSymbols(newSymbols);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            setPlacedSymbols(history[prevIndex]);
            setSelectedIndex(null);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            setPlacedSymbols(history[nextIndex]);
            setSelectedIndex(null);
        }
    };

    const renderCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const s = canvas.width;
        const cellSize = s / GRID_SIZE;

        if (!readOnly) {
            ctx.strokeStyle = GRID_COLOR;
            ctx.lineWidth = 1;
            for (let i = 1; i < GRID_SIZE; i++) {
                ctx.beginPath();
                ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, s);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, i * cellSize); ctx.lineTo(s, i * cellSize);
                ctx.stroke();
            }
        }

        // Draw Layer 1, then Layer 2
        [1, 2].forEach(layerNum => {
            placedSymbols.forEach((ps, index) => {
                if (ps.layer === layerNum) {
                    const isSelected = index === selectedIndex && !readOnly;
                    const isActiveLayer = layerNum === activeLayer;
                    drawSymbol(ctx, ps, cellSize, isSelected, isActiveLayer);
                }
            });
        });
    };

    const drawSymbol = (ctx, ps, cellSize, isSelected, isActiveLayer) => {
        const { id, gridX, gridY, rotation, offsetX, offsetY, layer } = ps;
        ctx.save();
        const centerX = (gridX + 0.5) * cellSize + (offsetX * cellSize * 0.4);
        const centerY = (gridY + 0.5) * cellSize + (offsetY * cellSize * 0.4);
        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);

        let color = layer === 1 ? STROKE_COLOR : LAYER2_COLOR;
        if (isSelected) color = SELECT_COLOR;

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = isActiveLayer ? 1 : 0.4;
        ctx.shadowBlur = isSelected ? 8 : 4;
        ctx.shadowColor = color + '66';

        const r = cellSize * 0.48;
        ctx.beginPath();
        switch (id) {
            case 'solid_core': ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2); ctx.fill(); break;
            case 'empty_core': ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2); ctx.stroke(); break;
            case 'vertical_line': ctx.moveTo(0, -cellSize * 0.5); ctx.lineTo(0, cellSize * 0.5); ctx.stroke(); break;
            case 'horizontal_line': ctx.moveTo(-cellSize * 0.5, 0); ctx.lineTo(cellSize * 0.5, 0); ctx.stroke(); break;
            case 'diag_up': ctx.moveTo(-cellSize * 0.5, cellSize * 0.5); ctx.lineTo(cellSize * 0.5, -cellSize * 0.5); ctx.stroke(); break;
            case 'diag_down': ctx.moveTo(-cellSize * 0.5, -cellSize * 0.5); ctx.lineTo(cellSize * 0.5, cellSize * 0.5); ctx.stroke(); break;
            case 'open_curve': ctx.arc(0, 0, r * 1.05, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke(); break;
            case 'closed_curve': ctx.arc(0, 0, r * 0.65, 0, Math.PI); ctx.stroke(); break;
            case 'angular_form': ctx.moveTo(0, -r * 0.7); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, r * 0.7); ctx.lineTo(-r * 0.7, 0); ctx.closePath(); ctx.stroke(); break;
            case 'expanded_core': ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.stroke(); break;
            default: break;
        }
        ctx.restore();
    };

    const handleCanvasClick = (e) => {
        if (readOnly) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
        const gridX = Math.floor((x / canvasRef.current.width) * GRID_SIZE);
        const gridY = Math.floor((y / canvasRef.current.height) * GRID_SIZE);
        if (gridX < 0 || gridX >= GRID_SIZE || gridY < 0 || gridY >= GRID_SIZE) return;

        // Find existing symbol ON THE ACTIVE LAYER
        const existingIndex = placedSymbols.findIndex(s => s.gridX === gridX && s.gridY === gridY && s.layer === activeLayer);

        if (existingIndex !== -1) {
            setSelectedIndex(existingIndex);
        } else {
            const newSymbol = { id: selectedSymbol.id, gridX, gridY, rotation: 0, offsetX: 0, offsetY: 0, layer: activeLayer };
            addToHistory([...placedSymbols, newSymbol]);
            setSelectedIndex(placedSymbols.length);
        }
    };

    const updateSelected = (updates) => {
        if (selectedIndex === null) return;
        const newSymbols = placedSymbols.map((s, i) => i === selectedIndex ? { ...s, ...updates } : s);
        setPlacedSymbols(newSymbols);
        // We don't necessarily want every tiny move to be a history step, but maybe it's cleaner. 
        // For simplicity, let's just update the current state.
    };

    // To ensure transformation steps are in history, call this on definitive action
    const saveMoveToHistory = () => addToHistory(placedSymbols);

    const rotate = () => {
        if (selectedIndex === null) return;
        const target = placedSymbols[selectedIndex];
        if (target.layer !== activeLayer) return; // Only edit active layer
        const newRotation = (target.rotation + 45) % 360;
        const newSymbols = placedSymbols.map((s, i) => i === selectedIndex ? { ...s, rotation: newRotation } : s);
        addToHistory(newSymbols);
    };

    const move = (dx, dy) => {
        if (selectedIndex === null) return;
        const target = placedSymbols[selectedIndex];
        if (target.layer !== activeLayer) return;
        const newSymbols = placedSymbols.map((s, i) => i === selectedIndex ? {
            ...s,
            offsetX: Math.max(-1, Math.min(1, s.offsetX + dx)),
            offsetY: Math.max(-1, Math.min(1, s.offsetY + dy))
        } : s);
        setPlacedSymbols(newSymbols);
        // Since user might click multiple times, history might get bloated. 
        // But the user requested "redo", so let's push to history on each click for consistency.
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newSymbols);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const remove = () => {
        if (selectedIndex === null) return;
        const target = placedSymbols[selectedIndex];
        if (target.layer !== activeLayer) return;
        addToHistory(placedSymbols.filter((_, i) => i !== selectedIndex));
        setSelectedIndex(null);
    };

    const addDotOverlay = () => {
        if (selectedIndex === null) return;
        const current = placedSymbols[selectedIndex];
        const hasDot = placedSymbols.some(s => s.gridX === current.gridX && s.gridY === current.gridY && s.id === 'solid_core' && s.layer === activeLayer);
        if (!hasDot) {
            addToHistory([...placedSymbols, { id: 'solid_core', gridX: current.gridX, gridY: current.gridY, rotation: 0, offsetX: 0, offsetY: 0, layer: activeLayer }]);
        }
    };

    const clear = () => {
        addToHistory([]);
        setSelectedIndex(null);
    };

    return (
        <div className="flex flex-col gap-4 items-center w-full">
            {/* Canvas Section */}
            <div className="relative group mx-auto">
                <canvas ref={canvasRef} width={size} height={size} className={`border-2 rounded-2xl bg-black/40 backdrop-blur-3xl shadow-2xl transition-all ${readOnly ? 'border-transparent' : 'border-white/10 cursor-cell'}`} onClick={handleCanvasClick} />
                {!readOnly && (
                    <div className="absolute top-2 right-2 flex gap-2">
                        <div className={`text-[8px] px-2 py-0.5 rounded-full border ${activeLayer === 1 ? 'border-primary bg-primary/20 text-primary' : 'border-white/10 text-white/40'}`}>LAYER 1</div>
                        <div className={`text-[8px] px-2 py-0.5 rounded-full border ${activeLayer === 2 ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-white/10 text-white/40'}`}>LAYER 2</div>
                    </div>
                )}
                {!readOnly && <div className="absolute bottom-2 left-2 text-[6px] text-white/20 uppercase tracking-[0.2em] font-black pointer-events-none">Layered Construction</div>}
            </div>

            {/* Controls Section (Horizontal Tables) */}
            {!readOnly && (
                <div className="flex flex-row items-center justify-center gap-8 w-full max-w-full overflow-x-auto py-6 px-4">
                    {/* Palette Table: 3 Wide x 10 High */}
                    <div
                        className="glass-card !p-5 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col justify-center items-center overflow-y-auto"
                        style={{ width: '180px', height: '480px' }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gap: '12px' }}>
                            {SYMBOLS.map((sym, idx) => (
                                <React.Fragment key={sym.id}>
                                    {/* Column 1: Layer 1 Selector */}
                                    <button
                                        onClick={() => setActiveLayer(1)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border text-[10px] font-black ${activeLayer === 1 ? 'border-primary bg-primary/20 text-primary shadow-lg scale-95' : 'border-white/5 bg-white/5 text-white/40'}`}
                                    >1</button>

                                    {/* Column 2: The Symbol */}
                                    <button
                                        onClick={() => setSelectedSymbol(sym)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${selectedSymbol.id === sym.id ? 'border-white/40 bg-white/20 text-white' : 'border-white/5 bg-white/5 text-white/60 hover:border-white/20'}`}
                                        title={sym.name}
                                    >
                                        <span className="text-lg font-bold">{sym.label}</span>
                                    </button>

                                    {/* Column 3: Layer 2 Selector */}
                                    <button
                                        onClick={() => setActiveLayer(2)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border text-[10px] font-black ${activeLayer === 2 ? 'border-blue-500 bg-blue-500/20 text-blue-400 shadow-lg scale-95' : 'border-white/5 bg-white/5 text-white/40'}`}
                                    >2</button>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Edition Table: 3x3 Grid (Matched size) */}
                    <div
                        className="glass-card !p-5 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col justify-center items-center"
                        style={{ width: '180px', height: '480px' }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 44px)', gap: '14px' }}>
                            {/* Row 1: Undo, ↑, Redo */}
                            <button onClick={undo} className="w-11 h-11 flex items-center justify-center rounded-2xl border border-white/5 bg-white/5 hover:text-primary transition-all active:scale-95" title="Deshacer"><Undo2 size={18} /></button>
                            <button onClick={() => move(0, -0.25)} className="w-11 h-11 flex items-center justify-center rounded-2xl border border-white/5 bg-white/5 hover:text-primary transition-all active:scale-95"><MoveUp size={18} /></button>
                            <button onClick={redo} className="w-11 h-11 flex items-center justify-center rounded-2xl border border-white/5 bg-white/5 hover:text-primary transition-all active:scale-95" title="Rehacer"><Redo2 size={18} /></button>

                            {/* Row 2: ←, Rotate, → */}
                            <button onClick={() => move(-0.25, 0)} className="w-11 h-11 flex items-center justify-center rounded-2xl border border-white/5 bg-white/5 hover:text-primary transition-all active:scale-95"><MoveLeft size={18} /></button>
                            <button onClick={rotate} className="w-11 h-11 flex items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-bold active:scale-95"><RotateCw size={18} /></button>
                            <button onClick={() => move(0.25, 0)} className="w-11 h-11 flex items-center justify-center rounded-2xl border border-white/5 bg-white/5 hover:text-primary transition-all active:scale-95"><MoveRight size={18} /></button>

                            {/* Row 3: Borrar, ↓, • Dot */}
                            <button onClick={remove} className="w-11 h-11 flex items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all active:scale-95" title="Borrar"><Trash2 size={18} /></button>
                            <button onClick={() => move(0, 0.25)} className="w-11 h-11 flex items-center justify-center rounded-2xl border border-white/5 bg-white/5 hover:text-primary transition-all active:scale-95"><MoveDown size={18} /></button>
                            <button onClick={addDotOverlay} className="w-11 h-11 flex items-center justify-center rounded-2xl border border-white/5 bg-white/5 hover:text-primary transition-all active:scale-95" title="Superponer núcleo"><Circle size={16} fill="currentColor" /></button>
                        </div>

                        <div className="mt-8 text-center animate-pulse">
                            <div className="text-[10px] uppercase tracking-widest text-white/40 font-black mb-1">Editing Layer</div>
                            <div className={`text-sm font-black tracking-widest ${activeLayer === 1 ? 'text-primary' : 'text-blue-400'}`}>0{activeLayer}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
