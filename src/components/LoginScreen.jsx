import React from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { Shield, Sparkles, LogIn } from 'lucide-react';

export default function LoginScreen({ error }) {
    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            console.error("Login Error:", err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-black">
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
                    <p className="text-white/60 text-lg font-light leading-relaxed">
                        Este espacio sagrado está protegido. <br />
                        Por favor, identifícate para continuar la crónica.
                    </p>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm animate-fade-in shadow-lg">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleLogin}
                        className="btn-primary w-full py-5 text-xl group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300"></div>
                        <span className="flex items-center justify-center gap-3">
                            <LogIn size={20} />
                            Ingresar con Google
                        </span>
                    </button>

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
