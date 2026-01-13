
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { AppStep, UserRole } from '../types';
import Logo from './Logo';
import { ArrowRight, UploadCloud, Cpu, FileText, Zap, List } from 'lucide-react';

const Landing: React.FC<{ setStep: (step: AppStep) => void }> = ({ setStep }) => {
    const { startNewStudy, userData } = useAppContext();

    const handleStart = () => {
        startNewStudy();
        setStep(AppStep.Questionnaire);
    };

    const isRequester = userData?.role === UserRole.Requester;
    const isPrivileged = userData?.role === UserRole.Admin || userData?.role === UserRole.Reviewer;

    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] w-full max-w-6xl mx-auto animate-fade-in py-10">
            
            {/* 1. Logo Central Grande */}
            <div className="flex flex-col items-center mb-16">
                <div className="relative mb-8 group">
                    <div className="absolute inset-0 bg-blue-600 rounded-3xl blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <Logo size="xl" className="relative transform hover:scale-105 transition-transform duration-500" />
                </div>
                <h1 className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-tighter">
                    Credit IQ
                </h1>
                <p className="text-xl text-gray-400 mt-4 max-w-2xl text-center font-light">
                    Plataforma de homologación contable y análisis de riesgo financiero.
                </p>
            </div>

            {/* 2. Ejemplo Visual del Proceso */}
            <div className="w-full relative mb-20">
                <div className="hidden md:block absolute top-1/2 left-10 right-10 h-0.5 bg-gradient-to-r from-slate-800 via-purple-900/50 to-slate-800 -z-10 -translate-y-1/2"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 px-4">
                    <div className="flex flex-col items-center text-center group cursor-default">
                        <div className="w-20 h-20 bg-slate-900 border-2 border-slate-800 rounded-full flex items-center justify-center mb-6 text-purple-400 shadow-lg group-hover:border-purple-500 group-hover:text-white group-hover:bg-purple-600 transition-all duration-300 relative z-10">
                            <UploadCloud size={36} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">1. Carga Inteligente</h3>
                        <p className="text-gray-500 text-sm max-w-xs">Sube tus estados financieros y cuestionario digital.</p>
                    </div>

                    <div className="flex flex-col items-center text-center group cursor-default">
                        <div className="w-20 h-20 bg-slate-900 border-2 border-slate-800 rounded-full flex items-center justify-center mb-6 text-blue-400 shadow-lg group-hover:border-blue-500 group-hover:text-white group-hover:bg-blue-600 transition-all duration-300 relative z-10">
                            <Cpu size={36} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">2. Procesamiento IA</h3>
                        <p className="text-gray-500 text-sm max-w-xs">Homologación automática y cálculo de ratios.</p>
                    </div>

                    <div className="flex flex-col items-center text-center group cursor-default">
                        <div className="w-20 h-20 bg-slate-900 border-2 border-slate-800 rounded-full flex items-center justify-center mb-6 text-green-400 shadow-lg group-hover:border-green-500 group-hover:text-white group-hover:bg-green-600 transition-all duration-300 relative z-10">
                            <FileText size={36} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">3. Reporte Final</h3>
                        <p className="text-gray-500 text-sm max-w-xs">Dictamen de crédito y análisis descargable.</p>
                    </div>
                </div>
            </div>

            {/* 3. Botones de Acción */}
            <div className="flex flex-col items-center gap-4">
                <button 
                    onClick={handleStart}
                    className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-white transition-all duration-200 bg-purple-600 font-lg rounded-full hover:bg-purple-700 hover:shadow-[0_0_40px_-10px_rgba(147,51,234,0.5)] hover:-translate-y-1 focus:outline-none ring-offset-2 focus:ring-2 ring-purple-600 min-w-[280px]"
                >
                    <span className="mr-3 text-xl tracking-wide">INICIA ANÁLISIS</span>
                    <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                </button>

                {(isRequester || isPrivileged) && (
                    <button 
                        onClick={() => setStep(AppStep.Dashboard)}
                        className="group relative inline-flex items-center justify-center px-8 py-3 font-semibold text-gray-300 transition-all duration-200 bg-slate-800 border border-slate-700 rounded-full hover:bg-slate-700 hover:text-white hover:border-slate-500 min-w-[280px]"
                    >
                        <List className="w-5 h-5 mr-2" />
                        <span className="tracking-wide">
                            {isRequester ? "Mis solicitudes" : "Solicitudes"}
                        </span>
                    </button>
                )}

                <div className="mt-4 flex justify-center items-center gap-2 text-gray-500 text-xs uppercase tracking-widest">
                    <Zap size={12} className="text-yellow-500" />
                    <span>Powered by Gemini 2.5 Flash</span>
                </div>
            </div>
        </div>
    );
};

export default Landing;
