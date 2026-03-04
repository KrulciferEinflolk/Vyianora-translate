import { db } from '../firebase';
import { collection, addDoc } from "firebase/firestore";

export default function WordGenerator({ roots, prefixes, suffixes, words }) {
    const [selectedRoot, setSelectedRoot] = useState('');
    const [selectedPrefix, setSelectedPrefix] = useState('');
    const [selectedSuffix, setSelectedSuffix] = useState('');
    const [spanishMeaning, setSpanishMeaning] = useState('');
    const [vyioWord, setVyioWord] = useState('');
    const [canvasData, setCanvasData] = useState(null);

    useEffect(() => {
        const root = roots.find(r => r.vyio === selectedRoot)?.vyio || '';
        const prefix = prefixes.find(p => p.vyio === selectedPrefix)?.vyio || '';
        const suffix = suffixes.find(s => s.vyio === selectedSuffix)?.vyio || '';

        let word = prefix + root + suffix;
        setVyioWord(word.toLowerCase());
    }, [selectedRoot, selectedPrefix, selectedSuffix, roots, prefixes, suffixes]);

    const handleSave = async () => {
        if (vyioWord && spanishMeaning) {
            await addDoc(collection(db, "words"), {
                vyio: vyioWord,
                spanish: spanishMeaning,
                canvasData: canvasData,
                id: Date.now()
            });
            // Reset
            setSelectedRoot('');
            setSelectedPrefix('');
            setSelectedSuffix('');
            setSpanishMeaning('');
            setCanvasData(null);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4 space-y-8 h-fit">
                <div className="glass-card">
                    <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                        <Plus className="text-primary" size={28} /> Construir Morfema
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-text-muted font-bold block mb-3">Núcleo Base</label>
                            <select
                                className="input-field"
                                value={selectedRoot}
                                onChange={e => setSelectedRoot(e.target.value)}
                            >
                                <option value="">Seleccionar núcleo...</option>
                                {roots.map(r => <option key={r.id} value={r.vyio}>{(r.vyio || '').toUpperCase()} ({r.spanish})</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase tracking-[0.2em] text-text-muted font-bold block mb-3">Prefijo</label>
                                <select
                                    className="input-field"
                                    value={selectedPrefix}
                                    onChange={e => setSelectedPrefix(e.target.value)}
                                >
                                    <option value="">Ninguno</option>
                                    {prefixes.map(p => <option key={p.id} value={p.vyio}>{p.vyio}- ({p.spanish})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-[0.2em] text-text-muted font-bold block mb-3">Sufijo</label>
                                <select
                                    className="input-field"
                                    value={selectedSuffix}
                                    onChange={e => setSelectedSuffix(e.target.value)}
                                >
                                    <option value="">Ninguno</option>
                                    {suffixes.map(s => <option key={s.id} value={s.vyio}>-{s.vyio} ({s.spanish})</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs uppercase tracking-[0.2em] text-text-muted font-bold block mb-3">Significado en Español</label>
                            <input
                                placeholder="Definición del nuevo concepto..."
                                className="input-field"
                                value={spanishMeaning}
                                onChange={e => setSpanishMeaning(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={!selectedRoot || !spanishMeaning}
                            className="btn-primary w-full py-5 text-xl mt-6 disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                            Integrar a Biblioteca
                        </button>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-8">
                <div className="glass-card flex flex-col items-center justify-center min-h-[600px] text-center relative overflow-hidden isolate">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10 opacity-30"></div>

                    <div className="mb-12">
                        <div className="text-[10px] uppercase tracking-[0.5em] text-primary font-black mb-4 opacity-50">Estructura Resultante</div>
                        <div className="text-7xl md:text-9xl font-black text-white tracking-[0.1em] drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-4 uppercase">
                            {selectedPrefix && <span className="opacity-40">{selectedPrefix}</span>}
                            {selectedRoot || '...'}
                            {selectedSuffix && <span className="opacity-40">{selectedSuffix}</span>}
                        </div>
                        <div className="text-2xl text-text-muted font-light tracking-[0.2em] h-8 italic">
                            {spanishMeaning || 'Introduce un significado'}
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        <div className="relative p-8 bg-black/40 rounded-[2.5rem] border border-white/10 shadow-2xl">
                            <VyianjiCanvas onExport={setCanvasData} clearSignal={!vyioWord} />
                        </div>
                        <p className="mt-6 text-xs text-text-muted/40 uppercase tracking-[0.3em]">Traza el glifo de identidad Vyianji</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
