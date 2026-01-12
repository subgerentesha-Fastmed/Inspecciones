import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  FileText, 
  History, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  AlertCircle,
  CheckSquare,
  Trash2,
  Download,
  Sparkles
} from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { MASTER_STRUCTURE, DEFAULT_UT, DEFAULT_BCV } from './constants';
import { InspectionState, ClientData, HistoryRecord, InspectionDetail } from './types';
import { generateSSTReport } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inspeccion' | 'reportes' | 'historial'>('dashboard');
  const [clientData, setClientData] = useState<ClientData>({
    fecha: new Date().toLocaleDateString('es-ES'),
    cliente: '', responsable: '', cedula: '', cargo: '', inspector: ''
  });
  
  const [inspectionState, setInspectionState] = useState<InspectionState>(() => {
    const initial: InspectionState = {};
    Object.entries(MASTER_STRUCTURE).forEach(([category, questions], sIdx) => {
      questions.forEach((q, qIdx) => {
        const id = `s${sIdx}q${qIdx}`;
        initial[id] = { ...q, sec: category, status: null, obs: '', act: '', prio: 'Media' };
      });
    });
    return initial;
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ "1. Documentación Legal": true });
  const [history, setHistory] = useState<HistoryRecord[]>(() => JSON.parse(localStorage.getItem('sst_hist') || '[]'));
  const [finances, setFinances] = useState({ ut: DEFAULT_UT, bcv: DEFAULT_BCV, workers: 1 });
  const [reportHtml, setReportHtml] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const stats = useMemo(() => {
    let s = 0, n = 0, na = 0, t = 0;
    (Object.values(inspectionState) as InspectionDetail[]).forEach(item => {
      if (item.status) {
        t++;
        if (item.status === 'Sí') s++;
        else if (item.status === 'No') n++;
        else na++;
      }
    });
    return { s, n, na, t, perc: t > 0 ? Math.round((s / (s + n || 1)) * 100) : 0 };
  }, [inspectionState]);

  const totalFineBs = useMemo(() => {
    let pts = 0;
    (Object.values(inspectionState) as InspectionDetail[]).forEach(item => {
      if (item.status === 'No') {
        const mult = item.s === 'muy-grave' ? 80 : (item.s === 'grave' ? 50 : 20);
        pts += mult * finances.workers;
      }
    });
    return pts * finances.ut;
  }, [inspectionState, finances]);

  const totalFineUsd = totalFineBs / finances.bcv;

  const handleUpdateStatus = (id: string, status: 'Sí' | 'No' | 'NA') => {
    setInspectionState(prev => ({ ...prev, [id]: { ...prev[id], status } }));
  };

  const handleUpdateDetail = (id: string, field: keyof InspectionDetail, value: string) => {
    setInspectionState(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const saveToHistory = () => {
    if (!clientData.cliente) return Swal.fire('Error', 'Debe ingresar el nombre de la empresa.', 'error');
    const record: HistoryRecord = { id: `INS-${Date.now()}`, fecha: clientData.fecha, cliente: clientData.cliente, data: clientData, state: inspectionState };
    const newHistory = [record, ...history];
    setHistory(newHistory);
    localStorage.setItem('sst_hist', JSON.stringify(newHistory));
    Swal.fire('Éxito', 'Inspección guardada localmente.', 'success');
  };

  const generateReportIA = async () => {
    if (stats.t === 0) return Swal.fire('Atención', 'Complete la inspección primero.', 'warning');
    setIsGenerating(true);
    try {
      const findings = (Object.values(inspectionState) as InspectionDetail[]).filter(f => f.status === 'No');
      const html = await generateSSTReport(clientData, findings, `${stats.perc}%`, `${totalFineBs.toLocaleString('es-VE')} Bs.`, `$${totalFineUsd.toFixed(2)}`);
      setReportHtml(html);
      Swal.fire('Informe Generado', 'IA ha redactado el memorándum.', 'success');
    } catch (err) {
      Swal.fire('Error', 'Fallo al conectar con la IA.', 'error');
    } finally { setIsGenerating(false); }
  };

  const exportPDF = async () => {
    const el = document.getElementById('report-preview');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
    pdf.save(`Informe_SST_${clientData.cliente.replace(/\s+/g, '_')}.pdf`);
  };

  const chartData = [
    { name: 'Conforme', value: stats.s, color: '#22c55e' },
    { name: 'Fallas', value: stats.n, color: '#ef4444' },
    { name: 'N/A', value: stats.na, color: '#94a3b8' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-blue-900 text-white shadow-xl sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl">
              <img src="https://static.wixstatic.com/media/308858_8d76dd428458469dbf80998c647a7cab~mv2.png/v1/fill/w_390,h_146,al_c,q_85/Grupo%20Fastmed%20Logo.png" className="h-10" alt="Logo" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter">Prosalmed Elite v35</h1>
          </div>
          <button onClick={saveToHistory} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg">
            <Save size={18} /> Guardar Inspección
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        <nav className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex no-print">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'inspeccion', icon: ClipboardCheck, label: 'Inspección' },
            { id: 'reportes', icon: FileText, label: 'Informes IA' },
            { id: 'historial', icon: History, label: 'Historial' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-inner' : 'text-slate-400 hover:bg-slate-50'}`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border-l-8 border-blue-500">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Total Ítems</p>
                <p className="text-3xl font-black">{stats.t}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border-l-8 border-green-500">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Conforme</p>
                <p className="text-3xl font-black text-green-600">{stats.s}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border-l-8 border-red-500">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Hallazgos</p>
                <p className="text-3xl font-black text-red-600">{stats.n}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border-l-8 border-indigo-500">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Cumplimiento</p>
                <p className="text-3xl font-black text-indigo-600">{stats.perc}%</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-3xl border shadow-sm h-[400px]">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase text-sm tracking-widest">Estado de Gestión Preventiva</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value">
                      {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie><Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-orange-400 font-bold text-lg flex items-center gap-2 mb-6 uppercase tracking-tighter"><AlertCircle size={22} /> Riesgos Legales LOPCYMAT</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div><label className="text-[10px] text-slate-400 block mb-1">U.T. (Bs.)</label><input type="number" value={finances.ut} onChange={e=>setFinances({...finances, ut: parseFloat(e.target.value)||0})} className="bg-slate-800 rounded-xl p-3 w-full text-white font-black outline-none"/></div>
                    <div><label className="text-[10px] text-slate-400 block mb-1">Tasa BCV</label><input type="number" value={finances.bcv} onChange={e=>setFinances({...finances, bcv: parseFloat(e.target.value)||1})} className="bg-slate-800 rounded-xl p-3 w-full text-white font-black outline-none"/></div>
                    <div><label className="text-[10px] text-slate-400 block mb-1">Trabajadores</label><input type="number" value={finances.workers} onChange={e=>setFinances({...finances, workers: parseInt(e.target.value)||1})} className="bg-slate-800 rounded-xl p-3 w-full text-white font-black outline-none"/></div>
                  </div>
                </div>
                <div className="border-t border-slate-800 pt-6 mt-6">
                  <p className="text-slate-400 text-[10px] mb-1 font-black uppercase tracking-widest">Pasivo Laboral Potencial</p>
                  <p className="text-5xl font-black text-orange-500">{totalFineBs.toLocaleString('es-VE')} <span className="text-xl">Bs.</span></p>
                  <p className="text-2xl text-slate-300 font-bold mt-2">≈ ${totalFineUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-sm">USD</span></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inspeccion' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Fecha</label><input type="text" value={clientData.fecha} onChange={e=>setClientData({...clientData, fecha: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"/></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Empresa / Cliente</label><input type="text" value={clientData.cliente} onChange={e=>setClientData({...clientData, cliente: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"/></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Inspector</label><input type="text" value={clientData.inspector} onChange={e=>setClientData({...clientData, inspector: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"/></div>
            </div>

            <div className="space-y-4">
              {Object.entries(MASTER_STRUCTURE).map(([cat, qs], sIdx) => (
                <div key={cat} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <button onClick={()=>setExpandedSections({...expandedSections, [cat]: !expandedSections[cat]})} className="w-full p-6 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-all">
                    <span className="font-black text-blue-900 uppercase text-xs tracking-[0.2em]">{cat}</span>
                    {expandedSections[cat] ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                  </button>
                  {expandedSections[cat] && <div className="p-8 space-y-10">
                    {qs.map((q, qIdx) => {
                      const id = `s${sIdx}q${qIdx}`;
                      const item = inspectionState[id];
                      return (
                        <div key={id} className="border-b border-slate-50 last:border-none pb-10 last:pb-0">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex-1">
                              <p className="font-bold text-slate-800 text-base mb-2 leading-snug">{q.q}</p>
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full font-black uppercase tracking-widest">Base Legal: {q.ref}</span>
                            </div>
                            <div className="flex gap-3 bg-slate-100 p-1.5 rounded-2xl">
                              {['Sí', 'No', 'NA'].map(v => (
                                <button key={v} onClick={()=>handleUpdateStatus(id, v as any)} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${item.status === v ? (v === 'Sí' ? 'bg-green-600 text-white shadow-lg' : v === 'No' ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-600 text-white') : 'bg-transparent text-slate-400 hover:text-slate-600'}`}>{v}</button>
                              ))}
                            </div>
                          </div>
                          {item.status === 'No' && (
                            <div className="bg-red-50/50 p-8 rounded-[2.5rem] border border-red-100 grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 animate-in zoom-in duration-300">
                              <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-red-900 uppercase tracking-widest ml-1">Descripción del Hallazgo</label>
                                <textarea value={item.obs} onChange={e=>handleUpdateDetail(id, 'obs', e.target.value)} placeholder="¿Qué falla se detectó?" className="w-full bg-white border border-red-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none resize-none h-24 shadow-sm"/>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-red-900 uppercase tracking-widest ml-1">Acción Correctiva Sugerida</label>
                                <input value={item.act} onChange={e=>handleUpdateDetail(id, 'act', e.target.value)} placeholder="Ej: Adecuación técnica inmediata" className="w-full bg-white border border-red-200 rounded-2xl p-4 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-red-500"/>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-red-900 uppercase tracking-widest ml-1">Prioridad de Cierre</label>
                                <select value={item.prio} onChange={e=>handleUpdateDetail(id, 'prio', e.target.value as any)} className="w-full bg-white border border-red-200 rounded-2xl p-4 text-sm font-black shadow-sm outline-none focus:ring-2 focus:ring-red-500">
                                  <option value="Alta">🔴 Prioridad Alta</option>
                                  <option value="Media">🟡 Prioridad Media</option>
                                  <option value="Baja">🟢 Prioridad Baja</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reportes' && (
          <div className="space-y-10 animate-in zoom-in-95 duration-500">
            <div className="bg-white p-16 rounded-[3rem] shadow-2xl border border-slate-200 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 text-blue-50 opacity-10"><Sparkles size={150}/></div>
              <h2 className="text-4xl font-black text-slate-800 mb-6 tracking-tighter uppercase">Motor de Redacción de Memorándums (IA)</h2>
              <p className="text-slate-500 mb-12 max-w-2xl mx-auto text-lg font-medium">Gemini 3 Pro analizará sus hallazgos para redactar un informe técnico ejecutivo, legalmente sólido y profesional.</p>
              <div className="flex flex-wrap justify-center gap-8">
                <button disabled={isGenerating} onClick={generateReportIA} className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all disabled:opacity-50 flex items-center gap-4 active:scale-95 group">
                  {isGenerating ? <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={22} className="group-hover:rotate-12 transition-transform" />}
                  {isGenerating ? 'IA está redactando...' : 'Generar Informe con IA'}
                </button>
                <button onClick={()=>{
                  const findings = (Object.values(inspectionState) as InspectionDetail[]).filter(f=>f.status==='No');
                  let content = `<div class="report-page"><div style="text-align:center; border-bottom:4px solid #1e3a8a; padding-bottom:25px; margin-bottom:40px;"><h1 style="margin:0; font-size:24pt;">INFORME DE INSPECCIÓN SST</h1><p style="font-size:10pt; font-weight:bold;">${clientData.cliente.toUpperCase()} | FECHA: ${clientData.fecha}</p></div><h2 style="text-align:center; font-size:16pt; margin-bottom:40px;">MEMORÁNDUM TÉCNICO EJECUTIVO</h2><p><b>PARA:</b> Gerencia General / Dirección de Operaciones</p><p><b>DE:</b> Departamento de Seguridad e Higiene Ocupacional (SHA)</p><p><b>ASUNTO:</b> Diagnóstico situacional de cumplimiento legal LOPCYMAT.</p><hr style="margin:25px 0; border:1px solid #e2e8f0;"><h3>1. RESUMEN EJECUTIVO</h3><p>Tras la auditoría realizada el día ${clientData.fecha}, se determinó un cumplimiento legal del <b>${stats.perc}%</b>.</p><h3>2. HALLAZGOS CRÍTICOS</h3><ul>${findings.length>0 ? findings.map(f=>`<li><b>${f.sec}:</b> ${f.obs || f.q}. Acción recomendada: ${f.act || 'Adecuación inmediata'}.</li>`).join('') : '<li>No se detectaron no conformidades críticas.</li>'}</ul><h3>3. MARCO LEGAL Y RIESGOS</h3><p>El incumplimiento expone a sanciones pecuniarias (Art. 118-120 LOPCYMAT). Pasivo estimado:</p><div style="background:#f8fafc; border:2px solid #000; padding:30px; text-align:center; margin:30px 0; border-radius:25px;"><p style="margin:0; font-size:24pt; font-weight:900; color:#c2410c;">${totalFineBs.toLocaleString('es-VE')} Bs. (~$${totalFineUsd.toFixed(2)} USD)</p></div><div style="display:flex; justify-content:space-between; margin-top:100px;"><div style="border-top:2px solid #000; width:40%; text-align:center; padding-top:20px;"><b>${clientData.inspector || 'INSPECTOR SHA'}</b></div><div style="border-top:2px solid #000; width:40%; text-align:center; padding-top:20px;"><b>RECIBIDO POR EMPRESA</b></div></div></div>`;
                  setReportHtml(content);
                }} className="bg-slate-800 hover:bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl flex items-center gap-4 transition-all active:scale-95"><CheckSquare size={22} /> Plantilla Estándar</button>
              </div>
            </div>

            {reportHtml && (
              <div className="animate-in fade-in zoom-in duration-1000">
                <div className="bg-slate-900 text-white p-6 rounded-t-[2.5rem] flex justify-between items-center shadow-2xl">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-6">Editor de Memorándum Legal</span>
                  <div className="flex gap-4">
                    <button onClick={exportPDF} className="bg-indigo-600 hover:bg-indigo-500 px-10 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-3"><Download size={18}/> Exportar PDF</button>
                    <button onClick={()=>setReportHtml('')} className="bg-red-600/20 hover:bg-red-600 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-red-500 hover:text-white border border-red-600/30">Cerrar</button>
                  </div>
                </div>
                <div className="bg-slate-200/50 p-12 md:p-20 overflow-auto h-[800px] rounded-b-[2.5rem] border border-slate-300 shadow-inner custom-scroll">
                  <div id="report-preview" contentEditable dangerouslySetInnerHTML={{__html: reportHtml}} className="report-page outline-none shadow-[0_0_100px_rgba(0,0,0,0.2)]" />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="animate-in slide-in-from-bottom-10 duration-700">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-10 border-b border-slate-50 bg-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-sm">Registro de Expedientes Guardados</h3>
                <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-6 py-2 rounded-full tracking-widest uppercase">{history.length} REGISTROS</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entidad / Empresa</th>
                      <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.length === 0 ? (
                      <tr><td colSpan={3} className="px-10 py-32 text-center text-slate-300 italic font-medium">No se registran inspecciones previas en este dispositivo.</td></tr>
                    ) : history.map(r => (
                      <tr key={r.id} className="hover:bg-blue-50/50 transition-all">
                        <td className="px-10 py-8 text-sm font-bold text-slate-500">{r.fecha}</td>
                        <td className="px-10 py-8 font-black text-slate-800 text-base">{r.cliente}</td>
                        <td className="px-10 py-8 text-right flex justify-end gap-6">
                          <button onClick={()=>{setInspectionState(r.state); setClientData(r.data); setActiveTab('inspeccion'); Swal.fire('Cargado', 'Datos restaurados.', 'info');}} className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Abrir</button>
                          <button onClick={()=>{
                            const upd = history.filter(h=>h.id!==r.id);
                            setHistory(upd);
                            localStorage.setItem('sst_hist', JSON.stringify(upd));
                            Swal.fire('Eliminado', 'Registro borrado.', 'success');
                          }} className="text-red-500 hover:bg-red-50 p-3 rounded-xl transition-all"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-12 px-10 text-center no-print mt-auto">
        <p className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-4">Gestor SST Prosalmed Elite v35.0 — AI Supercharged</p>
        <div className="flex justify-center grayscale opacity-30 hover:grayscale-0 transition-all mb-4">
          <img src="https://static.wixstatic.com/media/308858_8d76dd428458469dbf80998c647a7cab~mv2.png/v1/fill/w_390,h_146,al_c,q_85/Grupo%20Fastmed%20Logo.png" className="h-6" alt="Fastmed" />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Propiedad Intelectual: Lic. Esp Carlos Vera | FASTMED PROSALMED © 2026</p>
      </footer>
    </div>
  );
};

export default App;