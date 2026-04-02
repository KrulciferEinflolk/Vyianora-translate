import React, { useState } from 'react';
import { Plus, Trash2, BrainCircuit, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";
import { generateLexiconItem } from '../services/aiAnalyzer';

export default function RootManager({ roots, categories }) {
    const defaultCategory = categories && categories.length > 0 ? categories[0].name : 'emoción';
    const [newRoot, setNewRoot] = useState({ vyio: '', spanish: '', category: defaultCategory });

    const addRoot = async () => {
        if (newRoot.vyio && newRoot.spanish) {
            await addDoc(collection(db, "roots"), { ...newRoot, id: Date.now() });
            setNewRoot({ vyio: '', spanish: '', category: defaultCategory });
        }
    };

    const [isGenerating, setIsGenerating] = useState(false);

    const handleAutoGenerate = async () => {
        setIsGenerating(true);
        try {
            const categoryNames = categories.map(c => c.name);
            const randomCat = categoryNames[Math.floor(Math.random() * categoryNames.length)] || newRoot.category;
            const dataToGenerate = {
                vyio: newRoot.vyio,
                spanish: newRoot.spanish,
                category: (!newRoot.vyio && !newRoot.spanish) ? randomCat : newRoot.category
            };
            const res = await generateLexiconItem('raiz', dataToGenerate, { categoriasExistentes: categoryNames });
            setNewRoot(prev => ({
                vyio: res.vyio || prev.vyio,
                spanish: res.spanish || prev.spanish,
                category: res.category && categories.some(c => c.name === res.category) ? res.category : defaultCategory
            }));
        } catch (e) {
            alert("Error en IA: " + e.message);
        }
        setIsGenerating(false);
    };

    const removeRoot = async (firebaseId) => {
        if (window.confirm('¿Eliminar esta raíz permanentemente?')) {
            await deleteDoc(doc(db, "roots", firebaseId));
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1 glass-card h-fit">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <Plus className="text-primary" size={28} /> Añadir Raíz
                </h2>
                <div className="space-y-4">
                    <input
                        placeholder="Vyio (ej. kai)"
                        className="input-field"
                        value={newRoot.vyio}
                        onChange={e => setNewRoot({ ...newRoot, vyio: e.target.value.toLowerCase() })}
                    />
                    <input
                        placeholder="Español (ej. poder)"
                        className="input-field"
                        value={newRoot.spanish}
                        onChange={e => setNewRoot({ ...newRoot, spanish: e.target.value })}
                    />
                    <select
                        className="input-field capitalize"
                        value={newRoot.category}
                        onChange={e => setNewRoot({ ...newRoot, category: e.target.value })}
                    >
                        {categories && categories.length > 0 ? (
                            categories.map(cat => (
                                <option key={cat.firebaseId} value={cat.name}>{cat.name}</option>
                            ))
                        ) : (
                            <option value="sin categoría">Sin categorías (añade una primero)</option>
                        )}
                    </select>
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleAutoGenerate} disabled={isGenerating} className="px-4 bg-white/5 border border-white/10 text-primary hover:bg-primary/10 rounded-2xl transition-all flex flex-col items-center justify-center gap-1">
                            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />} <span className="text-[10px] font-black uppercase">IA</span>
                        </button>
                        <button onClick={addRoot} className="btn-primary flex-1 py-4 text-lg">Guardar Núcleo</button>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-3">
                <div className="glass-card h-full min-h-[500px]">
                    <h2 className="text-4xl font-bold mb-8 gradient-text font-heading">Núcleos Registrados</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {roots.map(root => (
                            <div key={root.firebaseId} className="p-6 bg-black/30 border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-black/50 hover:border-primary/20 transition-all duration-300">
                                <div className="overflow-hidden">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-primary font-black text-2xl tracking-widest">{root.vyio}</span>
                                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                        <span className="text-text-muted text-sm font-medium uppercase tracking-tighter truncate">{root.spanish}</span>
                                    </div>
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-accent/60 font-bold">{root.category}</div>
                                </div>
                                <button
                                    onClick={() => removeRoot(root.firebaseId)}
                                    className="p-3 text-text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"
                                    title="Eliminar raíz"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
}
