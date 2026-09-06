import React, { useState, useRef } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { 
  LayoutDashboard, BrainCircuit, AlertTriangle, Download, Search, TrendingUp, Users, DollarSign, Activity, Upload, FileSpreadsheet 
} from 'lucide-react';
import * as XLSX from 'xlsx';

const defaultData = [
  { name: 'Jan', revenue: 4000, users: 2400 },
  { name: 'Feb', revenue: 3000, users: 1398 },
  { name: 'Mar', revenue: 2000, users: 9800 },
  { name: 'Apr', revenue: 2780, users: 3908 },
  { name: 'May', revenue: 1890, users: 4800 },
  { name: 'Jun', revenue: 2390, users: 3800 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chartData, setChartData] = useState(defaultData);
  const [uploadedFileName, setUploadedFileName] = useState('Default Mock Data');
  
  
  const [xAxisKey, setXAxisKey] = useState('name');
  const [barDataKey, setBarDataKey] = useState('revenue');
  const [lineDataKey, setLineDataKey] = useState('users');

  const [searchQuery, setSearchQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsedData = XLSX.utils.sheet_to_json(worksheet);

      if (parsedData.length > 0) {
        const firstRow = parsedData[0];
        const keys = Object.keys(firstRow);

        
        const stringKey = keys.find(k => typeof firstRow[k] === 'string') || keys[0];
        const numericKeys = keys.filter(k => typeof firstRow[k] === 'number');

        setXAxisKey(stringKey);
        setBarDataKey(numericKeys[0] || keys[1] || stringKey);
        setLineDataKey(numericKeys[1] || numericKeys[0] || keys[2] || stringKey);

        
        setChartData(parsedData.slice(0, 50));
        setActiveTab('dashboard');
        alert(`Successfully loaded ${parsedData.length} rows from ${file.name}! Charts updated.`);
      } else {
        alert("The uploaded file appears to be empty.");
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleAiSearch = (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setAiResponse(`AI Insight: Analyzed dataset "${uploadedFileName}". Active records indicate normal distribution patterns across ${xAxisKey}.`);
  };

  const handleDownloadReport = () => {
    if (chartData.length === 0) return;
    const keys = Object.keys(chartData[0]);
    const csvRows = [keys.join(','), ...chartData.map(row => keys.map(k => row[k] || '').join(','))];
    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'datapulse_export.csv';
    a.click();
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-700">
          <Activity className="h-8 w-8 text-indigo-400" />
          <span className="text-xl font-bold tracking-wider">DataPulse AI</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('upload')} className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition ${activeTab === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
            <Upload className="h-5 w-5" />
            <span>Upload Dataset</span>
          </button>
          <button onClick={() => setActiveTab('ai-insights')} className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition ${activeTab === 'ai-insights' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
            <BrainCircuit className="h-5 w-5" />
            <span>AI Query & Insights</span>
          </button>
          <button onClick={() => setActiveTab('alerts')} className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition ${activeTab === 'alerts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
            <AlertTriangle className="h-5 w-5" />
            <span>Anomaly Alerts</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-8">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-semibold capitalize">{activeTab.replace('-', ' ')} View</h1>
            <span className="text-xs bg-slate-700 px-3 py-1 rounded-full text-slate-300">
              Active Source: <strong className="text-indigo-400">{uploadedFileName}</strong>
            </span>
          </div>
          <button onClick={handleDownloadReport} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </header>

        <div className="p-8 space-y-8">
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Dataset Records</p>
                    <h3 className="text-2xl font-bold mt-1">{chartData.length} Rows Rendered</h3>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" /> Active mapping enabled
                    </span>
                  </div>
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg"><DollarSign className="h-6 w-6" /></div>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">X-Axis Mapping</p>
                    <h3 className="text-xl font-bold mt-1 text-indigo-300">{xAxisKey}</h3>
                    <span className="text-xs text-blue-400 font-semibold flex items-center mt-1"><Users className="h-3 w-3 mr-1" /> Category field</span>
                  </div>
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><FileSpreadsheet className="h-6 w-6" /></div>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Metrics Mapped</p>
                    <h3 className="text-sm font-bold mt-1 text-slate-200">{barDataKey} & {lineDataKey}</h3>
                    <span className="text-xs text-purple-400 font-semibold flex items-center mt-1"><Activity className="h-3 w-3 mr-1" /> Live values</span>
                  </div>
                  <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg"><Activity className="h-6 w-6" /></div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                  <h3 className="text-md font-semibold mb-4 text-slate-300">Bar View: {barDataKey}</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey={xAxisKey} stroke="#94a3b8" tick={{fontSize: 10}} />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
                        <Bar dataKey={barDataKey} fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                  <h3 className="text-md font-semibold mb-4 text-slate-300">Line View: {lineDataKey}</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey={xAxisKey} stroke="#94a3b8" tick={{fontSize: 10}} />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
                        <Line type="monotone" dataKey={lineDataKey} stroke="#38bdf8" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'upload' && (
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-xl mx-auto text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center">
                <FileSpreadsheet className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Upload Custom Dataset</h2>
                <p className="text-sm text-slate-400 mt-1">Supports CSV and Excel (.xlsx) files instantly.</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv, .xlsx, .xls" className="hidden" />
              <button onClick={() => fileInputRef.current.click()} className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-medium transition cursor-pointer flex items-center justify-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Browse & Select Spreadsheet File</span>
              </button>
            </div>
          )}

          {activeTab === 'ai-insights' && (
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-2xl mx-auto space-y-6">
              <div className="flex items-center space-x-3">
                <BrainCircuit className="h-8 w-8 text-indigo-400" />
                <div>
                  <h2 className="text-xl font-bold">Ask DataPulse AI</h2>
                  <p className="text-sm text-slate-400">Query your active dataset using normal English questions.</p>
                </div>
              </div>
              <form onSubmit={handleAiSearch} className="flex space-x-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="e.g., Summarize trends..." className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-lg text-sm font-medium transition cursor-pointer">Ask AI</button>
              </form>
              {aiResponse && <div className="p-4 bg-slate-900 border border-indigo-500/30 rounded-lg text-indigo-200 text-sm">{aiResponse}</div>}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center space-x-3 mb-6">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
                <h2 className="text-lg font-bold">Anomaly & Error Alert Center</h2>
              </div>
              <div className="p-4 bg-slate-900 border-l-4 border-amber-500 rounded-r-lg flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-amber-400">Data Variance Alert</h4>
                  <p className="text-xs text-slate-400 mt-1">Uploaded dataset format parsed successfully into Recharts.</p>
                </div>
                <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-medium">Warning</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}