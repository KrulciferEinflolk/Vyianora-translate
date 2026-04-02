import React, { useState } from 'react';
import { Plus, Trash2, Tag, BrainCircuit, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";
import { generateLexiconItem } from '../services/aiAnalyzer';

export default function CategoryManager({ categories }) {
    const [newCategoryName, setNewCategoryName] = useState('');

    const addCategory = async () => {
        if (newCategoryName.trim()) {
            await addDoc(collection(db, "categories"), {
                name: newCategoryName.trim().toLowerCase(),
                id: Date.now()
            });
            setNewCategoryName('');
        }
    };

    const [isGenerating, setIsGenerating] = useState(false);

    const handleAutoGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await generateLexiconItem('categoria', { name: newCategoryName });
            if (res.name) setNewCategoryName(res.name);
        } catch (e) {
            alert("Error en IA: " + e.message);
        }
        setIsGenerating(false);
    };

    const removeCategory = async (firebaseId, categoryName) => {
        if (window.confirm(`¿Deseas eliminar la categoría "${categoryName}"? Las raíces con esta categoría no se borrarán, pero podrían mostrarse sin categoría.`)) {
            await deleteDoc(doc(db, "categories", firebaseId));
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1 glass-card h-fit">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <Tag className="text-primary" size={28} /> Nueva Categoría
                </h2>
                <div className="space-y-4">
                    <input
                        placeholder="Nombre (ej. magia)"
                        className="input-field"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value.toLowerCase())}
                    />
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleAutoGenerate} disabled={isGenerating} className="px-4 bg-white/5 border border-white/10 text-primary hover:bg-primary/10 rounded-2xl transition-all flex flex-col items-center justify-center gap-1">
                            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />} <span className="text-[10px] font-black uppercase">IA</span>
                        </button>
                        <button onClick={addCategory} className="btn-primary flex-1 py-4 text-lg">Guardar Categoría</button>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-3">
                <div className="glass-card h-full min-h-[500px]">
                    <h2 className="text-4xl font-bold mb-8 gradient-text font-heading flex items-center gap-3">
                        Categorías Registradas
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {categories.map(cat => (
                            <div key={cat.firebaseId} className="p-6 bg-black/30 border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-black/50 hover:border-primary/20 transition-all duration-300">
                                <div className="overflow-hidden">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-white font-black text-2xl tracking-widest capitalize">{cat.name}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeCategory(cat.firebaseId, cat.name)}
                                    className="p-3 text-text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"
                                    title="Eliminar categoría"
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
