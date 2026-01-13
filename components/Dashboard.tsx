
import React, { useEffect, useState } from 'react';
import { AppStep, UserRole, StudyStatus } from '../types';
import { 
    Plus as PlusIcon, 
    Search as SearchIcon, 
    ShieldCheck as ShieldIcon,
    AlertCircle as AlertIcon,
    RefreshCw as RefreshIcon,
    ArrowLeft,
    Loader2,
    DatabaseZap,
    ExternalLink,
    Copy,
    Check,
    Table2,
    TrendingUp,
    FileText,
    Calculator
} from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';

interface DashboardProps {
    setStep: (step: AppStep) => void;
}

const StatusBadge: React.FC<{ status?: StudyStatus }> = ({ status }) => {
    switch (status) {
        case StudyStatus.Approved:
            return <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs font-medium border border-green-500/30 flex items-center gap-1 w-fit"><ShieldIcon size={12}/> Aprobado</span>;
        case StudyStatus.Rejected:
            return <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs font-medium border border-red-500/30 flex items-center gap-1 w-fit"><AlertIcon size={12}/> Rechazado</span>;
        case StudyStatus.Processing:
            return <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs font-medium border border-blue-500/30 flex items-center gap-1 w-fit"><Loader2 size={12} className="animate-spin"/> Procesando</span>;
        case StudyStatus.PendingReview:
            return <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs font-medium border border-yellow-500/30 flex items-center gap-1 w-fit"><SearchIcon size={12}/> Revisión</span>;
        default:
            return <span className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded-full text-xs font-medium border border-gray-500/30 flex items-center gap-1 w-fit">Borrador</span>;
    }
};

const formatCurrency = (value?: number) => {
    if (value === undefined || value === null || isNaN(value)) return '$0.00';
    return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
};

const Dashboard: React.FC<DashboardProps> = ({ setStep }) => {
    const { startNewStudy, userData, studiesList, fetchStudies, loadStudy, areStudiesLoading } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [showSqlHelper, setShowSqlHelper] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    
    useEffect(() => {
        fetchStudies();
    }, [fetchStudies]);

    const isPrivileged = userData?.role === UserRole.Admin || userData?.role === UserRole.Reviewer;
    
    const filteredList = studiesList.filter(s => 
        (s.empresaNombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.rfc?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const sqlScripts = [
        {
            title: "1. Métricas Generales (Maestra)",
            icon: <ShieldIcon size={16} className="text-blue-400" />,
            sql: `CREATE OR REPLACE VIEW \`credit-iq-22d5a.analisis_credit_iq.vw_metricas_generales\` AS
SELECT 
  document_id,
  TIMESTAMP(timestamp) as fecha_solicitud,
  JSON_EXTRACT_SCALAR(data, '$.empresaNombre') as empresa,
  JSON_EXTRACT_SCALAR(data, '$.questionnaire.datosGenerales.sector') as sector,
  SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.questionnaire.solicitud.monto') AS FLOAT64) as monto_solicitado,
  JSON_EXTRACT_SCALAR(data, '$.status') as estatus,
  SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.analysisData.riskScore') AS INT64) as score_financiero,
  JSON_EXTRACT_SCALAR(data, '$.reputationData.calificacion_reputacional') as score_reputacional,
  JSON_EXTRACT_SCALAR(data, '$.ownerUid') as analista_id
FROM \`credit-iq-22d5a.analisis_credit_iq.solicitudes_raw_latest\``
        },
        {
            title: "2. Información de Solicitud (Términos)",
            icon: <FileText size={16} className="text-purple-400" />,
            sql: `CREATE OR REPLACE VIEW \`credit-iq-22d5a.analisis_credit_iq.vw_detalle_solicitud\` AS
SELECT
  document_id,
  JSON_EXTRACT_SCALAR(data, '$.empresaNombre') as empresa,
  SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.questionnaire.solicitud.monto') AS FLOAT64) as monto,
  SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.questionnaire.solicitud.plazo') AS INT64) as numero_rentas,
  SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.questionnaire.solicitud.renta') AS FLOAT64) as rentas,
  SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.questionnaire.solicitud.tasaNominal') AS FLOAT64) as tasas,
  SAFE_CAST(JSON_EXTRACT_SCALAR(data, '$.questionnaire.solicitud.tir') AS FLOAT64) as tir,
  JSON_EXTRACT_SCALAR(data, '$.questionnaire.solicitud.garantia') as garantia
FROM \`credit-iq-22d5a.analisis_credit_iq.solicitudes_raw_latest\``
        },
        {
            title: "3. Rendimiento Anual (3 Periodos Pivoteados)",
            icon: <TrendingUp size={16} className="text-green-400" />,
            sql: `CREATE OR REPLACE VIEW \`credit-iq-22d5a.analisis_credit_iq.vw_rendimiento_3_anios\` AS
SELECT
  document_id,
  JSON_EXTRACT_SCALAR(data, '$.empresaNombre') as empresa,
  -- Ingresos (Pivoteado para Looker)
  MAX(CASE WHEN JSON_EXTRACT_SCALAR(perf, '$.year') = '2022' THEN SAFE_CAST(JSON_EXTRACT_SCALAR(perf, '$.ingresos') AS FLOAT64) END) as ingresos_2022,
  MAX(CASE WHEN JSON_EXTRACT_SCALAR(perf, '$.year') = '2023' THEN SAFE_CAST(JSON_EXTRACT_SCALAR(perf, '$.ingresos') AS FLOAT64) END) as ingresos_2023,
  MAX(CASE WHEN JSON_EXTRACT_SCALAR(perf, '$.year') = '2024' THEN SAFE_CAST(JSON_EXTRACT_SCALAR(perf, '$.ingresos') AS FLOAT64) END) as ingresos_2024,
  -- Utilidades (Pivoteado para Looker)
  MAX(CASE WHEN JSON_EXTRACT_SCALAR(perf, '$.year') = '2022' THEN SAFE_CAST(JSON_EXTRACT_SCALAR(perf, '$.utilidades') AS FLOAT64) END) as utilidad_2022,
  MAX(CASE WHEN JSON_EXTRACT_SCALAR(perf, '$.year') = '2023' THEN SAFE_CAST(JSON_EXTRACT_SCALAR(perf, '$.utilidades') AS FLOAT64) END) as utilidad_2023,
  MAX(CASE WHEN JSON_EXTRACT_SCALAR(perf, '$.year') = '2024' THEN SAFE_CAST(JSON_EXTRACT_SCALAR(perf, '$.utilidades') AS FLOAT64) END) as utilidad_2024
FROM \`credit-iq-22d5a.analisis_credit_iq.solicitudes_raw_latest\`,
UNNEST(JSON_EXTRACT_ARRAY(data, '$.analysisData.performance')) AS perf
GROUP BY 1, 2`
        },
        {
            title: "4. Razones Financieras",
            icon: <Calculator size={16} className="text-yellow-400" />,
            sql: `CREATE OR REPLACE VIEW \`credit-iq-22d5a.analisis_credit_iq.vw_razones_financieras\` AS
WITH base AS (
  SELECT
    document_id,
    JSON_EXTRACT_SCALAR(data, '$.empresaNombre') as empresa,
    JSON_EXTRACT(data, '$.analysisData.ratios') as ratios_json
  FROM \`credit-iq-22d5a.analisis_credit_iq.solicitudes_raw_latest\`
)
SELECT document_id, empresa, 'Liquidez' as categoria, JSON_EXTRACT_SCALAR(r, '$.name') as ratio, SAFE_CAST(JSON_EXTRACT_SCALAR(r, '$.value') AS FLOAT64) as valor FROM base, UNNEST(JSON_EXTRACT_ARRAY(ratios_json, '$.liquidez')) as r
UNION ALL
SELECT document_id, empresa, 'Rentabilidad' as categoria, JSON_EXTRACT_SCALAR(r, '$.name') as ratio, SAFE_CAST(JSON_EXTRACT_SCALAR(r, '$.value') AS FLOAT64) as valor FROM base, UNNEST(JSON_EXTRACT_ARRAY(ratios_json, '$.rentabilidad')) as r
UNION ALL
SELECT document_id, empresa, 'Solvencia' as categoria, JSON_EXTRACT_SCALAR(r, '$.name') as ratio, SAFE_CAST(JSON_EXTRACT_SCALAR(r, '$.value') AS FLOAT64) as valor FROM base, UNNEST(JSON_EXTRACT_ARRAY(ratios_json, '$.solvencia')) as r`
        }
    ];

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="animate-fade-in max-w-7xl mx-auto w-full pb-10 font-sans">
            <div className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer w-fit transition-all" onClick={() => setStep(AppStep.Home)}>
                <ArrowLeft size={18} />
                <span className="text-sm font-medium uppercase tracking-widest">Inicio</span>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Credit IQ Analytics</h2>
                    <p className="text-gray-400 text-sm mt-1">Configuración de vistas SQL para Looker Studio.</p>
                </div>
                <div className="flex gap-3">
                    {isPrivileged && (
                        <button
                            onClick={() => setShowSqlHelper(!showSqlHelper)}
                            className={`py-2.5 px-6 rounded-xl border transition-all flex items-center gap-2 text-xs uppercase tracking-widest font-bold ${showSqlHelper ? 'bg-blue-600 border-blue-500 text-white shadow-xl' : 'bg-slate-900 border-slate-700 text-gray-300'}`}
                        >
                            <DatabaseZap size={16} /> Ver Scripts SQL
                        </button>
                    )}
                    <button
                        onClick={() => { startNewStudy(); setStep(AppStep.Questionnaire); }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
                    >
                        <PlusIcon size={16} /> Nuevo Análisis
                    </button>
                </div>
            </div>

            {showSqlHelper && isPrivileged && (
                <div className="mb-10 space-y-6 animate-slide-in-up">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Table2 size={24} className="text-blue-400" />
                            <div>
                                <h3 className="text-xl font-bold text-white">Guía de Configuración en BigQuery</h3>
                                <p className="text-sm text-gray-400">Copia estos códigos uno por uno en tu consola de Google Cloud para que Looker funcione correctamente.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {sqlScripts.map((script, idx) => (
                                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/40 transition-all flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            {script.icon}
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">{script.title}</span>
                                        </div>
                                        <button 
                                            onClick={() => copyToClipboard(script.sql, idx)}
                                            className="bg-slate-900 hover:bg-blue-600 p-2 rounded-lg text-gray-500 hover:text-white transition-all"
                                            title="Copiar SQL"
                                        >
                                            {copiedIndex === idx ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    <div className="bg-slate-900/50 p-3 rounded-xl font-mono text-[9px] text-gray-600 overflow-y-auto h-32 relative">
                                        <pre>{script.sql}</pre>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-900 flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        Listo para Looker Studio
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 bg-blue-600/10 border border-blue-500/20 p-5 rounded-2xl flex items-center justify-between gap-4">
                            <p className="text-xs text-blue-200 font-sans leading-relaxed">
                                <strong>Tip Pro:</strong> Después de ejecutar cada comando en BigQuery, ve a Looker Studio y crea una fuente de datos de tipo "BigQuery" seleccionando la **Vista** que acabas de crear. Los campos aparecerán automáticamente como Números y Fechas.
                            </p>
                            <a href="https://console.cloud.google.com/bigquery" target="_blank" className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest bg-blue-600 px-6 py-3 rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap">
                                Abrir Consola GCP <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-slate-900/40 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-purple-600 transition-all">
                        <SearchIcon className="text-gray-600" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar empresa o RFC..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-white w-full placeholder-gray-700 text-sm"
                        />
                    </div>
                    <button onClick={() => fetchStudies()} className="p-2.5 text-gray-400 hover:text-white bg-slate-800 rounded-xl transition-colors">
                        <RefreshIcon size={18} className={areStudiesLoading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-800/50 text-[10px] uppercase font-bold text-gray-500 tracking-widest border-b border-slate-800">
                            <tr>
                                <th className="px-8 py-5">Empresa / RFC</th>
                                <th className="px-8 py-5">Monto Solicitado</th>
                                <th className="px-8 py-5">Estatus</th>
                                <th className="px-8 py-5 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredList.length > 0 ? filteredList.map((app) => (
                                <tr key={app.id} className="hover:bg-slate-800/20 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-white group-hover:text-purple-400 transition-colors text-base">{app.empresaNombre || 'N/A'}</div>
                                        <div className="text-[10px] text-gray-600 font-mono mt-0.5">{app.rfc || 'S/RFC'}</div>
                                    </td>
                                    <td className="px-8 py-6 text-gray-300 font-medium">
                                        {formatCurrency(app.questionnaire?.solicitud?.monto)}
                                    </td>
                                    <td className="px-8 py-6">
                                        <StatusBadge status={app.status} />
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={() => app.id && loadStudy(app.id).then(() => setStep(app.status === StudyStatus.Draft ? AppStep.Questionnaire : AppStep.Summary))}
                                            className="bg-slate-800 hover:bg-purple-600 text-white text-[10px] font-bold px-5 py-2.5 rounded-xl border border-slate-700 hover:border-purple-500 transition-all uppercase tracking-widest"
                                        >
                                            Gestionar
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-16 text-center text-gray-600 italic">
                                        {areStudiesLoading ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 size={24} className="animate-spin text-purple-500" />
                                                <span className="text-xs uppercase tracking-widest font-bold">Cargando datos...</span>
                                            </div>
                                        ) : 'No hay solicitudes registradas.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
