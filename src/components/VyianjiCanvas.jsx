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

    // Configuration
    const GRID_SIZE = 7;
    const STROKE_COLOR = '#8b5cf6';
    const GRID_COLOR = 'rgba(139, 92, 246, 0.1)';
    const SELECT_COLOR = '#ec4899';

    useEffect(() => {
        if (clearSignal) clear();
    }, [clearSignal]);

    useEffect(() => {
        if (initialData && typeof initialData === 'string' && initialData.startsWith('[')) {
            try {
                const data = JSON.parse(initialData);
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
    }, [placedSymbols, selectedIndex]);

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

        placedSymbols.forEach((ps, index) => {
            const isSelected = index === selectedIndex && !readOnly;
            drawSymbol(ctx, ps, cellSize, isSelected);
        });
    };

    const drawSymbol = (ctx, ps, cellSize, isSelected) => {
        const { id, gridX, gridY, rotation, offsetX, offsetY } = ps;
        ctx.save();
        const centerX = (gridX + 0.5) * cellSize + (offsetX * cellSize * 0.4);
        const centerY = (gridY + 0.5) * cellSize + (offsetY * cellSize * 0.4);
        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.strokeStyle = isSelected ? SELECT_COLOR : STROKE_COLOR;
        ctx.fillStyle = isSelected ? SELECT_COLOR : STROKE_COLOR;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 6;
        ctx.shadowColor = isSelected ? 'rgba(236, 72, 153, 0.4)' : 'rgba(139, 92, 246, 0.4)';
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
        const existingIndex = placedSymbols.findIndex(s => s.gridX === gridX && s.gridY === gridY);
        if (existingIndex !== -1) {
            setSelectedIndex(existingIndex);
        } else {
            const newSymbol = { id: selectedSymbol.id, gridX, gridY, rotation: 0, offsetX: 0, offsetY: 0 };
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
        const newRotation = (placedSymbols[selectedIndex].rotation + 45) % 360;
        const newSymbols = placedSymbols.map((s, i) => i === selectedIndex ? { ...s, rotation: newRotation } : s);
        addToHistory(newSymbols);
    };

    const move = (dx, dy) => {
        if (selectedIndex === null) return;
        const s = placedSymbols[selectedIndex];
        const newSymbols = placedSymbols.map((val, i) => i === selectedIndex ? {
            ...val,
            offsetX: Math.max(-1, Math.min(1, val.offsetX + dx)),
            offsetY: Math.max(-1, Math.min(1, val.offsetY + dy))
        } : val);
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
        addToHistory(placedSymbols.filter((_, i) => i !== selectedIndex));
        setSelectedIndex(null);
    };

    const addDotOverlay = () => {
        if (selectedIndex === null) return;
        const current = placedSymbols[selectedIndex];
        // Check if there's already a dot at this position
        const hasDot = placedSymbols.some(s => s.gridX === current.gridX && s.gridY === current.gridY && s.id === 'solid_core');
        if (!hasDot) {
            addToHistory([...placedSymbols, { id: 'solid_core', gridX: current.gridX, gridY: current.gridY, rotation: 0, offsetX: 0, offsetY: 0 }]);
        }
    };

    const clear = () => {
        addToHistory([]);
        setSelectedIndex(null);
    };

    return (
        <div className="flex flex-col gap-4 items-center w-full">
            <div className="relative group mx-auto">
                <canvas ref={canvasRef} width={size} height={size} className={`border-2 rounded-2xl bg-black/40 backdrop-blur-3xl shadow-2xl transition-all ${readOnly ? 'border-transparent' : 'border-white/10 cursor-cell'}`} onClick={handleCanvasClick} />
                {!readOnly && <div className="absolute bottom-2 left-2 text-[6px] text-white/20 uppercase tracking-[0.2em] font-black pointer-events-none">7x7 Ultra Construction</div>}
            </div>

            {!readOnly && (
                <div className="flex flex-row items-start justify-center gap-4 w-full">
                    {/* Symbol Palette 3x4 */}
                    <div className="glass-card !p-1.5 grid grid-cols-3 gap-1 h-fit">
                        {SYMBOLS.slice(0, 9).map(sym => (
                            <button key={sym.id} onClick={() => setSelectedSymbol(sym)} className={`w-7 h-7 flex items-center justify-center rounded border transition-all ${selectedSymbol.id === sym.id ? 'border-primary bg-primary/20 text-primary' : 'border-white/5 bg-white/5 hover:border-white/10'}`} title={sym.name}>
                                <span className="text-xs font-bold leading-none">{sym.label}</span>
                            </button>
                        ))}
                        <div />
                        <button onClick={() => setSelectedSymbol(SYMBOLS[9])} className={`w-7 h-7 flex items-center justify-center rounded border transition-all ${selectedSymbol.id === SYMBOLS[9].id ? 'border-primary bg-primary/20 text-primary' : 'border-white/5 bg-white/5 hover:border-white/10'}`} title={SYMBOLS[9].name}>
                            <span className="text-xs font-bold leading-none">{SYMBOLS[9].label}</span>
                        </button>
                        <div />
                    </div>

                    {/* Controls Grid 3x3 */}
                    <div className="glass-card !p-1.5 grid grid-cols-3 gap-1 h-fit">
                        {/* Row 1: Undo, Up, Redo */}
                        <button onClick={undo} className="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:text-primary transition-all" title="Deshacer"><Undo2 size={12} /></button>
                        <button onClick={() => move(0, -0.25)} className="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:text-primary transition-all"><MoveUp size={12} /></button>
                        <button onClick={redo} className="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:text-primary transition-all" title="Reventar/Rehacer"><Redo2 size={12} /></button>

                        {/* Row 2: Left, Rotate, Right */}
                        <button onClick={() => move(-0.25, 0)} className="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:text-primary transition-all"><MoveLeft size={12} /></button>
                        <button onClick={rotate} className="w-7 h-7 flex items-center justify-center rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-bold"><RotateCw size={12} /></button>
                        <button onClick={() => move(0.25, 0)} className="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:text-primary transition-all"><MoveRight size={12} /></button>

                        {/* Row 3: Delete, Down, Dot */}
                        <button onClick={remove} className="w-7 h-7 flex items-center justify-center rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" title="Borrar"><Trash2 size={12} /></button>
                        <button onClick={() => move(0, 0.25)} className="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:text-primary transition-all"><MoveDown size={12} /></button>
                        <button onClick={addDotOverlay} className="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:text-primary transition-all" title="Superponer núcleo"><Circle size={10} fill="currentColor" /></button>
                    </div>
                </div>
            )}
        </div>
    );
}
