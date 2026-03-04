import React, { useState, useEffect } from 'react';
import LexiconManager from './components/LexiconManager';
import WordGenerator from './components/WordGenerator';
import PhraseGenerator from './components/PhraseGenerator';
import VyianjiCanvas from './components/VyianjiCanvas';
import { Download, Plus, Search, Book, PenTool, Database, Layers, MessageSquare, Library, Trash2 } from 'lucide-react';
import { exportToExcel } from './utils/ExcelExporter';
import { db } from './firebase';
import {
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    query,
    orderBy
} from "firebase/firestore";

function App() {
    const [activeTab, setActiveTab] = useState('lexicon');
    const [roots, setRoots] = useState([]);
    const [prefixes, setPrefixes] = useState([]);
    const [suffixes, setSuffixes] = useState([]);
    const [words, setWords] = useState([]);
    const [phrases, setPhrases] = useState([]);

    // Sincronización Real-time con Firebase
    useEffect(() => {
        const unsubRoots = onSnapshot(query(collection(db, "roots"), orderBy("id", "asc")), (snapshot) => {
            setRoots(snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id })));
        });

        const unsubPrefixes = onSnapshot(query(collection(db, "prefixes"), orderBy("id", "asc")), (snapshot) => {
            setPrefixes(snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id })));
        });

        const unsubSuffixes = onSnapshot(query(collection(db, "suffixes"), orderBy("id", "asc")), (snapshot) => {
            setSuffixes(snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id })));
        });

        const unsubWords = onSnapshot(query(collection(db, "words"), orderBy("id", "desc")), (snapshot) => {
            setWords(snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id })));
        });

        const unsubPhrases = onSnapshot(query(collection(db, "phrases"), orderBy("id", "desc")), (snapshot) => {
            setPhrases(snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id })));
        });

        return () => {
            unsubRoots(); unsubPrefixes(); unsubSuffixes(); unsubWords(); unsubPhrases();
        };
    }, []);

    const handleExport = () => {
        exportToExcel(roots, prefixes, suffixes, words, phrases);
    };

    return (
        <div className="min-h-screen">
            {/* Header / Nav */}
            <header className="glass-card mx-4 mt-4 py-6 px-10 flex flex-col md:flex-row justify-between items-center gap-6 sticky top-4 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-tr from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
                        <PenTool className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter gradient-text leading-none mb-1">VYIANÓRA</h1>
                        <p className="text-[10px] uppercase tracking-[0.4em] text-text-muted font-bold opacity-60">Architect of Concept & Glyph</p>
                    </div>
                </div>

                <nav className="flex items-center gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5">
                    <button onClick={() => setActiveTab('lexicon')} className={`nav-tab ${activeTab === 'lexicon' ? 'active' : ''}`}>
                        <Database size={18} /> Léxico
                    </button>
                    <button onClick={() => setActiveTab('generator')} className={`nav-tab ${activeTab === 'generator' ? 'active' : ''}`}>
                        <Plus size={18} /> Generador
                    </button>
                    <button onClick={() => setActiveTab('phrases')} className={`nav-tab ${activeTab === 'phrases' ? 'active' : ''}`}>
                        <MessageSquare size={18} /> Frases
                    </button>
                    <button onClick={() => setActiveTab('canvas')} className={`nav-tab ${activeTab === 'canvas' ? 'active' : ''}`}>
                        <Search size={18} /> Vyianji
                    </button>
                </nav>

                <button onClick={handleExport} className="btn-primary group">
                    <Download size={18} className="group-hover:bounce" />
                    Exportar Registro
                </button>
            </header>

            {/* Main Content */}
            <main className="max-w-[1800px] mx-auto p-6 md:p-12">
                <div className="animate-fade-in" key={activeTab}>
                    {activeTab === 'lexicon' && (
                        <LexiconManager
                            roots={roots} setRoots={setRoots}
                            prefixes={prefixes} setPrefixes={setPrefixes}
                            suffixes={suffixes} setSuffixes={setSuffixes}
                        />
                    )}
                    {activeTab === 'generator' && (
                        <WordGenerator
                            roots={roots} prefixes={prefixes} suffixes={suffixes}
                            words={words} setWords={setWords}
                        />
                    )}
                    {activeTab === 'phrases' && (
                        <PhraseGenerator
                            roots={roots} words={words}
                            phrases={phrases} setPhrases={setPhrases}
                        />
                    )}
                    {activeTab === 'canvas' && (
                        <div className="glass-card flex flex-col items-center">
                            <h2 className="text-4xl font-black mb-10 gradient-text font-heading">Biblioteca de Glifos</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 w-full">
                                {words.filter(w => w.canvasData).map(word => (
                                    <div key={word.id} className="library-card group">
                                        <div className="aspect-square mb-4 bg-black/40 rounded-3xl p-4 border border-white/5 flex items-center justify-center relative overflow-hidden">
                                            <VyianjiCanvas readOnly initialData={word.canvasData} size={150} />
                                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-primary font-black text-xl tracking-widest uppercase mb-1">{word.vyio}</div>
                                            <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-60">{word.spanish}</div>
                                        </div>
                                    </div>
                                ))}
                                {words.filter(w => w.canvasData).length === 0 && (
                                    <div className="col-span-full py-20 text-center text-text-muted opacity-30 italic">
                                        No hay glifos guardados en la biblioteca todavía.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;
