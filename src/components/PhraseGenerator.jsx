import { db } from '../firebase';
import { collection, addDoc } from "firebase/firestore";

export default function PhraseGenerator({ roots, words, phrases }) {
    const [selectedSize, setSelectedSize] = useState('mediana');
    const [phraseTitle, setPhraseTitle] = useState('');
    const [currentItems, setCurrentItems] = useState([]);

    // Mezclamos raíces y palabras para poder usarlas en frases
    const allElements = [
        ...roots.map(r => ({ ...r, type: 'raiz' })),
        ...words.map(w => ({ ...w, type: 'palabra' }))
    ];

    const addToPhrase = (item) => {
        setCurrentItems([...currentItems, item]);
    };

    const removeItem = (index) => {
        setCurrentItems(currentItems.filter((_, i) => i !== index));
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
                size: selectedSize
            });

            setCurrentItems([]);
            setPhraseTitle('');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1 glass-card h-fit">
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <Plus className="text-primary" size={28} /> Biblioteca
                </h2>

                <div className="mb-8">
                    <label className="text-xs uppercase tracking-[0.2em] text-text-muted font-bold block mb-4">Escala de Sentencia</label>
                    <div className="flex gap-2">
                        {['pequeña', 'mediana', 'grande'].map(size => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`flex-1 py-2 text-[10px] rounded-xl border transition-all duration-300 uppercase font-black tracking-widest ${selectedSize === size
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'border-white/5 text-text-muted hover:bg-white/5'
                                    }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {allElements.map((el) => (
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
                        <button
                            onClick={() => setCurrentItems([])}
                            className="nav-tab text-xs flex items-center gap-2 hover:text-accent transition-colors"
                        >
                            <RefreshCw size={14} /> Reiniciar Tapiz
                        </button>
                    </div>

                    <div className="mb-8">
                        <label className="text-[10px] uppercase tracking-[0.4em] text-text-muted font-black mb-3 block opacity-40">Identificador de la Crónica</label>
                        <input
                            placeholder="Introduce un título para este decreto..."
                            className="input-field text-xl py-6 border-none bg-white/5 focus:bg-white/10"
                            value={phraseTitle}
                            onChange={e => setPhraseTitle(e.target.value)}
                        />
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
                            {currentItems.map(i => i.spanish).join(' ') || 'La esencia espera ser manifestada.'}
                        </div>
                    </div>

                    <button
                        onClick={savePhrase}
                        disabled={!phraseTitle || currentItems.length === 0}
                        className="btn-primary w-full mt-10 py-6 text-2xl uppercase tracking-[0.2em] shadow-2xl disabled:opacity-5"
                    >
                        <Send size={24} className="mr-2" /> Consagrar Sentencia
                    </button>
                </div>
            </div>
        </div>
    );
}
