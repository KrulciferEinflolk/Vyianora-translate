import React, { useState } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";

export default function ModifierManager({ prefixes, suffixes }) {
    const [newMod, setNewMod] = useState({ vyio: '', spanish: '', type: 'prefijo' });

    const addModifier = async () => {
        if (newMod.vyio && newMod.spanish) {
            const collectionName = newMod.type === 'prefijo' ? 'prefixes' : 'suffixes';
            await addDoc(collection(db, collectionName), { ...newMod, id: Date.now() });
            setNewMod({ vyio: '', spanish: '', type: newMod.type });
        }
    };

    const removeModifier = async (firebaseId, type) => {
        if (window.confirm(`¿Deseas eliminar este ${type}?`)) {
            const collectionName = type === 'prefijo' ? 'prefixes' : 'suffixes';
            await deleteDoc(doc(db, collectionName, firebaseId));
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1 glass-card h-fit">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <Layers className="text-primary" size={28} /> Nuevo Modificador
                </h2>
                <div className="space-y-4">
                    <select
                        className="input-field"
                        value={newMod.type}
                        onChange={e => setNewMod({ ...newMod, type: e.target.value })}
                    >
                        <option value="prefijo">Prefijo (Esencia)</option>
                        <option value="sufijo">Sufijo (Función)</option>
                    </select>
                    <input
                        placeholder="Vyio (ej. vy)"
                        className="input-field"
                        value={newMod.vyio}
                        onChange={e => setNewMod({ ...newMod, vyio: e.target.value.toLowerCase() })}
                    />
                    <input
                        placeholder="Español (ej. perfección)"
                        className="input-field"
                        value={newMod.spanish}
                        onChange={e => setNewMod({ ...newMod, spanish: e.target.value })}
                    />
                    <button onClick={addModifier} className="btn-primary w-full mt-4 py-4 text-lg">Guardar Modificador</button>
                </div>
            </div>

            <div className="lg:col-span-3 space-y-10">
                <div className="glass-card">
                    <h2 className="text-2xl font-bold mb-6 text-primary flex items-center gap-3">
                        <span className="w-8 h-1 bg-primary rounded-full"></span> Prefijos
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {prefixes.map(mod => (
                            <div key={mod.id} className="p-4 bg-black/30 border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-black/50 hover:border-primary/20 transition-all duration-300">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className="text-white font-black text-xl tracking-widest">{mod.vyio}-</span>
                                    <span className="text-white/10">|</span>
                                    <span className="text-text-muted text-sm font-medium truncate uppercase tracking-tighter">{mod.spanish}</span>
                                </div>
                                <button
                                    onClick={() => removeModifier(mod.firebaseId, 'prefijo')}
                                    className="p-2 text-text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"
                                    title="Eliminar prefijo"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card">
                    <h2 className="text-2xl font-bold mb-6 text-accent flex items-center gap-3">
                        <span className="w-8 h-1 bg-accent rounded-full"></span> Sufijos
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {suffixes.map(mod => (
                            <div key={mod.firebaseId} className="p-4 bg-black/30 border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-black/50 hover:border-accent/20 transition-all duration-300">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className="text-white font-black text-xl tracking-widest">-{mod.vyio}</span>
                                    <span className="text-white/10">|</span>
                                    <span className="text-text-muted text-sm font-medium truncate uppercase tracking-tighter">{mod.spanish}</span>
                                </div>
                                <button
                                    onClick={() => removeModifier(mod.firebaseId, 'sufijo')}
                                    className="p-2 text-text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"
                                    title="Eliminar sufijo"
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
