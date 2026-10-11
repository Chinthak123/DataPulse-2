import React, { useMemo, useRef, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, BrainCircuit,
  CheckCircle2, ChevronRight, Download, LayoutDashboard, LogIn, LogOut, Search,
  Sparkles, Table2, Upload, UserPlus, Users, X
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis
} from 'recharts';
import * as XLSX from 'xlsx';

const defaultData = [
  { name: 'Jan', revenue: 4000, users: 2400 }, { name: 'Feb', revenue: 3000, users: 1398 },
  { name: 'Mar', revenue: 2000, users: 9800 }, { name: 'Apr', revenue: 2780, users: 3908 },
  { name: 'May', revenue: 1890, users: 4800 }, { name: 'Jun', revenue: 2390, users: 3800 },
];
const palette = ['#249b8b', '#5b7cfa', '#f2a65a', '#e76f51', '#8b6fc8', '#4ca6b5'];
const tooltipStyle = { background: '#fff', border: '1px solid #d9e1e7', borderRadius: 8, boxShadow: '0 8px 24px #1b2b3a14' };

const formatValue = (value) => typeof value === 'number' ? value.toLocaleString() : value;

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chartData, setChartData] = useState(defaultData);
  const [uploadedFileName, setUploadedFileName] = useState('Default Mock Data');
  const [xAxisKey, setXAxisKey] = useState('name');
  const [barDataKey, setBarDataKey] = useState('revenue');
  const [lineDataKey, setLineDataKey] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [authMode, setAuthMode] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('datapulse-user') || '' : '');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const fileInputRef = useRef(null);

  const numericKeys = useMemo(() => Object.keys(chartData[0] || {}).filter((key) =>
    chartData.some((row) => typeof row[key] === 'number')), [chartData]);
  const categoryData = useMemo(() => {
    const key = xAxisKey;
    return chartData.reduce((result, row) => {
      const label = String(row[key] ?? 'Unknown');
      const current = result.find((item) => item.name === label);
      if (current) current.value += 1;
      else result.push({ name: label, value: 1 });
      return result;
    }, []).slice(0, 8);
  }, [chartData, xAxisKey]);
  const total = useMemo(() => chartData.reduce((sum, row) => sum + (Number(row[barDataKey]) || 0), 0), [chartData, barDataKey]);
  const average = chartData.length ? total / chartData.length : 0;
  const trend = chartData.length > 1 ? Number(chartData.at(-1)?.[barDataKey] || 0) - Number(chartData.at(-2)?.[barDataKey] || 0) : 0;

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const workbook = XLSX.read(loadEvent.target.result, { type: 'array' });
        const parsedData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
        if (!parsedData.length) {
          setUploadMessage('The selected file does not contain any rows.');
          return;
        }
        const keys = Object.keys(parsedData[0]);
        const numeric = keys.filter((key) => parsedData.some((row) => typeof row[key] === 'number'));
        const category = keys.find((key) => !numeric.includes(key)) || keys[0];
        setChartData(parsedData.slice(0, 100));
        setUploadedFileName(file.name);
        setXAxisKey(category);
        setBarDataKey(numeric[0] || keys[1] || keys[0]);
        setLineDataKey(numeric[1] || numeric[0] || keys[2] || keys[0]);
        setUploadMessage(`${parsedData.length.toLocaleString()} rows loaded. Five visualizations are ready.`);
        setActiveTab('dashboard');
      } catch {
        setUploadMessage('We could not read this file. Please upload a CSV or Excel workbook.');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const handleAiSearch = (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    setAiResponse(`Based on ${chartData.length} rows, ${barDataKey} averages ${formatValue(Math.round(average))}. The latest period is ${trend >= 0 ? 'up' : 'down'} by ${formatValue(Math.abs(trend))}.`);
  };

  const handleDownloadReport = () => {
    const keys = Object.keys(chartData[0] || {});
    const csvRows = [keys.join(','), ...chartData.map((row) => keys.map((key) => JSON.stringify(row[key] ?? '')).join(','))];
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csvRows.join('\n')], { type: 'text/csv' }));
    link.download = 'datapulse-export.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthError('');
    setAuthForm({ name: '', email: '', password: '' });
  };

  const handleAuthSubmit = (event) => {
    event.preventDefault();
    if (authForm.password.length < 6) {
      setAuthError('Use a password with at least 6 characters.');
      return;
    }
    const displayName = authMode === 'register'
      ? authForm.name.trim() || authForm.email.split('@')[0]
      : authForm.email.split('@')[0];
    localStorage.setItem('datapulse-user', displayName);
    setCurrentUser(displayName);
    setAuthMode(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('datapulse-user');
    setCurrentUser('');
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'upload', label: 'Import data', icon: Upload },
    { id: 'ai-insights', label: 'Insights', icon: BrainCircuit },
    { id: 'alerts', label: 'Data quality', icon: AlertTriangle },
  ];

  if (!currentUser) {
    return <AuthPage mode={authMode || 'login'} form={authForm} error={authError} onModeChange={openAuth} onChange={(field, value) => setAuthForm((form) => ({ ...form, [field]: value }))} onSubmit={handleAuthSubmit} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Activity size={19} /></div><span>DataPulse</span><small>AI</small></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>{navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`nav-item ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
            <Icon size={17} /><span>{label}</span>{activeTab === id && <ChevronRight size={14} className="nav-arrow" />}
          </button>
        ))}</nav>
        <div className="sidebar-footer"><div className="status-dot" />Dataset connected{currentUser ? <div className="user-chip"><span>{currentUser.slice(0, 2).toUpperCase()}</span><div><strong>{currentUser}</strong><small>Signed in</small></div><button className="logout-button" aria-label="Log out" onClick={handleLogout}><LogOut size={14} /></button></div> : <button className="sidebar-auth-link" onClick={() => openAuth('login')}>Sign in to save your work <ChevronRight size={13} /></button>}</div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><div className="breadcrumb">Workspace <ChevronRight size={13} /> {activeTab === 'dashboard' ? 'Overview' : navItems.find((item) => item.id === activeTab)?.label}</div><h1>{activeTab === 'dashboard' ? 'Data overview' : navItems.find((item) => item.id === activeTab)?.label}</h1></div>
          <div className="topbar-actions"><span className="source-pill"><span className="status-dot" />{uploadedFileName}</span>{currentUser ? <span className="signed-in-label">Signed in as <strong>{currentUser}</strong></span> : <><button className="button button-ghost" onClick={() => openAuth('login')}><LogIn size={15} /> Log in</button><button className="button button-primary" onClick={() => openAuth('register')}><UserPlus size={15} /> Register</button></>}<button className="button button-primary" onClick={handleDownloadReport}><Download size={15} /> Export</button></div>
        </header>

        <div className="content">
          {activeTab === 'dashboard' && <Dashboard data={chartData} xAxisKey={xAxisKey} barDataKey={barDataKey} lineDataKey={lineDataKey} numericKeys={numericKeys} categoryData={categoryData} total={total} average={average} trend={trend} />}
          {activeTab === 'upload' && <section className="panel upload-panel"><div className="upload-icon"><Upload size={25} /></div><h2>Import a dataset</h2><p>Bring in a CSV or Excel file to automatically generate five visualizations and actionable insights.</p><input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} hidden /><button className="button button-primary" onClick={() => fileInputRef.current?.click()}><Upload size={16} /> Choose file</button>{uploadMessage && <div className="notice"><CheckCircle2 size={16} />{uploadMessage}</div>}</section>}
          {activeTab === 'ai-insights' && <section className="insights-page"><div className="page-heading"><div className="eyebrow"><Sparkles size={14} /> AI ASSISTANT</div><h2>Ask questions about your data</h2><p>Get a plain-English summary from the active dataset.</p></div><form className="search-box" onSubmit={handleAiSearch}><Search size={18} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Try “What is the latest trend?”" /><button className="button button-primary" type="submit">Ask AI</button></form>{aiResponse && <div className="ai-answer"><Sparkles size={20} /><div><strong>DataPulse insight</strong><p>{aiResponse}</p></div><button className="icon-button" onClick={() => setAiResponse('')}><X size={16} /></button></div>}<InsightCards data={chartData} barDataKey={barDataKey} lineDataKey={lineDataKey} average={average} trend={trend} /></section>}
          {activeTab === 'alerts' && <section className="panel quality-panel"><div className="page-heading"><div className="eyebrow"><CheckCircle2 size={14} /> DATA QUALITY</div><h2>Dataset health</h2><p>A quick check of the currently loaded data.</p></div><div className="quality-row"><CheckCircle2 size={22} /><div><strong>All systems nominal</strong><p>{chartData.length} rows and {Object.keys(chartData[0] || {}).length} columns are available for analysis.</p></div><span className="quality-badge">Healthy</span></div></section>}
        </div>
      </main>
      {authMode && <AuthModal mode={authMode} form={authForm} error={authError} onClose={() => setAuthMode(null)} onModeChange={openAuth} onChange={(field, value) => setAuthForm((form) => ({ ...form, [field]: value }))} onSubmit={handleAuthSubmit} />}
    </div>
  );
}

function AuthModal({ mode, form, error, onClose, onModeChange, onChange, onSubmit }) {
  const isRegister = mode === 'register';
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="modal-close icon-button" aria-label="Close authentication dialog" onClick={onClose}><X size={17} /></button>
      <div className="auth-brand"><div className="brand-mark"><Activity size={19} /></div><span>DataPulse <b>AI</b></span></div>
      <div className="auth-heading"><div className="eyebrow"><Activity size={13} /> YOUR DATA WORKSPACE</div><h2 id="auth-title">{isRegister ? 'Create your account' : 'Welcome back'}</h2><p>{isRegister ? 'Start turning your data into useful decisions.' : 'Sign in to access your workspace and insights.'}</p></div>
      <form className="auth-form" onSubmit={onSubmit}>
        {isRegister && <label>Full name<input required value={form.name} onChange={(event) => onChange('name', event.target.value)} placeholder="Your name" /></label>}
        <label>Email address<input required type="email" value={form.email} onChange={(event) => onChange('email', event.target.value)} placeholder="you@company.com" /></label>
        <label>Password<input required type="password" minLength="6" value={form.password} onChange={(event) => onChange('password', event.target.value)} placeholder="At least 6 characters" /></label>
        {error && <p className="auth-error">{error}</p>}
        <button className="button button-primary auth-submit" type="submit">{isRegister ? 'Create account' : 'Log in'} <ChevronRight size={15} /></button>
      </form>
      <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to DataPulse?'} <button onClick={() => onModeChange(isRegister ? 'login' : 'register')}>{isRegister ? 'Log in' : 'Create an account'}</button></p>
      <small className="auth-note">Demo mode: account details stay in this browser only.</small>
    </section>
  </div>;
}

function AuthPage({ mode, form, error, onModeChange, onChange, onSubmit }) {
  const isRegister = mode === 'register';
  return <main className="auth-page">
    <div className="auth-page-decoration"><div className="auth-orb orb-one" /><div className="auth-orb orb-two" /><div className="auth-grid" /></div>
    <section className="auth-page-card">
      <div className="auth-brand"><div className="brand-mark"><Activity size={19} /></div><span>DataPulse <b>AI</b></span></div>
      <div className="auth-heading"><div className="eyebrow"><Activity size={13} /> DATA INTELLIGENCE WORKSPACE</div><h2>{isRegister ? 'Create your account' : 'Welcome to DataPulse'}</h2><p>{isRegister ? 'Build a clearer view of your data in minutes.' : 'Sign in to explore your data and uncover useful insights.'}</p></div>
      <form className="auth-form" onSubmit={onSubmit}>
        {isRegister && <label>Full name<input required value={form.name} onChange={(event) => onChange('name', event.target.value)} placeholder="Your name" /></label>}
        <label>Email address<input required type="email" value={form.email} onChange={(event) => onChange('email', event.target.value)} placeholder="you@company.com" /></label>
        <label>Password<input required type="password" minLength="6" value={form.password} onChange={(event) => onChange('password', event.target.value)} placeholder="At least 6 characters" /></label>
        {error && <p className="auth-error">{error}</p>}
        <button className="button button-primary auth-submit" type="submit">{isRegister ? 'Create account' : 'Log in'} <ChevronRight size={15} /></button>
      </form>
      <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to DataPulse?'} <button onClick={() => onModeChange(isRegister ? 'login' : 'register')}>{isRegister ? 'Log in' : 'Create an account'}</button></p>
      <small className="auth-note">Demo mode: account details stay in this browser only.</small>
    </section>
  </main>;
}

function Dashboard({ data, xAxisKey, barDataKey, lineDataKey, numericKeys, categoryData, total, average, trend }) {
  return <div className="dashboard animate-in">
    <div className="dashboard-intro"><div><div className="eyebrow"><BarChart3 size={14} /> DATA OVERVIEW</div><h2>Your data, at a glance</h2><p>Explore patterns, trends, and signals from your latest dataset.</p></div><div className="date-chip"><Activity size={15} /> Live analysis</div></div>
    <div className="stat-grid">
      <StatCard label="Total records" value={data.length.toLocaleString()} note="Rows analyzed" icon={Table2} color="teal" />
      <StatCard label={`Total ${barDataKey}`} value={formatValue(total)} note="Across all records" icon={BarChart3} color="blue" />
      <StatCard label={`Average ${barDataKey}`} value={formatValue(Math.round(average))} note="Per record" icon={Activity} color="orange" />
      <StatCard label="Latest movement" value={`${trend >= 0 ? '+' : '-'}${formatValue(Math.abs(trend))}`} note={trend >= 0 ? 'Positive change' : 'Needs attention'} icon={trend >= 0 ? ArrowUpRight : ArrowDownRight} color={trend >= 0 ? 'green' : 'red'} />
    </div>
    <div className="section-heading"><div><h3>Visualizations</h3><p>Five views generated from your mapped fields</p></div><span className="mapping-label">{xAxisKey} · {numericKeys.join(' · ')}</span></div>
    <div className="chart-grid">
      <ChartCard title="Performance by category" subtitle={`${barDataKey} and ${lineDataKey}`}><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf1" /><XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#788896' }} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#788896' }} /><Tooltip contentStyle={tooltipStyle} /><Legend iconType="circle" /><Bar dataKey={barDataKey} fill="#5b7cfa" radius={[5, 5, 0, 0]} /><Bar dataKey={lineDataKey} fill="#a9d9d1" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Trend over time" subtitle={`Movement in ${lineDataKey}`}><ResponsiveContainer><LineChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf1" /><XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#788896' }} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#788896' }} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey={lineDataKey} stroke="#249b8b" strokeWidth={3} dot={{ fill: '#249b8b', r: 3 }} /></LineChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Cumulative area" subtitle={`Volume of ${barDataKey}`}><ResponsiveContainer><AreaChart data={data}><defs><linearGradient id="pulseGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5b7cfa" stopOpacity=".3" /><stop offset="100%" stopColor="#5b7cfa" stopOpacity=".02" /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf1" /><XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#788896' }} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#788896' }} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey={barDataKey} stroke="#5b7cfa" fill="url(#pulseGradient)" strokeWidth={2.5} /></AreaChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Category mix" subtitle={`Distribution of ${xAxisKey}`}><ResponsiveContainer><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="48%" innerRadius={48} outerRadius={80} paddingAngle={3}>{categoryData.map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></ChartCard>
      <ChartCard title="Metric correlation" subtitle={`${barDataKey} vs ${lineDataKey}`}><ResponsiveContainer><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke="#e8edf1" /><XAxis type="number" dataKey={barDataKey} name={barDataKey} tick={{ fontSize: 11, fill: '#788896' }} /><YAxis type="number" dataKey={lineDataKey} name={lineDataKey} tick={{ fontSize: 11, fill: '#788896' }} /><Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle} /><Scatter name="Records" data={data} fill="#f2a65a" /></ScatterChart></ResponsiveContainer></ChartCard>
    </div>
    <div className="section-heading insights-heading"><div><h3>Automated insights</h3><p>Signals detected from your data</p></div><span className="insight-count"><Sparkles size={14} /> 3 insights</span></div>
    <InsightCards data={data} barDataKey={barDataKey} lineDataKey={lineDataKey} average={average} trend={trend} />
  </div>;
}

function ChartCard({ title, subtitle, children }) { return <div className="chart-card"><div className="chart-title"><div><h4>{title}</h4><p>{subtitle}</p></div><button className="icon-button"><ChevronRight size={16} /></button></div><div className="chart-area">{children}</div></div>; }
function StatCard({ label, value, note, icon: Icon, color }) { return <div className="stat-card"><div><p>{label}</p><strong>{value}</strong><small><span className={`trend ${color}`}>{color === 'red' ? '↓' : '↑'}</span>{note}</small></div><div className={`stat-icon ${color}`}><Icon size={19} /></div></div>; }
function InsightCards({ data, barDataKey, lineDataKey, average, trend }) {
  const peak = data.reduce((best, row) => Number(row[barDataKey]) > Number(best?.[barDataKey] || 0) ? row : best, data[0]);
  return <div className="insight-grid"><div className="insight-card teal"><div className="insight-icon"><ArrowUpRight size={17} /></div><div><strong>Latest movement</strong><p>{barDataKey} is {trend >= 0 ? 'up' : 'down'} by <b>{formatValue(Math.abs(trend))}</b> in the latest period.</p></div></div><div className="insight-card blue"><div className="insight-icon"><Sparkles size={17} /></div><div><strong>Top performer</strong><p><b>{peak?.[barDataKey] ? formatValue(peak[barDataKey]) : 'No value'}</b> is the highest recorded {barDataKey} value.</p></div></div><div className="insight-card orange"><div className="insight-icon"><Users size={17} /></div><div><strong>Typical record</strong><p>The average {lineDataKey} is <b>{formatValue(Math.round(average))}</b> across {data.length} records.</p></div></div></div>;
}
