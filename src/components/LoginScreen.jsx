import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { Shield, Sparkles, LogIn, LogOut } from 'lucide-react';

export default function LoginScreen({ error: externalError, user }) {
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);

    const handleLogin = async () => {
        setLoading(true);
        setLocalError(null);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            console.error("Login Error:", err);
            if (err.code === 'auth/popup-blocked') {
                setLocalError("El navegador bloqueó la ventana emergente. Por favor, permite los popups.");
            } else {
                setLocalError("Error al iniciar sesión.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
        } finally {
            setLoading(false);
        }
    };

    const displayError = localError || externalError;

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-black text-white">
            {/* Animated Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] -z-10 animate-pulse delay-1000"></div>

            <div className="glass-card max-w-lg w-full p-12 text-center relative">
                <div className="mb-10 inline-flex items-center justify-center p-6 bg-gradient-to-tr from-primary to-accent rounded-[2rem] shadow-2xl shadow-primary/20 rotate-6 transform hover:rotate-0 transition-transform duration-500">
                    <Shield className="text-white" size={48} strokeWidth={1.5} />
                </div>

                <h1 className="text-5xl font-black mb-4 gradient-text tracking-tighter">VYIANÓRA</h1>
                <p className="text-text-muted text-sm uppercase tracking-[0.4em] font-bold mb-10 opacity-60">Sello de Acceso</p>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-white/60 text-lg font-light leading-relaxed">
                            {user ? `Hola, ${user.displayName || 'Viajero'}.` : 'Este espacio sagrado está protegido.'}
                        </p>
                        <p className="text-primary text-sm font-medium">
                            {user ? 'Tu acceso aún no ha sido activado en la whitelist.' : 'Por favor, identifícate para participar.'}
                        </p>
                    </div>

                    {displayError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm animate-fade-in shadow-lg">
                            {displayError}
                        </div>
                    )}

                    {user ? (
                        <div className="space-y-4">
                            <button
                                onClick={handleLogout}
                                disabled={loading}
                                className={`w-full py-5 rounded-2xl text-xl font-black transition-all flex items-center justify-center gap-3 border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-95 ${loading ? 'opacity-50' : ''}`}
                            >
                                <LogOut size={20} />
                                {loading ? 'Cerrando...' : 'Cerrar Sesión'}
                            </button>
                            <p className="text-[10px] text-text-muted/60 uppercase tracking-widest">
                                Identificado como: {user.email}
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className={`btn-primary w-full py-5 text-xl group relative overflow-hidden active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300"></div>
                            <span className="flex items-center justify-center gap-3 relative z-10">
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <LogIn size={20} />
                                )}
                                {loading ? 'Conectando...' : 'Ingresar con Google'}
                            </span>
                        </button>
                    )}

                    <div className="flex items-center justify-center gap-2 text-[10px] text-text-muted/40 uppercase tracking-widest mt-8">
                        <Sparkles size={12} />
                        <span>Arquitecturas de Concepto y Glifo</span>
                        <Sparkles size={12} />
                    </div>
                </div>
            </div>
        </div>
    );
}
