import React, { useRef, useEffect, useState } from 'react';
import { Undo2, RotateCw, MoveUp, MoveDown, MoveLeft, MoveRight, Trash2 } from 'lucide-react';

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
                setPlacedSymbols(JSON.parse(initialData));
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
            setPlacedSymbols([...placedSymbols, newSymbol]);
            setSelectedIndex(placedSymbols.length);
        }
    };

    const updateSelected = (updates) => {
        if (selectedIndex === null) return;
        setPlacedSymbols(prev => prev.map((s, i) => i === selectedIndex ? { ...s, ...updates } : s));
    };

    const rotate = () => {
        if (selectedIndex === null) return;
        updateSelected({ rotation: (placedSymbols[selectedIndex].rotation + 45) % 360 });
    };

    const move = (dx, dy) => {
        if (selectedIndex === null) return;
        const s = placedSymbols[selectedIndex];
        updateSelected({
            offsetX: Math.max(-1, Math.min(1, s.offsetX + dx)),
            offsetY: Math.max(-1, Math.min(1, s.offsetY + dy))
        });
    };

    const undo = () => {
        if (placedSymbols.length === 0) return;
        setPlacedSymbols(prev => prev.slice(0, -1));
        setSelectedIndex(null);
    };

    const remove = () => {
        if (selectedIndex === null) return;
        setPlacedSymbols(prev => prev.filter((_, i) => i !== selectedIndex));
        setSelectedIndex(null);
    };

    const clear = () => {
        setPlacedSymbols([]);
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

            {/* Combined Horizontal Controls */}
            {!readOnly && (
                <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-[600px] glass-card !p-2">
                    {/* Palette */}
                    <div className="grid grid-cols-5 gap-1">
                        {SYMBOLS.map(sym => (
                            <button
                                key={sym.id}
                                onClick={() => setSelectedSymbol(sym)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md border transition-all
                                    ${selectedSymbol.id === sym.id ? 'border-primary bg-primary/20 text-primary' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                                title={sym.name}
                            >
                                <span className="text-sm font-bold">{sym.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="w-[1px] h-8 bg-white/10 mx-1 hidden sm:block" />

                    {/* Editor Controls */}
                    <div className="flex items-center gap-2 min-h-[40px]">
                        {selectedIndex !== null ? (
                            <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                                <div className="grid grid-cols-3 gap-0.5">
                                    <div />
                                    <button onClick={() => move(0, -0.25)} className="p-1 glass-card !rounded hover:text-primary"><MoveUp size={12} /></button>
                                    <div />
                                    <button onClick={() => move(-0.25, 0)} className="p-1 glass-card !rounded hover:text-primary"><MoveLeft size={12} /></button>
                                    <button onClick={rotate} className="p-1 glass-card !rounded border-primary/40 text-primary bg-primary/10"><RotateCw size={12} /></button>
                                    <button onClick={() => move(0.25, 0)} className="p-1 glass-card !rounded hover:text-primary"><MoveRight size={12} /></button>
                                    <div />
                                    <button onClick={() => move(0, 0.25)} className="p-1 glass-card !rounded hover:text-primary"><MoveDown size={12} /></button>
                                    <div />
                                </div>
                                <button onClick={remove} className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20" title="Eliminar">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="text-[9px] uppercase tracking-widest text-text-muted opacity-40 px-2 font-bold whitespace-nowrap">
                                Toca para editar
                            </div>
                        )}
                    </div>

                    <div className="w-[1px] h-8 bg-white/10 mx-1" />

                    {/* Global Actions */}
                    <div className="flex items-center gap-1">
                        <button onClick={undo} className="p-2 glass-card !rounded-lg text-text-muted hover:text-primary transition-all" title="Deshacer">
                            <Undo2 size={16} />
                        </button>
                        <button onClick={clear} className="p-2 glass-card !rounded-lg text-text-muted hover:text-red-400 border-white/5 bg-white/5 transition-all" title="Limpiar">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
