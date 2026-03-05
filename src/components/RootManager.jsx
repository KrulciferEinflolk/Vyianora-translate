import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";

export default function RootManager({ roots }) {
    const [newRoot, setNewRoot] = useState({ vyio: '', spanish: '', category: 'emoción', contexts: '' });

    const addRoot = async () => {
        if (newRoot.vyio && newRoot.spanish) {
            await addDoc(collection(db, "roots"), { ...newRoot, id: Date.now() });
            setNewRoot({ vyio: '', spanish: '', category: 'emoción', contexts: '' });
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
                    <textarea
                        placeholder="Contextos (ej. vida, crecimiento, luz)"
                        className="input-field min-h-[100px] py-3 resize-none"
                        value={newRoot.contexts}
                        onChange={e => setNewRoot({ ...newRoot, contexts: e.target.value })}
                    />
                    <select
                        className="input-field"
                        value={newRoot.category}
                        onChange={e => setNewRoot({ ...newRoot, category: e.target.value })}
                    >
                        <option value="emoción">Emoción</option>
                        <option value="guerra">Guerra</option>
                        <option value="naturaleza">Naturaleza</option>
                        <option value="jerarquía">Jerarquía</option>
                        <option value="vínculo">Vínculo</option>
                    </select>
                    <button onClick={addRoot} className="btn-primary w-full mt-4 py-4 text-lg">Guardar Núcleo</button>
                </div>
            </div>

            <div className="lg:col-span-3">
                <div className="glass-card h-full min-h-[500px]">
                    <h2 className="text-4xl font-bold mb-8 gradient-text font-heading">Núcleos Registrados</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {roots.map(root => (
                            <div key={root.firebaseId} className="p-6 bg-black/30 border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-black/50 hover:border-primary/20 transition-all duration-300 relative overflow-hidden isolate">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="overflow-hidden flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-primary font-black text-2xl tracking-widest">{root.vyio}</span>
                                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                        <span className="text-text-muted text-sm font-medium uppercase tracking-tighter truncate">{root.spanish}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="text-[10px] uppercase tracking-[0.2em] text-accent/60 font-bold">{root.category}</div>
                                        {root.contexts && (
                                            <div className="text-[9px] italic text-text-muted/50 leading-tight line-clamp-2 mt-1 pr-4 uppercase tracking-widest">
                                                {root.contexts}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeRoot(root.firebaseId)}
                                    className="p-3 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"
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
