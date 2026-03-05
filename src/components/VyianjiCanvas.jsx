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
    const [historyStep, setHistoryStep] = useState(0);
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
                setHistoryStep(0);
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

    const renderCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const s = canvas.width;
        const cellSize = s / GRID_SIZE;

        // Draw Grid if not readOnly
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

        // Draw Symbols
        placedSymbols.forEach((ps, index) => {
            const isSelected = index === selectedIndex && !readOnly;
            drawSymbol(ctx, ps, cellSize, isSelected);
        });
    };

    const drawSymbol = (ctx, ps, cellSize, isSelected) => {
        const { id, gridX, gridY, rotation, offsetX, offsetY } = ps;
        ctx.save();

        // Target center of cell
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
            case 'solid_core':
                ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'empty_core':
                ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 'vertical_line':
                ctx.moveTo(0, -cellSize * 0.5);
                ctx.lineTo(0, cellSize * 0.5);
                ctx.stroke();
                break;
            case 'horizontal_line':
                ctx.moveTo(-cellSize * 0.5, 0);
                ctx.lineTo(cellSize * 0.5, 0);
                ctx.stroke();
                break;
            case 'diag_up':
                ctx.moveTo(-cellSize * 0.5, cellSize * 0.5);
                ctx.lineTo(cellSize * 0.5, -cellSize * 0.5);
                ctx.stroke();
                break;
            case 'diag_down':
                ctx.moveTo(-cellSize * 0.5, -cellSize * 0.5);
                ctx.lineTo(cellSize * 0.5, cellSize * 0.5);
                ctx.stroke();
                break;
            case 'open_curve':
                ctx.arc(0, 0, r * 1.05, Math.PI * 0.1, Math.PI * 0.9);
                ctx.stroke();
                break;
            case 'closed_curve':
                ctx.arc(0, 0, r * 0.65, 0, Math.PI);
                ctx.stroke();
                break;
            case 'angular_form':
                ctx.moveTo(0, -r * 0.7);
                ctx.lineTo(r * 0.7, 0);
                ctx.lineTo(0, r * 0.7);
                ctx.lineTo(-r * 0.7, 0);
                ctx.closePath();
                ctx.stroke();
                break;
            case 'expanded_core':
                ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
                ctx.stroke();
                break;
            default: break;
        }
        ctx.restore();
    };

    const saveState = (newState) => {
        const nextHistory = history.slice(0, historyStep + 1);
        setHistory([...nextHistory, newState]);
        setHistoryStep(nextHistory.length);
        setPlacedSymbols(newState);
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
            const newSymbol = {
                id: selectedSymbol.id,
                gridX,
                gridY,
                rotation: 0,
                offsetX: 0,
                offsetY: 0
            };
            const newState = [...placedSymbols, newSymbol];
            saveState(newState);
            setSelectedIndex(newState.length - 1);
        }
    };

    const updateSelected = (updates) => {
        if (selectedIndex === null) return;
        const newState = placedSymbols.map((s, i) => i === selectedIndex ? { ...s, ...updates } : s);
        setPlacedSymbols(newState);
        // We don't save every minor move to history to avoid bloat, only snapshots if needed
    };

    // Save to history AFTER modification is done (on mouse up etc would be better, but let's do simple)
    const commitChange = () => {
        saveState(placedSymbols);
    };

    const rotate = () => {
        if (selectedIndex === null) return;
        const nextRot = (placedSymbols[selectedIndex].rotation + 45) % 360;
        const newState = placedSymbols.map((s, i) => i === selectedIndex ? { ...s, rotation: nextRot } : s);
        saveState(newState);
    };

    const move = (dx, dy) => {
        if (selectedIndex === null) return;
        const s = placedSymbols[selectedIndex];
        const newState = placedSymbols.map((sym, i) => i === selectedIndex ? {
            ...sym,
            offsetX: Math.max(-1, Math.min(1, s.offsetX + dx)),
            offsetY: Math.max(-1, Math.min(1, s.offsetY + dy))
        } : sym);
        saveState(newState);
    };

    const overlayDot = () => {
        if (selectedIndex === null) return;
        const s = placedSymbols[selectedIndex];
        const newDot = {
            id: 'solid_core',
            gridX: s.gridX,
            gridY: s.gridY,
            rotation: 0,
            offsetX: s.offsetX,
            offsetY: s.offsetY
        };
        const newState = [...placedSymbols, newDot];
        saveState(newState);
        setSelectedIndex(newState.length - 1);
    };

    const undo = () => {
        if (historyStep > 0) {
            setHistoryStep(historyStep - 1);
            setPlacedSymbols(history[historyStep - 1]);
            setSelectedIndex(null);
        }
    };

    const redo = () => {
        if (historyStep < history.length - 1) {
            setHistoryStep(historyStep + 1);
            setPlacedSymbols(history[historyStep + 1]);
            setSelectedIndex(null);
        }
    };

    const remove = () => {
        if (selectedIndex === null) return;
        const newState = placedSymbols.filter((_, i) => i !== selectedIndex);
        saveState(newState);
        setSelectedIndex(null);
    };

    const clear = () => {
        saveState([]);
        setSelectedIndex(null);
    };

    return (
        <div className="flex flex-col gap-4 items-center w-full">
            {/* Canvas */}
            <div className="relative group mx-auto">
                <canvas
                    ref={canvasRef}
                    width={size}
                    height={size}
                    className={`border-2 rounded-2xl bg-black/40 backdrop-blur-3xl shadow-2xl transition-all
                        ${readOnly ? 'border-transparent' : 'border-white/10 cursor-cell'}`}
                    onClick={handleCanvasClick}
                />
                {!readOnly && (
                    <div className="absolute bottom-2 left-2 text-[6px] text-white/20 uppercase tracking-[0.2em] font-black pointer-events-none">
                        7x7 Ultra Construction
                    </div>
                )}
            </div>

            {/* Layout refinements */}
            {!readOnly && (
                <div className="flex flex-col sm:flex-row items-start justify-center gap-6 w-full max-w-[600px] glass-card !p-4">

                    {/* Palette: 3 rows x 4 columns */}
                    <div className="grid grid-cols-4 gap-1.5 mx-auto sm:mx-0">
                        {/* First 8 symbols */}
                        {SYMBOLS.slice(0, 8).map(sym => (
                            <button
                                key={sym.id}
                                onClick={() => setSelectedSymbol(sym)}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg border-2 transition-all p-0
                                    ${selectedSymbol.id === sym.id ? 'border-primary bg-primary/20 text-primary' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                                title={sym.name}
                            >
                                <span className="text-base font-bold">{sym.label}</span>
                            </button>
                        ))}
                        {/* Last row: empty, sym9, sym10, empty */}
                        <div />
                        {SYMBOLS.slice(8, 10).map(sym => (
                            <button
                                key={sym.id}
                                onClick={() => setSelectedSymbol(sym)}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg border-2 transition-all p-0
                                    ${selectedSymbol.id === sym.id ? 'border-primary bg-primary/20 text-primary' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                                title={sym.name}
                            >
                                <span className="text-base font-bold">{sym.label}</span>
                            </button>
                        ))}
                        <div />
                    </div>

                    <div className="w-full h-[1px] sm:w-[1px] sm:h-24 bg-white/10 my-2 sm:my-0" />

                    {/* Editor Controls: 3x3 Grid */}
                    <div className="grid grid-cols-3 gap-1.5 mx-auto sm:mx-0">
                        {/* Row 1: Undo, Up, Redo */}
                        <button onClick={undo} disabled={historyStep === 0} className="w-9 h-9 flex items-center justify-center glass-card !rounded-lg text-text-muted hover:text-primary disabled:opacity-20"><Undo2 size={16} /></button>
                        <button onClick={() => move(0, -0.25)} className="w-9 h-9 flex items-center justify-center glass-card !rounded-lg hover:text-primary"><MoveUp size={16} /></button>
                        <button onClick={redo} disabled={historyStep === history.length - 1} className="w-9 h-9 flex items-center justify-center glass-card !rounded-lg text-text-muted hover:text-primary disabled:opacity-20"><Redo2 size={16} /></button>

                        {/* Row 2: Left, Rotate, Right */}
                        <button onClick={() => move(-0.25, 0)} className="w-9 h-9 flex items-center justify-center glass-card !rounded-lg hover:text-primary"><MoveLeft size={16} /></button>
                        <button onClick={rotate} className="w-9 h-9 flex items-center justify-center glass-card !rounded-lg border-primary/40 text-primary bg-primary/10"><RotateCw size={16} /></button>
                        <button onClick={() => move(0.25, 0)} className="w-9 h-9 flex items-center justify-center glass-card !rounded-lg hover:text-primary"><MoveRight size={16} /></button>

                        {/* Row 3: Delete, Down, Overlay Dot */}
                        <button onClick={remove} className="w-9 h-9 flex items-center justify-center glass-card !rounded-lg text-red-400 hover:bg-red-500/10 border-red-500/20"><Trash2 size={16} /></button>
                        <button onClick={() => move(0, 0.25)} className="w-9 h-9 flex items-center justify-center glass-card !rounded-lg hover:text-primary"><MoveDown size={16} /></button>
                        <button onClick={overlayDot} className="w-9 h-9 flex items-center justify-center glass-card !rounded-lg text-accent hover:bg-accent/10 border-accent/20" title="Superponer •"><Circle size={10} fill="currentColor" /></button>
                    </div>

                    <div className="w-full h-[1px] sm:w-[1px] sm:h-24 bg-white/10 my-2 sm:my-0" />

                    {/* Clear Button (Secondary) */}
                    <button onClick={clear} className="w-9 h-9 sm:h-auto sm:w-12 p-2 flex items-center justify-center glass-card !rounded-lg text-text-muted hover:text-red-400 transition-all mx-auto sm:mx-0" title="Limpiar Todo">
                        <Trash2 size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}
