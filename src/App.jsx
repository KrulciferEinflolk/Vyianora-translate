import React, { useState, useEffect } from 'react';
import LexiconManager from './components/LexiconManager';
import WordGenerator from './components/WordGenerator';
import PhraseGenerator from './components/PhraseGenerator';
import VyianjiCanvas from './components/VyianjiCanvas';
import { Download, Plus, Search, Book, PenTool, Database, Layers, MessageSquare, Library, Trash2, LogOut } from 'lucide-react';
import { exportToExcel } from './utils/ExcelExporter';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    getDoc
} from "firebase/firestore";
import LoginScreen from './components/LoginScreen';

function App() {
    const [user, setUser] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    const [activeTab, setActiveTab] = useState('lexicon');
    const [roots, setRoots] = useState([]);
    const [prefixes, setPrefixes] = useState([]);
    const [suffixes, setSuffixes] = useState([]);
    const [words, setWords] = useState([]);
    const [phrases, setPhrases] = useState([]);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Manejo de Autenticación y Autorización
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setAuthLoading(true);
            if (currentUser) {
                // Verificar Whitelist
                try {
                    const userDoc = await getDoc(doc(db, "authorizedUsers", currentUser.email.toLowerCase()));
                    if (userDoc.exists()) {
                        setUser(currentUser);
                        setIsAuthorized(true);
                        setAuthError(null);
                    } else {
                        setUser(currentUser);
                        setIsAuthorized(false);
                        setAuthError(`El correo ${currentUser.email} no está autorizado. Pide permiso al administrador.`);
                    }
                } catch (err) {
                    console.error("Error verificando autorización:", err);
                    setAuthError("Error de conexión. Reintentando...");
                    setIsAuthorized(false);
                }
            } else {
                setUser(null);
                setIsAuthorized(false);
                setAuthError(null);
            }
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Sincronización Real-time con Firebase (Solo si está autorizado)
    useEffect(() => {
        if (!isAuthorized) {
            // Clear data if not authorized
            setRoots([]);
            setPrefixes([]);
            setSuffixes([]);
            setWords([]);
            setPhrases([]);
            return;
        }

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
    }, [isAuthorized]); // Re-run when authorization status changes

    const handleExport = () => {
        exportToExcel(roots, prefixes, suffixes, words, phrases);
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setIsAuthorized(false);
            setAuthError(null);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin text-primary"></div>
            </div>
        );
    }

    if (!user || !isAuthorized) {
        return <LoginScreen error={authError} user={user} />;
    }

    return (
        <div className="min-h-screen animate-fade-in">
            {/* Header / Nav */}
            <header className="glass-card mx-4 mt-4 py-6 px-10 flex flex-col xl:flex-row justify-between items-center gap-6 sticky top-4 z-50">
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

                <div className="flex items-center gap-4">
                    <button onClick={handleExport} className="btn-primary group !py-3">
                        <Download size={18} className="group-hover:bounce" />
                        Exportar
                    </button>
                </div>
            </header>

            {/* Profile Floating Menu */}
            <div className="fixed top-8 right-8 z-[100] flex flex-col items-end">
                <div className="relative flex items-center gap-3">
                    {showUserMenu && (
                        <div className="flex items-center bg-black/60 backdrop-blur-xl border border-white/10 py-2 px-4 rounded-full shadow-2xl animate-in fade-in slide-in-from-right-4 duration-300">
                            <button
                                onClick={() => signOut(auth)}
                                className="text-[10px] uppercase tracking-[0.2em] font-black text-red-400 hover:text-red-300 transition-colors"
                            >
                                Salir
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className={`w-14 h-14 rounded-full border-2 transition-all duration-300 overflow-hidden shadow-xl
                            ${showUserMenu ? 'border-primary ring-4 ring-primary/20 scale-110' : 'border-white/10 hover:border-primary/40'}`}
                    >
                        <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                    </button>
                </div>
            </div>
            {/* ... rest of main content ... */}

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
