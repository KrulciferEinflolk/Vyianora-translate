import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Undo2 } from 'lucide-react';

export default function VyianjiCanvas({ onExport, clearSignal }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [points, setPoints] = useState([]);
    const [strokes, setStrokes] = useState([]);

    // Configuration
    const BRUSH_THICKNESS = 2; // Thinner as requested
    const GLOW_COLOR = 'rgba(139, 92, 246, 0.5)';
    const STROKE_COLOR = '#8b5cf6';

    useEffect(() => {
        if (clearSignal) {
            clear();
        }
    }, [clearSignal]);

    useEffect(() => {
        renderCanvas();
    }, [strokes, points]);

    const renderCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set base styles
        ctx.strokeStyle = STROKE_COLOR;
        ctx.lineWidth = BRUSH_THICKNESS;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = GLOW_COLOR;

        // Draw saved perfected strokes
        strokes.forEach(stroke => {
            drawPerfectedStroke(ctx, stroke);
        });

        // Draw current active stroke (raw)
        if (points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
        }
    };

    const drawPerfectedStroke = (ctx, stroke) => {
        ctx.beginPath();
        if (stroke.type === 'line') {
            ctx.moveTo(stroke.start.x, stroke.start.y);
            ctx.lineTo(stroke.end.x, stroke.end.y);
        } else if (stroke.type === 'circle') {
            ctx.arc(stroke.center.x, stroke.center.y, stroke.radius, 0, Math.PI * 2);
        } else if (stroke.type === 'arc') {
            ctx.arc(stroke.center.x, stroke.center.y, stroke.radius, stroke.startAngle, stroke.endAngle);
        } else if (stroke.type === 'diamond') {
            const { center, width, height } = stroke;
            ctx.moveTo(center.x, center.y - height / 2); // Top
            ctx.lineTo(center.x + width / 2, center.y); // Right
            ctx.lineTo(center.x, center.y + height / 2); // Bottom
            ctx.lineTo(center.x - width / 2, center.y); // Left
            ctx.closePath();
        } else if (stroke.type === 'dot') {
            ctx.arc(stroke.center.x, stroke.center.y, BRUSH_THICKNESS, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.stroke();
    };

    const recognizeShape = (pts) => {
        if (pts.length < 3) return { type: 'dot', center: pts[0] || { x: 0, y: 0 } };

        const start = pts[0];
        const end = pts[pts.length - 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Path length
        let pathLength = 0;
        const ptsX = pts.map(p => p.x);
        const ptsY = pts.map(p => p.y);
        const minX = Math.min(...ptsX), maxX = Math.max(...ptsX);
        const minY = Math.min(...ptsY), maxY = Math.max(...ptsY);
        const width = maxX - minX;
        const height = maxY - minY;

        for (let i = 1; i < pts.length; i++) {
            pathLength += Math.sqrt(Math.pow(pts[i].x - pts[i - 1].x, 2) + Math.pow(pts[i].y - pts[i - 1].y, 2));
        }

        // 1. Is it a Dot?
        if (pathLength < 10) return { type: 'dot', center: start };

        // 2. Is it a Line?
        // If the path is relatively straight
        if (dist / pathLength > 0.85) return { type: 'line', start, end };

        // 3. Is it a Circle or Arc?
        // Find rough centroid
        const centerX = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
        const centerY = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
        const center = { x: centerX, y: centerY };

        // Average distance to center (radius)
        const distances = pts.map(p => Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2)));
        const avgRadius = distances.reduce((sum, d) => sum + d, 0) / distances.length;

        // Variance of distances
        const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgRadius, 2), 0) / distances.length;
        const stdDev = Math.sqrt(variance);

        // If distances are consistent, it's circular
        if (stdDev / avgRadius < 0.25) {
            // Check if closed (Circle) vs open (Arc)
            if (dist < avgRadius * 0.8) {
                return { type: 'circle', center, radius: avgRadius };
            } else {
                let startAngle = Math.atan2(start.y - centerY, start.x - centerX);
                let endAngle = Math.atan2(end.y - centerY, end.x - centerX);

                // Calculate angular difference and handle wrapping
                let diff = endAngle - startAngle;
                while (diff > Math.PI) diff -= 2 * Math.PI;
                while (diff < -Math.PI) diff += 2 * Math.PI;

                const absDiff = Math.abs(diff);
                const direction = diff >= 0 ? 1 : -1;

                // Snap to 90, 180, or 270 degrees
                let snappedDiff = 0;
                if (Math.abs(absDiff - Math.PI / 2) < 0.5) snappedDiff = Math.PI / 2;      // 1/4 circle
                else if (Math.abs(absDiff - Math.PI) < 0.5) snappedDiff = Math.PI;        // 2/4 circle
                else if (Math.abs(absDiff - 1.5 * Math.PI) < 0.5) snappedDiff = 1.5 * Math.PI; // 3/4 circle

                if (snappedDiff > 0) {
                    // Snap start angle to nearest 45-degree increment for even better alignment
                    startAngle = Math.round(startAngle / (Math.PI / 4)) * (Math.PI / 4);
                    endAngle = startAngle + (direction * snappedDiff);
                }

                return { type: 'arc', center, radius: avgRadius, startAngle, endAngle };
            }
        }

        // Diamond Check
        // A diamond is a closed shape, so dist should be small relative to pathLength
        // And it should have a somewhat square-like bounding box (width ~ height)
        // This is a very basic heuristic, more advanced recognition would be needed for robustness
        if (dist < pathLength * 0.3 && Math.abs(width - height) < Math.max(width, height) * 0.3) {
            return { type: 'diamond', center, width, height };
        }

        // Default to line if nothing else fits well but is long
        return { type: 'line', start, end };
    };

    const startDrawing = (e) => {
        const { offsetX, offsetY } = getCoords(e);
        setPoints([{ x: offsetX, y: offsetY }]);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = getCoords(e);
        setPoints(prev => [...prev, { x: offsetX, y: offsetY }]);
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (points.length > 0) {
            const perfected = recognizeShape(points);
            const newStrokes = [...strokes, perfected];
            setStrokes(newStrokes);
            onExport(getCanvasDataURL(newStrokes));
        }
        setPoints([]);
    };

    const undo = () => {
        const newStrokes = strokes.slice(0, -1);
        setStrokes(newStrokes);
        onExport(newStrokes.length > 0 ? getCanvasDataURL(newStrokes) : null);
    };

    const clear = () => {
        setStrokes([]);
        setPoints([]);
        onExport(null);
    };

    const getCanvasDataURL = (currentStrokes) => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 300;
        tempCanvas.height = 300;
        const ctx = tempCanvas.getContext('2d');
        ctx.strokeStyle = STROKE_COLOR;
        ctx.lineWidth = BRUSH_THICKNESS;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = GLOW_COLOR;
        currentStrokes.forEach(s => drawPerfectedStroke(ctx, s));
        return tempCanvas.toDataURL();
    };

    const getCoords = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        return { offsetX: clientX - rect.left, offsetY: clientY - rect.top };
    };

    return (
        <div className="relative group">
            <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="border-2 border-border rounded-2xl bg-black cursor-crosshair touch-none shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button
                    onClick={undo}
                    className="p-3 bg-black/80 rounded-xl text-text-muted hover:text-primary border border-white/10 backdrop-blur-md shadow-2xl hover:scale-110 transition-all"
                    title="Deshacer trazo"
                >
                    <Undo2 size={20} />
                </button>
                <button
                    onClick={clear}
                    className="p-3 bg-black/80 rounded-xl text-text-muted hover:text-accent border border-white/10 backdrop-blur-md shadow-2xl hover:scale-110 transition-all"
                    title="Limpiar Lienzo"
                >
                    <Eraser size={20} />
                </button>
            </div>

            {/* Helpful Indicator */}
            <div className="absolute bottom-4 left-4 text-[10px] text-text-muted/30 uppercase tracking-[0.2em] font-black pointer-events-none">
                Estilete Inteligente: Line/Circle/Arc/Diamond Corregido
            </div>
        </div>
    );
}
