import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";

export default function RootManager({ roots }) {
    const defaultCategories = ['emoción', 'guerra', 'naturaleza', 'jerarquía', 'vínculo'];
    // Extract unique categories from db, combine with defaults
    const [uniqueCategories, setUniqueCategories] = useState(defaultCategories);

    useEffect(() => {
        const dbCategories = (roots || []).map(r => r.category?.toLowerCase() || 'emoción');
        const combined = [...new Set([...defaultCategories, ...dbCategories])].filter(Boolean).sort();
        setUniqueCategories(combined);
    }, [roots]);

    const [newRoot, setNewRoot] = useState({ vyio: '', spanish: '', category: 'emoción' });
    const [customCategory, setCustomCategory] = useState('');
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    const addRoot = async () => {
        if (newRoot.vyio && newRoot.spanish) {
            const finalCategory = isCustomCategory && customCategory.trim()
                ? customCategory.trim().toLowerCase()
                : newRoot.category;

            await addDoc(collection(db, "roots"), { ...newRoot, category: finalCategory, id: Date.now() });
            setNewRoot({ vyio: '', spanish: '', category: 'emoción' });
            setCustomCategory('');
            setIsCustomCategory(false);
        }
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
                    {isCustomCategory ? (
                        <div className="flex gap-2 relative">
                            <input
                                placeholder="Nueva categoría"
                                className="input-field flex-1"
                                value={customCategory}
                                onChange={e => setCustomCategory(e.target.value)}
                                autoFocus
                            />
                            <button
                                onClick={() => { setIsCustomCategory(false); setCustomCategory(''); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                                title="Cancelar categoría libre"
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <select
                            className="input-field capitalize"
                            value={newRoot.category}
                            onChange={e => {
                                if (e.target.value === 'custom') {
                                    setIsCustomCategory(true);
                                    setNewRoot({ ...newRoot, category: 'emoción' }); // fallback
                                } else {
                                    setNewRoot({ ...newRoot, category: e.target.value });
                                }
                            }}
                        >
                            {uniqueCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="custom" className="font-bold text-accent">+ Añadir nueva categoría...</option>
                        </select>
                    )}
                    <button onClick={addRoot} className="btn-primary w-full mt-4 py-4 text-lg">Guardar Núcleo</button>
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
        </div>
    );
}
