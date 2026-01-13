
import React, { useState, useEffect } from 'react';
import { AppStep, Ratio, ReputationData } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateInterpretation } from '../services/geminiService';
import { ArrowRight, TrendingUp, TrendingDown, Minus, Globe, Shield, AlertTriangle, Lightbulb, ExternalLink, Loader2 } from 'lucide-react';

const mockPerformanceData = [
    { year: 2022, ingresos: 4000, costos: 2400, utilidades: 1600 },
    { year: 2023, ingresos: 4500, costos: 2800, utilidades: 1700 },
    { year: 2024, ingresos: 5200, costos: 3100, utilidades: 2100 },
];

const mockRatios = {
    liquidez: [{ name: 'Razón Circulante', value: 2.1, previousValue: 1.9, interpretation: '' }],
    solvencia: [{ name: 'Deuda a Capital', value: 0.6, previousValue: 0.7, interpretation: '' }],
    rentabilidad: [{ name: 'ROE', value: 15.2, previousValue: 12.0, interpretation: '' }, { name: 'ROA', value: 8.5, previousValue: 7.9, interpretation: '' }],
    apalancamiento: [{ name: 'Apalancamiento Financiero', value: 1.8, previousValue: 1.9, interpretation: '' }],
};

const RiskScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const getRiskColor = (s: number) => s <= 50 ? 'text-red-500' : s <= 75 ? 'text-yellow-400' : 'text-green-500';
    const getRiskLabel = (s: number) => s <= 50 ? 'Riesgo alto' : s <= 75 ? 'Riesgo medio' : 'Riesgo bajo';
    const color = getRiskColor(score);
    const label = getRiskLabel(score);

    return (
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 text-center flex flex-col items-center justify-center h-full">
            <h3 className="text-lg font-semibold text-white mb-2">Calificación de Riesgo</h3>
            <div className="relative">
                <p className={`text-6xl font-bold ${color}`}>{score}</p>
            </div>
            <p className={`font-semibold mt-2 ${color}`}>{label}</p>
        </div>
    );
};

const RatioCard: React.FC<{ ratio: Ratio }> = ({ ratio }) => {
    const diff = ratio.value - ratio.previousValue;
    const TrendIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
    const trendColor = diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-gray-400';
    
    return (
        <div className="bg-slate-800 p-4 rounded-lg">
            <div className="flex justify-between items-center">
                <span className="text-gray-300">{ratio.name}</span>
                <span className="text-xl font-bold text-white">{ratio.value}{ratio.name.includes('ROE') || ratio.name.includes('ROA') ? '%' : ''}</span>
            </div>
            <div className={`flex items-center text-sm mt-1 ${trendColor}`}>
                <TrendIcon size={16} className="mr-1" />
                {diff.toFixed(1)} vs año anterior
            </div>
            <p className="text-xs text-gray-400 mt-3 h-12 overflow-y-auto">{ratio.interpretation || "Generando interpretación..."}</p>
        </div>
    );
}

const ReputationCard: React.FC<{ reputation: ReputationData }> = ({ reputation }) => {
    const badgeColor = reputation.calificacion_reputacional === 'positiva' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                       reputation.calificacion_reputacional === 'negativa' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 
                       'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';

    return (
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 mt-8">
            <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Globe className="text-blue-400" /> Análisis Reputacional
                    <span className="text-xs font-normal text-gray-500 ml-2 border border-slate-600 rounded px-2 py-0.5">Web Scraping</span>
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border flex items-center gap-1 ${badgeColor}`}>
                    <Shield size={12} /> {reputation.calificacion_reputacional}
                </span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-1">Resumen Ejecutivo</h4>
                        <p className="text-gray-400 text-sm leading-relaxed">{reputation.resumen_reputacional}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-red-900/10 border border-red-500/20 p-3 rounded-lg">
                            <h5 className="text-red-400 text-xs font-bold uppercase flex items-center gap-1 mb-2">
                                <AlertTriangle size={12} /> Riesgos Detectados
                            </h5>
                            <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                                {reputation.riesgos.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </div>
                        <div className="bg-green-900/10 border border-green-500/20 p-3 rounded-lg">
                            <h5 className="text-green-400 text-xs font-bold uppercase flex items-center gap-1 mb-2">
                                <Lightbulb size={12} /> Oportunidades
                            </h5>
                            <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                                {reputation.oportunidades.map((o, i) => <li key={i}>{o}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                     <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Impacto en Score</h4>
                        <p className="text-white font-bold text-lg">{reputation.impacto_score_crediticio}</p>
                     </div>

                     <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Fuentes Consultadas</h4>
                        <div className="flex flex-wrap gap-2">
                            {reputation.fuentes.map((fuente, idx) => (
                                <span key={idx} className="bg-slate-700 text-gray-300 text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                    <ExternalLink size={10} /> {fuente}
                                </span>
                            ))}
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

const Analysis: React.FC<{ setStep: (step: AppStep) => void; }> = ({ setStep }) => {
    const { setAnalysisData, currentStudy } = useAppContext();
    const [isLoading, setIsLoading] = useState(true);
    const [localAnalysisData, setLocalAnalysisData] = useState<any>(null);

    useEffect(() => {
        const processAnalysis = async () => {
            setIsLoading(true);
            const score = Math.floor(Math.random() * (95 - 45 + 1) + 45);
            
            // Generate Interpretations
            const interpretedRatios = JSON.parse(JSON.stringify(mockRatios));
            const interpretationPromises: Promise<void>[] = [];

            for (const category of Object.keys(interpretedRatios)) {
              for (const ratio of interpretedRatios[category]) {
                interpretationPromises.push(
                  generateInterpretation(ratio).then(text => {
                    ratio.interpretation = text;
                  })
                );
              }
            }
            await Promise.all(interpretationPromises);

            // Use reputation data from the study if available
            const reputation = currentStudy.reputationData;

            const finalData = { 
                riskScore: score, 
                performance: mockPerformanceData, 
                ratios: interpretedRatios,
                reputation: reputation // Pass it through
            };
            
            setLocalAnalysisData(finalData);
            setAnalysisData(finalData); // Save to global context
            setIsLoading(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
        processAnalysis();
    }, [setAnalysisData, currentStudy.empresaNombre, currentStudy.reputationData]);

    if (isLoading) {
        return <div className="text-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-300">Generando análisis financiero...</p>
        </div>
    }

    return (
        <div className="animate-fade-in space-y-8 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <RiskScoreGauge score={localAnalysisData.riskScore} />
                </div>
                <div className="lg:col-span-2 bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                     <h3 className="text-lg font-semibold text-white mb-4">Gráfica de Rendimiento Anual</h3>
                     <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={localAnalysisData.performance}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="year" stroke="#94A3B8" />
                            <YAxis stroke="#94A3B8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
                            <Legend />
                            <Bar dataKey="ingresos" fill="#8B5CF6" name="Ingresos" />
                            <Bar dataKey="utilidades" fill="#6D28D9" name="Utilidad Neta" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            {/* Reputation Section */}
            {localAnalysisData.reputation ? (
                <ReputationCard reputation={localAnalysisData.reputation} />
            ) : (
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 mt-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                         <div className="relative">
                            <Globe className="text-gray-500" size={32} />
                            <Loader2 size={16} className="text-purple-500 animate-spin absolute -top-1 -right-1" />
                         </div>
                         <h3 className="text-gray-400 font-medium">Análisis Reputacional en Proceso</h3>
                         <p className="text-gray-500 text-sm max-w-md">
                            El proceso de web scraping vía Make.com se está ejecutando o no ha devuelto resultados aún. Por favor verifique más tarde.
                         </p>
                    </div>
                </div>
            )}

            <div>
                 <h3 className="text-xl font-bold text-white mb-4 mt-8">Ratios Financieros Detallados</h3>
                 {Object.entries(localAnalysisData.ratios).map(([category, ratios]) => (
                     <div key={category} className="mb-6">
                        <h4 className="font-semibold capitalize text-purple-400 mb-2">{category}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {(ratios as Ratio[]).map(ratio => <RatioCard key={ratio.name} ratio={ratio} />)}
                        </div>
                     </div>
                 ))}
            </div>

            <div className="flex justify-end mt-8">
                <button
                    onClick={() => setStep(AppStep.Report)}
                    className="bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold py-3 px-8 rounded-lg shadow-lg shadow-purple-800/20 flex items-center gap-2 hover:scale-105 transform transition-transform duration-300"
                >
                    Generar Reporte Final <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default Analysis;
