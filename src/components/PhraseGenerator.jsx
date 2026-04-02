import React, { useState } from 'react';
import { Plus, Send, RefreshCw, Trash2, MessageSquare, BrainCircuit, Loader2, Library } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, doc, deleteDoc } from "firebase/firestore";
import { generatePhraseFromMeaning, analyzeVyioPhrase } from '../services/aiAnalyzer';

export default function PhraseGenerator({ roots, words, prefixes = [], suffixes = [], phrases }) {
    const [filterType, setFilterType] = useState('todos'); // 'todos', 'núcleos', 'morfemas', 'morfología'
    const [phraseTitle, setPhraseTitle] = useState('');
    const [currentItems, setCurrentItems] = useState([]);

    // IA States
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState('');
    const [phraseIntent, setPhraseIntent] = useState('');
    const [isWeaving, setIsWeaving] = useState(false);

    // Mezclamos todos los elementos y les asignamos su categoría
    const allElements = [
        ...roots.map(r => ({ ...r, type: 'núcleos' })),
        ...prefixes.map(p => ({ ...p, type: 'morfemas' })),
        ...suffixes.map(s => ({ ...s, type: 'morfemas' })),
        ...words.map(w => ({ ...w, type: 'morfología' }))
    ];

    const filteredElements = filterType === 'todos'
        ? allElements
        : allElements.filter(el => el.type === filterType);

    const addToPhrase = (item) => {
        setCurrentItems([...currentItems, item]);
        setAiAnalysis(null); // Invalidar análisis anterior si agrega algo
    };

    const removeItem = (index) => {
        setCurrentItems(currentItems.filter((_, i) => i !== index));
        setAiAnalysis(null); // Invalidar análisis anterior
    };

    const handleAnalyze = async () => {
        if (currentItems.length === 0) return;
        setIsAnalyzing(true);
        setAnalysisError('');
        setAiAnalysis(null);
        try {
            const result = await analyzeVyioPhrase(currentItems);
            setAiAnalysis(result);
        } catch (err) {
            setAnalysisError(err.message || "Error al invocar al analizador IA.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleWeavePhrase = async () => {
        if (!phraseIntent) {
            alert("Escribe una intención en español para que la IA sepa qué frase construir.");
            return;
        }
        setIsWeaving(true);
        setAnalysisError('');
        try {
            const res = await generatePhraseFromMeaning(phraseIntent, allElements);
            if (res.selectedIds && Array.isArray(res.selectedIds)) {
                const newItems = res.selectedIds.map(id => allElements.find(e => e.firebaseId === id)).filter(Boolean);
                setCurrentItems(newItems);
                setAiAnalysis(null);
            }
        } catch (err) {
            setAnalysisError("Fallo tejiendo con IA: " + err.message);
        }
        setIsWeaving(false);
    };

    const savePhrase = async () => {
        if (currentItems.length > 0 && phraseTitle) {
            const vyioText = currentItems.map(i => i.vyio).join(' ');
            const spanishText = currentItems.map(i => i.spanish).join(' ');

            await addDoc(collection(db, "phrases"), {
                id: Date.now(),
                title: phraseTitle,
                vyio: vyioText,
                spanish: spanishText,
                aiAnalysis: aiAnalysis || null
            });

            setCurrentItems([]);
            setPhraseTitle('');
            setAiAnalysis(null);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1 glass-card h-fit">
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <Plus className="text-primary" size={28} /> Biblioteca
                </h2>

                <div className="mb-8">
                    <label className="text-xs uppercase tracking-[0.2em] text-text-muted font-bold block mb-4">Filtro de Biblioteca</label>
                    <div className="flex flex-wrap gap-2">
                        {['todos', 'núcleos', 'morfemas', 'morfología'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`flex-1 py-2 px-1 text-[9px] sm:text-[10px] rounded-xl border transition-all duration-300 uppercase font-black tracking-widest ${filterType === type
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'border-white/5 text-text-muted hover:bg-white/5'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {filteredElements.map((el) => (
                        <button
                            key={el.firebaseId}
                            onClick={() => addToPhrase(el)}
                            className="w-full p-4 bg-black/20 border border-white/5 rounded-2xl text-left hover:border-primary/40 hover:bg-black/40 transition-all duration-300 flex justify-between items-center group"
                        >
                            <div className="overflow-hidden">
                                <div className="text-primary font-black text-lg tracking-wider mb-1 uppercase">{el.vyio}</div>
                                <div className="text-[10px] text-text-muted font-bold uppercase tracking-tighter truncate opacity-60">{el.spanish}</div>
                            </div>
                            <Plus size={16} className="opacity-0 group-hover:opacity-100 text-primary transform group-hover:rotate-90 transition-all" />
                        </button>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-3 space-y-8">
                <div className="glass-card flex flex-col min-h-[600px] relative overflow-hidden isolate">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 -z-10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-4xl font-black gradient-text font-heading uppercase tracking-tighter">Tejido de Conceptos</h2>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || currentItems.length === 0}
                                className="nav-tab text-xs flex items-center gap-2 hover:text-primary transition-colors disabled:opacity-50"
                            >
                                {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
                                Analizar con IA
                            </button>
                            <button
                                onClick={() => { setCurrentItems([]); setAiAnalysis(null); setAnalysisError(''); }}
                                className="nav-tab text-xs flex items-center gap-2 hover:text-accent transition-colors"
                            >
                                <RefreshCw size={14} /> Reiniciar Tapiz
                            </button>
                        </div>
                    </div>

                    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.4em] text-text-muted font-black mb-3 block opacity-40">Identificador de la Crónica</label>
                            <input
                                placeholder="Introduce un título para este decreto..."
                                className="input-field text-xl py-6 border-none bg-white/5 focus:bg-white/10"
                                value={phraseTitle}
                                onChange={e => setPhraseTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.4em] text-primary font-black mb-3 flex justify-between items-center px-1">
                                <span>Intención / Significado</span>
                                <button onClick={handleWeavePhrase} disabled={isWeaving || !phraseIntent} className="text-[9px] bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-primary/40 transition-all disabled:opacity-50">
                                    {isWeaving ? <Loader2 size={12} className="animate-spin" /> : <BrainCircuit size={12} />} TEJER POR IA
                                </button>
                            </label>
                            <input
                                placeholder="Escribe lo que quieres decir en español..."
                                className="input-field text-xl py-6 border-primary/20 bg-primary/5 focus:bg-primary/10 text-primary placeholder:text-primary/30"
                                value={phraseIntent}
                                onChange={e => setPhraseIntent(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-grow p-10 border-2 border-dashed border-white/10 rounded-[3rem] flex flex-wrap gap-4 items-start content-start bg-black/30 shadow-inner group relative">
                        {currentItems.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted italic opacity-20 pointer-events-none">
                                <MessageSquare size={48} className="mb-4" />
                                <span className="text-xl font-light tracking-[0.2em]">Selecciona morfemas para tejer tu frase...</span>
                            </div>
                        )}
                        {currentItems.map((item, idx) => (
                            <div key={idx} className="px-6 py-3 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-4 group/item animate-fade-in hover:bg-primary/20 transition-all shadow-lg">
                                <span className="font-black text-xl text-primary tracking-widest uppercase">{item.vyio}</span>
                                <button onClick={() => removeItem(idx)} className="text-text-muted/40 hover:text-accent transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-10 bg-gradient-to-br from-c-purple-dark to-c-purple-obsidian border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-4 right-8 text-[10px] uppercase font-black text-primary/30 tracking-[0.5em]">Decreto Vyianóra</div>
                        <div className="text-5xl md:text-6xl font-black text-white tracking-[0.2em] text-center mb-6 leading-tight uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                            {currentItems.map(i => i.vyio).join(' ') || '... ... ...'}
                        </div>
                        <div className="text-center text-xl text-text-muted font-light italic tracking-wide border-t border-white/5 pt-6 opacity-60">
                            {aiAnalysis ? aiAnalysis.traduccionSugerida : (currentItems.map(i => i.spanish).join(' ') || 'La esencia espera ser manifestada.')}
                        </div>
                    </div>

                    {analysisError && (
                        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm italic shadow-inner">
                            {analysisError}
                        </div>
                    )}

                    {aiAnalysis && (
                        <div className="mt-8 p-8 bg-black/40 border-l-4 border-primary rounded-[2rem] animate-fade-in text-sm text-text-muted space-y-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[50px] -z-10 group-hover:bg-primary/10 transition-colors"></div>
                            <div className="flex items-center gap-3 mb-2">
                                <BrainCircuit className="text-primary" size={24} />
                                <h3 className="text-xl font-black text-white uppercase tracking-widest">Sentencia de la Razón</h3>
                                {aiAnalysis.valido ? (
                                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] rounded-lg uppercase font-black tracking-widest ml-auto border border-green-500/20">Congruente</span>
                                ) : (
                                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 text-[10px] rounded-lg uppercase font-black tracking-widest ml-auto border border-yellow-500/20">Revisión Sugerida</span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                    <span className="block text-[10px] uppercase font-black tracking-[0.2em] text-primary/60 mb-2">Traducción Acertada</span>
                                    <span className="text-white italic text-base">{aiAnalysis.traduccionSugerida}</span>
                                </div>
                                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                    <span className="block text-[10px] uppercase font-black tracking-[0.2em] text-primary/60 mb-2">Nivel / Jerarquía</span>
                                    <span className="text-white font-bold tracking-widest uppercase">{aiAnalysis.categoria}</span>
                                </div>
                            </div>

                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                <span className="block text-[10px] uppercase font-black tracking-[0.2em] text-primary/60 mb-2">Análisis de Estructura Visual</span>
                                <span className="leading-relaxed text-white/80">{aiAnalysis.analisis}</span>
                            </div>

                            <div className="bg-primary/10 border border-primary/30 p-5 rounded-2xl">
                                <span className="block text-[10px] uppercase font-black tracking-[0.2em] text-primary mb-3">Guía de Corrección Vyianóra</span>
                                <div className="space-y-3 relative isolate">
                                    <p className="flex flex-col"><strong className="text-white uppercase text-[10px] tracking-widest opacity-70 mb-1">Estructura Óptima</strong> <span className="font-bold text-white tracking-widest">{aiAnalysis.correccion}</span></p>
                                    <div className="h-px bg-primary/20 w-full" />
                                    <p className="flex flex-col"><strong className="text-white uppercase text-[10px] tracking-widest opacity-70 mb-1">Morfema Sugerido</strong> <span className="italic">{aiAnalysis.sugerenciaComplemento}</span></p>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={savePhrase}
                        disabled={!phraseTitle || currentItems.length === 0}
                        className="btn-primary w-full mt-10 py-6 text-2xl uppercase tracking-[0.2em] shadow-2xl disabled:opacity-5"
                    >
                        <Send size={24} className="mr-2" /> Consagrar Sentencia
                    </button>
                </div>

                {/* HISTORIAL DE FRASES (Crónicas Consagradas) */}
                {phrases.length > 0 && (
                    <div className="glass-card mt-8 animate-fade-in">
                        <h3 className="text-2xl font-black mb-6 uppercase tracking-widest text-primary flex items-center gap-3">
                            <Library size={24} /> Crónicas Consagradas
                        </h3>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {phrases.map(phrase => (
                                <div key={phrase.firebaseId} className="bg-black/30 border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                                        <button onClick={async () => {
                                            if (window.confirm('¿Eliminar esta sentencia?')) {
                                                await deleteDoc(doc(db, "phrases", phrase.firebaseId));
                                            }
                                        }} className="text-red-400 hover:text-red-300">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] uppercase font-black text-text-muted tracking-widest bg-white/5 px-3 py-1 rounded-full">{phrase.aiAnalysis?.valido ? 'Congruente' : 'Decreto'}</span>
                                        {phrase.aiAnalysis?.categoria && (
                                            <span className="text-[10px] uppercase font-black text-primary/80 tracking-widest">{phrase.aiAnalysis.categoria}</span>
                                        )}
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2">{phrase.title}</h4>
                                    <div className="text-3xl font-black text-primary tracking-widest uppercase mb-1">{phrase.vyio}</div>
                                    <div className="text-sm italic text-white/60 mb-4">{phrase.spanish}</div>

                                    {phrase.aiAnalysis && (
                                        <div className="mt-4 pt-4 border-t border-white/5 text-xs text-white/50 space-y-2">
                                            <p><strong className="text-primary/70">Morfología:</strong> {phrase.aiAnalysis.analisis}</p>
                                            <p><strong className="text-primary/70">Literal:</strong> {phrase.aiAnalysis.traduccionSugerida}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
