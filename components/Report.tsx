
import React, { useRef } from 'react';
import { AppStep } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { generatePdf } from '../services/pdfService';
import Logo from './Logo';
import { Download, Mail, RotateCw, Globe, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ReportPreview: React.FC = () => {
    const { currentStudy, analysisData } = useAppContext();

    if (!analysisData || !currentStudy.questionnaire) {
        return <div>Faltan datos para generar el reporte.</div>;
    }
    
    const { questionnaire } = currentStudy;
    const { reputation } = analysisData;

    const getRiskColor = (s: number) => s <= 50 ? 'text-red-500' : s <= 75 ? 'text-yellow-400' : 'text-green-500';
    const riskColor = getRiskColor(analysisData.riskScore);

    return (
        <div className="bg-white text-gray-800 p-8 rounded-lg shadow-2xl max-w-[210mm] mx-auto min-h-[297mm]">
            {/* Portada */}
            <div className="text-center border-b-2 border-gray-200 pb-6 mb-6">
                <div className="flex justify-center mb-4">
                    <Logo size="lg" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Reporte de Análisis Crediticio</h1>
                <h2 className="text-2xl font-semibold text-purple-800 mt-2">{questionnaire.datosGenerales.nombreEmpresa}</h2>
                <div className="mt-4 flex justify-center items-center gap-4">
                    <div>
                        <span className="text-lg block text-gray-500 text-sm">Score Financiero</span>
                        <span className={`text-4xl font-bold ${riskColor}`}>{analysisData.riskScore}</span>
                    </div>
                    {reputation && (
                        <div className="border-l pl-4 border-gray-300">
                             <span className="text-lg block text-gray-500 text-sm">Reputación</span>
                             <span className={`text-lg font-bold uppercase ${reputation.calificacion_reputacional === 'positiva' ? 'text-green-600' : reputation.calificacion_reputacional === 'negativa' ? 'text-red-600' : 'text-yellow-600'}`}>
                                {reputation.calificacion_reputacional}
                             </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Resumen Ejecutivo */}
            <div className="mb-8">
                <h3 className="text-xl font-bold mb-2 text-purple-800 border-b border-purple-200 pb-1">Resumen Ejecutivo</h3>
                <p className="text-gray-600 text-justify text-sm leading-relaxed">
                    El presente reporte detalla el análisis crediticio de {questionnaire.datosGenerales.nombreEmpresa},
                    resultando en una calificación de riesgo de {analysisData.riskScore}. El análisis integra información financiera histórica
                    y un análisis reputacional externo, evaluando liquidez, solvencia, rentabilidad y presencia en medios.
                </p>
            </div>

            {/* Reputational Analysis Section */}
            {reputation && (
                <div className="mb-8 bg-gray-50 p-5 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold mb-3 text-blue-800 flex items-center gap-2">
                        <Globe size={18} /> Análisis Reputacional (Web Scraping)
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">{reputation.resumen_reputacional}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                            <h4 className="text-xs font-bold text-red-600 uppercase flex items-center gap-1 mb-1">
                                <AlertTriangle size={12}/> Riesgos
                            </h4>
                            <ul className="list-disc list-inside text-xs text-gray-600">
                                {reputation.riesgos.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-green-600 uppercase flex items-center gap-1 mb-1">
                                <Lightbulb size={12}/> Oportunidades
                            </h4>
                            <ul className="list-disc list-inside text-xs text-gray-600">
                                {reputation.oportunidades.map((o, i) => <li key={i}>{o}</li>)}
                            </ul>
                        </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 border-t border-gray-200 pt-2 flex flex-wrap gap-2">
                        <span className="font-semibold">Fuentes:</span>
                        {reputation.fuentes.join(', ')}
                    </div>
                </div>
            )}

            {/* Información de la Solicitud */}
            <div className="mb-8">
                <h3 className="text-xl font-bold mb-2 text-purple-800 border-b border-purple-200 pb-1">Información de la Solicitud</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded text-sm">
                    <p><strong>Monto Solicitado:</strong> ${questionnaire.solicitud.monto.toLocaleString('es-MX')}</p>
                    <p><strong>Plazo:</strong> {questionnaire.solicitud.plazo} meses</p>
                    <p><strong>Garantía:</strong> {questionnaire.solicitud.garantia}</p>
                    <p><strong>Tasa Nominal:</strong> {questionnaire.solicitud.tasaNominal}%</p>
                </div>
            </div>

             {/* Gráficos y Ratios */}
            <div className="mb-6">
                <h3 className="text-xl font-bold mb-4 text-purple-800 border-b border-purple-200 pb-1">Análisis Financiero</h3>
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="font-semibold text-center mb-2 text-sm">Rendimiento Anual</h4>
                    <ResponsiveContainer width="100%" height={200}>
                         <BarChart data={analysisData.performance}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis />
                            <Legend />
                            <Bar dataKey="ingresos" fill="#8B5CF6" name="Ingresos" />
                            <Bar dataKey="utilidades" fill="#6D28D9" name="Utilidad" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {Object.entries(analysisData.ratios).map(([category, ratios]) => (
                        <div key={category} className="mb-2 break-inside-avoid">
                            <h4 className="font-bold capitalize text-purple-700 text-sm border-b border-purple-100 mb-1">{category}</h4>
                            {(ratios as any[]).map(ratio => (
                                <div key={ratio.name} className="ml-0 mt-2">
                                    <div className="flex justify-between items-baseline">
                                        <p className="text-xs font-bold text-gray-800">{ratio.name}</p>
                                        <p className="text-xs font-mono">{ratio.value}{ratio.name.includes('ROE') || ratio.name.includes('ROA') ? '%' : ''}</p>
                                    </div>
                                    <p className="text-[10px] text-gray-500 italic leading-tight">"{ratio.interpretation}"</p>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Conclusión */}
            <div className="mt-8 pt-4 border-t-2 border-gray-200">
                <h3 className="text-xl font-bold mb-2 text-purple-800">Conclusión y Recomendaciones</h3>
                <p className="text-gray-600 text-sm text-justify">
                    Considerando el score de {analysisData.riskScore} y la calificación reputacional <strong>{reputation?.calificacion_reputacional}</strong>, 
                    se recomienda {analysisData.riskScore > 70 ? 'APROBAR' : 'REVISAR CON CAUTELA'} la solicitud. 
                    {analysisData.riskScore > 70 
                        ? 'La empresa muestra solidez financiera y buena reputación de mercado.' 
                        : 'Existen riesgos financieros o reputacionales que requieren mitigación mediante garantías adicionales.'}
                </p>
            </div>
        </div>
    );
};


const Report: React.FC<{ setStep: (step: AppStep) => void; onReset: () => void; }> = ({ setStep, onReset }) => {
    const reportRef = useRef<HTMLDivElement>(null);

    const handleDownload = () => {
        if (reportRef.current) {
            generatePdf(reportRef.current, "Reporte_CreditIQ.pdf");
        }
    };

    return (
        <div className="animate-fade-in pb-10">
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-grow overflow-x-auto">
                    <div ref={reportRef} className="min-w-[800px]">
                        <ReportPreview />
                    </div>
                </div>
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 space-y-4 sticky top-6">
                         <h3 className="text-lg font-semibold text-white">Opciones</h3>
                         <button onClick={handleDownload} className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg">
                            <Download size={18} /> Descargar PDF
                         </button>
                         <button className="w-full bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-600 transition-colors">
                            <Mail size={18} /> Enviar por correo
                         </button>
                         <button onClick={onReset} className="w-full bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-600 transition-colors">
                            <RotateCw size={18} /> Volver al Inicio
                         </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Report;
