import { useEffect, useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, ScatterChart, Scatter, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  Activity as ActivityIcon, AlertTriangle, Box, ChevronDown, Cpu, Database, Filter, Flame,
  Globe2, HardDrive, Home, LineChart as LineIcon, LogOut, Map as MapIcon, Plus,
  Radio, Search, Server, Settings, Shield, Sparkles, Terminal, Trash2, Users,
  Wand2, Zap, Eye, Edit, Ban, ArrowUpDown, RefreshCw, Download, Code2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomActivities } from '@/contexts/CustomActivitiesContext';
import { users, tutors, professionals, activities, admins } from '@/data/mockData';
import { SHOP_ITEMS } from '@/data/shopItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

// =============================================================
// SUPER ADMIN / GOD MODE DASHBOARD
// Dense, developer-grade infrastructure cockpit.
// =============================================================

type SectionId = 'overview' | 'live' | 'map' | 'builder' | 'tables' | 'system';

const NAV: { id: SectionId; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'live', label: 'Live Feed', icon: Radio },
  { id: 'map', label: 'Geo Map', icon: Globe2 },
  { id: 'builder', label: 'God Builder', icon: Wand2 },
  { id: 'tables', label: 'Data Tables', icon: Database },
  { id: 'system', label: 'System', icon: Cpu },
];

// ---------- mock telemetry generators ----------
const seriesArea = Array.from({ length: 48 }, (_, i) => ({
  t: `${String(i % 24).padStart(2, '0')}:00`,
  sessions: Math.round(120 + Math.sin(i / 3) * 60 + Math.random() * 40),
  events: Math.round(420 + Math.cos(i / 4) * 180 + Math.random() * 80),
  errors: Math.round(2 + Math.random() * 6),
}));

const seriesBars = [
  { name: 'Activities', a: 1240, b: 870 },
  { name: 'Pictograms', a: 980, b: 1120 },
  { name: 'Chats', a: 2300, b: 1980 },
  { name: 'Logins', a: 1820, b: 2100 },
  { name: 'Coins', a: 3120, b: 2780 },
  { name: 'Shop Buys', a: 410, b: 520 },
];

const seriesScatter = Array.from({ length: 80 }, () => ({
  x: Math.round(Math.random() * 100),
  y: Math.round(Math.random() * 100),
  z: Math.round(Math.random() * 400),
}));

const seriesPie = [
  { name: 'Users', value: users.length },
  { name: 'Tutors', value: tutors.length },
  { name: 'Professionals', value: professionals.length },
  { name: 'Admins', value: admins.length },
];

const RADAR = [
  { k: 'Engagement', v: 86 },
  { k: 'Retention', v: 72 },
  { k: 'Adherence', v: 64 },
  { k: 'Conversion', v: 41 },
  { k: 'Latency', v: 92 },
  { k: 'Stability', v: 88 },
];

const PIE_COLORS = ['hsl(190 90% 55%)', 'hsl(270 80% 65%)', 'hsl(330 80% 60%)', 'hsl(45 90% 55%)'];

// ---------- shell ----------
export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState<SectionId>('overview');

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen flex bg-[#0a0e1a] text-slate-100" style={{
      backgroundImage:
        'radial-gradient(ellipse at top left, rgba(56,189,248,0.08), transparent 50%), radial-gradient(ellipse at bottom right, rgba(168,85,247,0.08), transparent 50%)',
    }}>
      <Sidebar section={section} setSection={setSection} onLogout={logout} userName={user.name} clearance={(user as any).clearance} />
      <main className="flex-1 ml-64 min-w-0">
        <TopBar section={section} />
        <div className="p-6 space-y-6">
          {section === 'overview' && <OverviewSection />}
          {section === 'live' && <LiveFeedSection />}
          {section === 'map' && <GeoMapSection />}
          {section === 'builder' && <GodBuilderSection />}
          {section === 'tables' && <DataTablesSection />}
          {section === 'system' && <SystemSection />}
        </div>
      </main>
    </div>
  );
}

function Sidebar({ section, setSection, onLogout, userName, clearance }: any) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-800 bg-[#0d1322]/95 backdrop-blur-md flex flex-col">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-fuchsia-500 grid place-items-center text-black font-black">T</div>
          <div className="leading-tight">
            <p className="font-bold tracking-wide text-sm">TÁNDEM <span className="text-cyan-400">·OPS</span></p>
            <p className="text-[10px] text-slate-400 font-mono">god-mode v1.0.0</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs">
          <Shield size={14} className="text-cyan-400" />
          <span className="font-mono text-slate-300">{userName}</span>
        </div>
        <Badge className="mt-2 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/10 font-mono text-[10px]">
          {clearance?.toUpperCase() || 'ROOT'}
        </Badge>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(n => (
          <button
            key={n.id}
            onClick={() => setSection(n.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-mono transition-all ${
              section === n.id
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
            }`}
          >
            <n.icon size={16} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-800 space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono text-slate-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> ONLINE · 247 nodes
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-rose-300 hover:bg-rose-500/10 font-mono">
          <LogOut size={16} /> exit_session()
        </button>
      </div>
    </aside>
  );
}

function TopBar({ section }: { section: SectionId }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="sticky top-0 z-30 border-b border-slate-800 bg-[#0a0e1a]/80 backdrop-blur px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Terminal size={16} className="text-cyan-400" />
        <span className="font-mono text-xs text-slate-400">~/tandem/admin/</span>
        <span className="font-mono text-xs text-cyan-300">{section}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800/60 border border-slate-700">
          <Search size={12} className="text-slate-500" />
          <input placeholder="cmd+k · query anything" className="bg-transparent text-xs font-mono outline-none w-56 placeholder:text-slate-600" />
        </div>
        <span className="font-mono text-xs text-slate-400">{now.toISOString().replace('T', ' ').slice(0, 19)} UTC</span>
        <span className="flex items-center gap-1 text-xs font-mono text-emerald-400">
          <Zap size={12} /> 12ms
        </span>
      </div>
    </div>
  );
}

// =================================================================
// OVERVIEW
// =================================================================
function OverviewSection() {
  const totalUsers = users.length + tutors.length + professionals.length;
  const kpis = [
    { label: 'TOTAL ACCOUNTS', value: totalUsers, delta: '+12.4%', icon: Users, color: 'cyan' },
    { label: 'ACTIVE NOW', value: 184, delta: '+3.1%', icon: ActivityIcon, color: 'emerald' },
    { label: 'EVENTS / MIN', value: '2,431', delta: '+8.7%', icon: Flame, color: 'fuchsia' },
    { label: 'ACTIVITIES', value: activities.length + '+', delta: '+22%', icon: Box, color: 'amber' },
    { label: 'ERROR RATE', value: '0.04%', delta: '-0.02', icon: AlertTriangle, color: 'rose' },
    { label: 'P95 LATENCY', value: '142ms', delta: '-12ms', icon: Zap, color: 'sky' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map(k => <KPI key={k.label} {...k} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Sessions & Events · last 48h" subtitle="real-time aggregation" className="xl:col-span-2 h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={seriesArea}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(190 90% 55%)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(190 90% 55%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(270 80% 65%)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(270 80% 65%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.1)" strokeDasharray="3 3" />
              <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip contentStyle={{ background: '#0d1322', border: '1px solid #1e293b', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }} />
              <Area type="monotone" dataKey="events" stroke="hsl(270 80% 65%)" fill="url(#g2)" strokeWidth={1.5} />
              <Area type="monotone" dataKey="sessions" stroke="hsl(190 90% 55%)" fill="url(#g1)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Account distribution" subtitle="by role" className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={seriesPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                {seriesPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#0a0e1a" strokeWidth={2} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0d1322', border: '1px solid #1e293b', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Tool usage · this vs prev. week" className="xl:col-span-2 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seriesBars}>
              <CartesianGrid stroke="rgba(148,163,184,0.1)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip contentStyle={{ background: '#0d1322', border: '1px solid #1e293b', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
              <Bar dataKey="a" name="this week" fill="hsl(190 90% 55%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="b" name="prev week" fill="hsl(270 80% 65%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Platform health" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={RADAR}>
              <PolarGrid stroke="rgba(148,163,184,0.2)" />
              <PolarAngleAxis dataKey="k" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} />
              <PolarRadiusAxis tick={{ fill: '#475569', fontSize: 9 }} />
              <Radar dataKey="v" stroke="hsl(190 90% 55%)" fill="hsl(190 90% 55%)" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Engagement scatter · session_time × completion_rate" subtitle="bubble = events" className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid stroke="rgba(148,163,184,0.1)" strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" name="session_time" unit="m" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
            <YAxis type="number" dataKey="y" name="completion" unit="%" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#0d1322', border: '1px solid #1e293b', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }} />
            <Scatter data={seriesScatter} fill="hsl(330 80% 60%)" />
          </ScatterChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

function KPI({ label, value, delta, icon: Icon, color }: any) {
  const colorMap: any = {
    cyan: 'from-cyan-400/20 to-cyan-500/5 text-cyan-300 border-cyan-500/30',
    emerald: 'from-emerald-400/20 to-emerald-500/5 text-emerald-300 border-emerald-500/30',
    fuchsia: 'from-fuchsia-400/20 to-fuchsia-500/5 text-fuchsia-300 border-fuchsia-500/30',
    amber: 'from-amber-400/20 to-amber-500/5 text-amber-300 border-amber-500/30',
    rose: 'from-rose-400/20 to-rose-500/5 text-rose-300 border-rose-500/30',
    sky: 'from-sky-400/20 to-sky-500/5 text-sky-300 border-sky-500/30',
  };
  return (
    <div className={`rounded-lg border bg-gradient-to-br p-3 ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono tracking-wider text-slate-400">{label}</span>
        <Icon size={14} />
      </div>
      <div className="mt-1 text-2xl font-bold font-mono">{value}</div>
      <div className="text-[10px] font-mono opacity-80">{delta} vs 24h</div>
    </div>
  );
}

function Panel({ title, subtitle, children, className = '' }: any) {
  return (
    <div className={`rounded-lg border border-slate-800 bg-[#0d1322]/80 ${className}`}>
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-mono text-slate-200 tracking-wider">{title}</h3>
          {subtitle && <p className="text-[10px] font-mono text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <RefreshCw size={12} className="cursor-pointer hover:text-cyan-300" />
          <Download size={12} className="cursor-pointer hover:text-cyan-300" />
        </div>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

// =================================================================
// LIVE FEED
// =================================================================
const FEED_TEMPLATES = [
  { type: 'AUTH', tone: 'sky', tpl: (n: string) => `${n} → login.success` },
  { type: 'ACTV', tone: 'emerald', tpl: (n: string) => `${n} → activity.completed +20 coins` },
  { type: 'CHAT', tone: 'fuchsia', tpl: (n: string) => `${n} → message.sent (conv #${rid()})` },
  { type: 'SHOP', tone: 'amber', tpl: (n: string) => `${n} → shop.purchase item_${rid()}` },
  { type: 'EMOT', tone: 'rose', tpl: (n: string) => `${n} → emotion.logged "calm"` },
  { type: 'ROLE', tone: 'cyan', tpl: (n: string) => `${n} → role.assigned tutor→user` },
  { type: 'WARN', tone: 'amber', tpl: (n: string) => `rate_limit.warn ip=${rip()} user=${n}` },
  { type: 'ERR', tone: 'rose', tpl: (n: string) => `db.error retry attempt=${Math.floor(Math.random() * 3 + 1)}` },
];
function rid() { return Math.random().toString(36).slice(2, 7); }
function rip() { return [10, Math.random()*255, Math.random()*255, Math.random()*255].map(n => Math.floor(n)).join('.'); }

function LiveFeedSection() {
  const all = [...users, ...tutors, ...professionals];
  const [feed, setFeed] = useState<any[]>(() =>
    Array.from({ length: 20 }, () => makeEvent(all))
  );
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setFeed(prev => [makeEvent(all), ...prev].slice(0, 100));
    }, 1200);
    return () => clearInterval(id);
  }, [paused]);

  const filtered = filter === 'ALL' ? feed : feed.filter(f => f.type === filter);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Panel title="Live event stream" subtitle="DB → ingest → broadcast" className="xl:col-span-2">
        <div className="flex items-center gap-2 mb-3">
          <Button size="sm" variant="outline" className="h-7 border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200" onClick={() => setPaused(p => !p)}>
            <span className={`w-2 h-2 rounded-full mr-2 ${paused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            {paused ? 'PAUSED' : 'STREAMING'}
          </Button>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-7 w-32 bg-slate-800/50 border-slate-700 text-xs font-mono"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#0d1322] border-slate-700 text-slate-200 font-mono text-xs">
              <SelectItem value="ALL">ALL</SelectItem>
              {['AUTH', 'ACTV', 'CHAT', 'SHOP', 'EMOT', 'ROLE', 'WARN', 'ERR'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="ml-auto text-[10px] font-mono text-slate-500">{filtered.length} events buffered</span>
        </div>
        <div className="font-mono text-xs space-y-0.5 max-h-[520px] overflow-y-auto pr-2">
          {filtered.map(e => (
            <div key={e.id} className="flex gap-3 py-1 border-b border-slate-800/60 hover:bg-slate-800/30">
              <span className="text-slate-500 shrink-0 w-20">{e.t}</span>
              <span className={`shrink-0 w-12 text-${e.tone}-400`}>{e.type}</span>
              <span className="text-slate-300 truncate">{e.msg}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel title="Events / sec" subtitle="moving avg 5s" className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={seriesArea.slice(-20)}>
              <Line type="monotone" dataKey="events" stroke="hsl(190 90% 55%)" strokeWidth={2} dot={false} />
              <XAxis dataKey="t" hide />
              <YAxis hide />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Top emitters · 1h">
          <div className="space-y-2 font-mono text-xs">
            {users.slice(0, 6).map((u, i) => (
              <div key={u.id} className="flex items-center gap-2">
                <span className="text-slate-500 w-4">{i + 1}</span>
                <span className="text-slate-200 truncate flex-1">{u.username}</span>
                <span className="text-cyan-300">{Math.floor(120 - i * 14 + Math.random() * 10)} ev</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function makeEvent(all: any[]) {
  const u = all[Math.floor(Math.random() * all.length)];
  const tpl = FEED_TEMPLATES[Math.floor(Math.random() * FEED_TEMPLATES.length)];
  return {
    id: rid() + Date.now(),
    t: new Date().toISOString().slice(11, 19),
    type: tpl.type,
    tone: tpl.tone,
    msg: tpl.tpl(u.username || u.name),
  };
}

// =================================================================
// GEO MAP (simulated SVG world)
// =================================================================
const GEO_NODES = Array.from({ length: 38 }, (_, i) => ({
  id: i,
  x: 5 + Math.random() * 90,
  y: 10 + Math.random() * 75,
  size: 4 + Math.random() * 12,
  load: Math.random(),
  city: ['Buenos Aires', 'Madrid', 'CDMX', 'Bogotá', 'Santiago', 'Lima', 'NYC', 'SP', 'Berlín', 'Tokio', 'Sydney'][i % 11],
  users: Math.floor(20 + Math.random() * 800),
}));

function GeoMapSection() {
  const [hover, setHover] = useState<any>(null);
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
      <Panel title="Geo distribution · live traffic" subtitle="WebSocket regions" className="xl:col-span-3">
        <div className="relative w-full aspect-[2.2/1] rounded-md overflow-hidden border border-slate-800" style={{
          background:
            'radial-gradient(ellipse at 30% 40%, rgba(56,189,248,0.12), transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(168,85,247,0.10), transparent 60%), #060a14',
        }}>
          {/* grid */}
          <svg className="absolute inset-0 w-full h-full opacity-30">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          {/* simulated continents */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
            {[
              'M5,15 Q12,10 20,14 L24,22 Q18,28 12,26 Z',
              'M28,14 Q40,8 48,16 L46,28 Q36,32 30,26 Z',
              'M52,12 Q68,8 78,16 L80,30 Q66,32 56,28 Z',
              'M82,18 Q92,16 95,24 L92,32 Q86,32 82,28 Z',
              'M22,32 Q34,30 38,38 L32,46 Q22,46 20,40 Z',
              'M58,34 Q72,32 76,40 L70,46 Q60,46 58,42 Z',
            ].map((d, i) => <path key={i} d={d} fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.25)" strokeWidth="0.2" />)}
          </svg>
          {/* nodes */}
          {GEO_NODES.map(n => (
            <button
              key={n.id}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(null)}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
            >
              <span className="absolute inset-0 rounded-full animate-ping" style={{
                width: n.size, height: n.size,
                background: `hsla(${190 + n.load * 100}, 90%, 60%, 0.5)`,
              }} />
              <span className="block rounded-full" style={{
                width: n.size, height: n.size,
                background: `hsl(${190 + n.load * 100} 90% 60%)`,
                boxShadow: `0 0 ${n.size * 2}px hsl(${190 + n.load * 100} 90% 60%)`,
              }} />
            </button>
          ))}
          {hover && (
            <div className="absolute top-2 left-2 px-3 py-2 rounded-md border border-slate-700 bg-[#0d1322]/95 font-mono text-xs">
              <div className="text-cyan-300">{hover.city}</div>
              <div className="text-slate-400">users: {hover.users}</div>
              <div className="text-slate-400">load: {(hover.load * 100).toFixed(1)}%</div>
            </div>
          )}
          <div className="absolute bottom-2 right-2 flex items-center gap-2 font-mono text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> low
            <span className="w-2 h-2 rounded-full bg-fuchsia-400" /> high
          </div>
        </div>
      </Panel>

      <Panel title="Top regions">
        <div className="font-mono text-xs space-y-2">
          {GEO_NODES.slice(0, 11).sort((a, b) => b.users - a.users).slice(0, 8).map(n => (
            <div key={n.id} className="flex items-center gap-2">
              <MapIcon size={10} className="text-cyan-400" />
              <span className="text-slate-200 flex-1 truncate">{n.city}</span>
              <span className="text-slate-400">{n.users}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// =================================================================
// GOD BUILDER · create / inject anything
// =================================================================
function GodBuilderSection() {
  return (
    <Tabs defaultValue="activity" className="space-y-4">
      <TabsList className="bg-slate-800/60 border border-slate-700">
        <TabsTrigger value="activity" className="font-mono text-xs">Activity Model</TabsTrigger>
        <TabsTrigger value="cosmetic" className="font-mono text-xs">Design Asset</TabsTrigger>
        <TabsTrigger value="inject" className="font-mono text-xs">Inject to User</TabsTrigger>
        <TabsTrigger value="config" className="font-mono text-xs">System Config</TabsTrigger>
        <TabsTrigger value="ddl" className="font-mono text-xs">SQL / DDL</TabsTrigger>
      </TabsList>

      <TabsContent value="activity"><BuildActivityModel /></TabsContent>
      <TabsContent value="cosmetic"><BuildCosmetic /></TabsContent>
      <TabsContent value="inject"><InjectToUser /></TabsContent>
      <TabsContent value="config"><SystemConfig /></TabsContent>
      <TabsContent value="ddl"><DDLConsole /></TabsContent>
    </Tabs>
  );
}

function BuildActivityModel() {
  const { createOrUpdate, publish } = useCustomActivities();
  const [form, setForm] = useState({
    title: '', category: 'autonomía personal', type: 'guiada', difficulty: 'media',
    duration: 15, gameType: 'multipleChoice', steps: 4, reward: 30,
  });
  const submit = (publishNow: boolean) => {
    if (!form.title.trim()) return toast({ title: 'Falta título' });
    const created = createOrUpdate({
      title: form.title,
      description: `[GOD] ${form.gameType} model injected by superadmin`,
      category: form.category as any,
      type: form.type as any,
      difficulty: form.difficulty as any,
      duration: form.duration,
      icon: '⚡',
      steps: Array.from({ length: form.steps }, (_, i) => ({ id: `s${i}`, text: `Paso ${i + 1}`, pictogram: '✨' })),
      assignedTo: '*',
      createdBy: 'admin',
      published: publishNow,
    } as any);
    if (publishNow && created) publish(created.id);
    toast({ title: publishNow ? 'Modelo publicado globalmente' : 'Borrador creado' });
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Panel title="Activity model factory" subtitle="injects into custom_activities table" className="lg:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
          <Field label="title"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-slate-800/50 border-slate-700 h-9" /></Field>
          <Field label="category">
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 h-9"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0d1322] border-slate-700 text-slate-200">
                {['autonomía personal','higiene','organización','escuela','cocina básica','transporte','compras','emociones','comunicación','vida social'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="type">
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 h-9"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0d1322] border-slate-700 text-slate-200">
                {['guiada','juego','decisión','regulación'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="difficulty">
            <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 h-9"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0d1322] border-slate-700 text-slate-200">
                {['fácil','media','difícil'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="duration_min"><Input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: +e.target.value })} className="bg-slate-800/50 border-slate-700 h-9" /></Field>
          <Field label="steps"><Input type="number" value={form.steps} onChange={e => setForm({ ...form, steps: +e.target.value })} className="bg-slate-800/50 border-slate-700 h-9" /></Field>
          <Field label="game_type">
            <Select value={form.gameType} onValueChange={v => setForm({ ...form, gameType: v })}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 h-9"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0d1322] border-slate-700 text-slate-200">
                {['multipleChoice','dragWord','wordWheel','memory','sequenceOrder','trueFalse','count','fillBlank','matchPairs','categorize','sound','multiSelect'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="reward_coins"><Input type="number" value={form.reward} onChange={e => setForm({ ...form, reward: +e.target.value })} className="bg-slate-800/50 border-slate-700 h-9" /></Field>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={() => submit(false)} variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200 font-mono text-xs">save_draft()</Button>
          <Button onClick={() => submit(true)} className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs"><Sparkles size={12} className="mr-1" />deploy_global()</Button>
        </div>
      </Panel>
      <Panel title="Schema preview" subtitle="JSON payload">
        <pre className="text-[10px] font-mono text-cyan-200 whitespace-pre-wrap break-all">{JSON.stringify(form, null, 2)}</pre>
      </Panel>
    </div>
  );
}

function BuildCosmetic() {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎩');
  const [cat, setCat] = useState<'pelo'|'accesorio'|'ropa'|'fondo'|'mascota'>('accesorio');
  const [price, setPrice] = useState(120);
  const [rarity, setRarity] = useState<'common'|'rare'|'epic'|'legendary'>('rare');
  const create = () => {
    if (!name) return toast({ title: 'Falta nombre' });
    const item = {
      id: 'god_' + Date.now(),
      name, emoji, category: cat, price, rarity,
    };
    const raw = localStorage.getItem('tandem:custom-shop:v1');
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(item);
    localStorage.setItem('tandem:custom-shop:v1', JSON.stringify(arr));
    toast({ title: 'Cosmético inyectado en la tienda', description: name });
    setName('');
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Panel title="Cosmetic factory" subtitle="shop_items.insert" className="lg:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="name"><Input value={name} onChange={e => setName(e.target.value)} className="bg-slate-800/50 border-slate-700 h-9" /></Field>
          <Field label="emoji"><Input value={emoji} onChange={e => setEmoji(e.target.value)} className="bg-slate-800/50 border-slate-700 h-9" /></Field>
          <Field label="category">
            <Select value={cat} onValueChange={v => setCat(v as any)}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 h-9"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0d1322] border-slate-700 text-slate-200">
                {['pelo','accesorio','ropa','fondo','mascota'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="rarity">
            <Select value={rarity} onValueChange={v => setRarity(v as any)}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 h-9"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0d1322] border-slate-700 text-slate-200">
                {['common','rare','epic','legendary'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="price_coins"><Input type="number" value={price} onChange={e => setPrice(+e.target.value)} className="bg-slate-800/50 border-slate-700 h-9" /></Field>
        </div>
        <Button onClick={create} className="mt-4 bg-fuchsia-500 hover:bg-fuchsia-400 text-black font-mono text-xs"><Plus size={12} className="mr-1" />push_to_shop()</Button>
      </Panel>
      <Panel title="Preview">
        <div className="aspect-square rounded-md border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 grid place-items-center text-7xl">{emoji}</div>
        <div className="mt-3 text-xs font-mono space-y-1 text-slate-300">
          <div>{name || '<unnamed>'}</div>
          <div className="text-slate-500">{cat} · {rarity} · {price}🪙</div>
        </div>
      </Panel>
    </div>
  );
}

function InjectToUser() {
  const [target, setTarget] = useState('');
  const [coins, setCoins] = useState(500);
  const [op, setOp] = useState<'coins'|'level'|'badge'|'role'|'flag'>('coins');
  const [val, setVal] = useState('');
  const all = [...users, ...tutors, ...professionals];
  const inject = () => {
    if (!target) return toast({ title: 'Selecciona usuario' });
    if (op === 'coins') {
      const key = `tandem:wallet:${target}`;
      const raw = localStorage.getItem(key);
      const w = raw ? JSON.parse(raw) : { coins: 0, ownedItems: [], equipped: {} };
      w.coins = (w.coins || 0) + coins;
      localStorage.setItem(key, JSON.stringify(w));
      toast({ title: `+${coins} 🪙 inyectados a ${target}` });
    } else {
      toast({ title: `Op ${op} aplicado`, description: `${target}: ${val}` });
    }
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="User inject console" subtitle="direct write · no validation">
        <div className="space-y-3">
          <Field label="target_user_id">
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 h-9"><SelectValue placeholder="select user" /></SelectTrigger>
              <SelectContent className="bg-[#0d1322] border-slate-700 text-slate-200 max-h-72">
                {all.map(u => <SelectItem key={u.id} value={u.id}>{u.id} · {u.username}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="operation">
            <Select value={op} onValueChange={v => setOp(v as any)}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 h-9"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0d1322] border-slate-700 text-slate-200">
                <SelectItem value="coins">grant_coins</SelectItem>
                <SelectItem value="level">set_level</SelectItem>
                <SelectItem value="badge">unlock_badge</SelectItem>
                <SelectItem value="role">change_role</SelectItem>
                <SelectItem value="flag">set_feature_flag</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {op === 'coins'
            ? <Field label="amount"><Input type="number" value={coins} onChange={e => setCoins(+e.target.value)} className="bg-slate-800/50 border-slate-700 h-9" /></Field>
            : <Field label="value"><Input value={val} onChange={e => setVal(e.target.value)} className="bg-slate-800/50 border-slate-700 h-9" /></Field>
          }
          <Button onClick={inject} className="bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs w-full"><Zap size={12} className="mr-1" /> execute_injection()</Button>
        </div>
      </Panel>
      <Panel title="Bulk operations">
        <div className="space-y-2 font-mono text-xs">
          {[
            { l: 'Reset all wallets to 0', t: 'rose' },
            { l: 'Grant 1000 coins to all premium', t: 'amber' },
            { l: 'Mark all activities as completed', t: 'cyan' },
            { l: 'Wipe localStorage cache', t: 'fuchsia' },
            { l: 'Re-seed mock dataset', t: 'sky' },
            { l: 'Force logout all sessions', t: 'rose' },
          ].map(b => (
            <button key={b.l} className={`w-full text-left px-3 py-2 rounded-md border border-slate-700 hover:border-${b.t}-500/50 hover:bg-${b.t}-500/10 transition`} onClick={() => toast({ title: b.l, description: 'queued' })}>
              <span className="text-slate-300">{b.l}</span>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function SystemConfig() {
  const [flags, setFlags] = useState([
    { k: 'feature.miniGames.v2', v: true },
    { k: 'feature.aiSuggestions', v: true },
    { k: 'feature.shop.experimentalItems', v: false },
    { k: 'feature.subscription.paywall', v: true },
    { k: 'maintenance.mode', v: false },
    { k: 'limits.dailyActivities', v: true },
    { k: 'analytics.collectTelemetry', v: true },
  ]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="Feature flags · runtime" subtitle="hot-swap, no deploy">
        <div className="space-y-2">
          {flags.map((f, i) => (
            <div key={f.k} className="flex items-center justify-between px-3 py-2 rounded-md border border-slate-700/60 bg-slate-800/30 font-mono text-xs">
              <span className="text-slate-300">{f.k}</span>
              <Switch checked={f.v} onCheckedChange={(v) => { const next = [...flags]; next[i] = { ...f, v }; setFlags(next); toast({ title: `${f.k} = ${v}` }); }} />
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Environment vars">
        <pre className="text-[10px] font-mono text-emerald-300 leading-relaxed">
{`NODE_ENV=production
APP_VERSION=1.4.2
DB_POOL_MAX=80
WS_REGION=us-east-1
RATE_LIMIT_RPS=240
LOG_LEVEL=info
FEATURE_GOD_MODE=true
TELEMETRY_ENDPOINT=https://t.tandem.app/v1`}
        </pre>
      </Panel>
    </div>
  );
}

function DDLConsole() {
  const [sql, setSql] = useState(`-- god mode ddl console\nSELECT id, username, role, plan FROM users WHERE plan = 'premium' ORDER BY points DESC LIMIT 10;`);
  const [out, setOut] = useState<string>('// ready · execute to query mock backend');
  const exec = () => {
    setOut(`[ok] 0.018s · 10 rows\n` + users.filter(u => u.plan === 'premium').slice(0, 10).map(u => `${u.id}\t${u.username}\t${u.role}\t${u.plan}\t${u.points}`).join('\n'));
  };
  return (
    <Panel title="SQL / DDL console" subtitle="readonly preview against mock store">
      <Textarea value={sql} onChange={e => setSql(e.target.value)} rows={6} className="font-mono text-xs bg-[#060a14] border-slate-700 text-cyan-200" />
      <div className="flex gap-2 mt-3">
        <Button onClick={exec} className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs"><Code2 size={12} className="mr-1" />execute()</Button>
        <Button variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200 font-mono text-xs">explain()</Button>
      </div>
      <pre className="mt-3 text-[10px] font-mono text-emerald-300 bg-[#060a14] border border-slate-800 rounded-md p-3 whitespace-pre-wrap max-h-72 overflow-auto">{out}</pre>
    </Panel>
  );
}

function Field({ label, children }: any) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-mono text-slate-500 tracking-wider">{label}</Label>
      {children}
    </div>
  );
}

// =================================================================
// DATA TABLES · accounts
// =================================================================
function DataTablesSection() {
  const all = useMemo(() => [
    ...users.map(u => ({ ...u, kind: 'user' })),
    ...tutors.map(u => ({ ...u, kind: 'tutor' })),
    ...professionals.map(u => ({ ...u, kind: 'professional' })),
    ...admins.map(u => ({ ...u, kind: 'admin' })),
  ], []);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<string>('all');
  const [plan, setPlan] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [page, setPage] = useState(0);
  const PAGE = 10;

  const filtered = all
    .filter(u => role === 'all' ? true : u.kind === role)
    .filter(u => plan === 'all' ? true : (u as any).plan === plan)
    .filter(u => !q || u.username.toLowerCase().includes(q.toLowerCase()) || u.name.toLowerCase().includes(q.toLowerCase()) || u.id.includes(q));

  const sorted = [...filtered].sort((a: any, b: any) => {
    const av = a[sortKey] ?? ''; const bv = b[sortKey] ?? '';
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
  const paged = sorted.slice(page * PAGE, page * PAGE + PAGE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE));

  const toggleSort = (k: string) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  };

  return (
    <Panel title="accounts · master table" subtitle={`${filtered.length} rows · admin write access`}>
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2 px-2 rounded-md bg-slate-800/50 border border-slate-700 flex-1 min-w-[200px]">
          <Search size={12} className="text-slate-500" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="search id, username, name…" className="bg-transparent outline-none text-xs font-mono py-2 flex-1 placeholder:text-slate-600" />
        </div>
        <Select value={role} onValueChange={v => { setRole(v); setPage(0); }}>
          <SelectTrigger className="h-9 w-36 bg-slate-800/50 border-slate-700 font-mono text-xs"><Filter size={12} className="mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent className="bg-[#0d1322] border-slate-700 text-slate-200 font-mono text-xs">
            <SelectItem value="all">all roles</SelectItem>
            <SelectItem value="user">user</SelectItem>
            <SelectItem value="tutor">tutor</SelectItem>
            <SelectItem value="professional">professional</SelectItem>
            <SelectItem value="admin">admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={plan} onValueChange={v => { setPlan(v); setPage(0); }}>
          <SelectTrigger className="h-9 w-32 bg-slate-800/50 border-slate-700 font-mono text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-[#0d1322] border-slate-700 text-slate-200 font-mono text-xs">
            <SelectItem value="all">all plans</SelectItem>
            <SelectItem value="free">free</SelectItem>
            <SelectItem value="premium">premium</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="h-9 border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800 font-mono text-xs"><Download size={12} className="mr-1" />export.csv</Button>
      </div>

      <div className="rounded-md border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              {['id','username','name','kind','plan','points'].map(k => (
                <TableHead key={k} className="text-[10px] font-mono text-slate-500 cursor-pointer" onClick={() => toggleSort(k)}>
                  <span className="inline-flex items-center gap-1">{k.toUpperCase()} <ArrowUpDown size={10} /></span>
                </TableHead>
              ))}
              <TableHead className="text-[10px] font-mono text-slate-500 text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((u: any) => (
              <TableRow key={u.id} className="border-slate-800 hover:bg-slate-800/30 font-mono text-xs">
                <TableCell className="text-cyan-300">{u.id}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell className="text-slate-300">{u.name}</TableCell>
                <TableCell><Badge className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-800 capitalize font-mono">{u.kind}</Badge></TableCell>
                <TableCell>{u.plan ? <Badge className={`font-mono ${u.plan === 'premium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-700/50 text-slate-400 border-slate-700'}`}>{u.plan}</Badge> : <span className="text-slate-600">—</span>}</TableCell>
                <TableCell className="text-emerald-300">{u.points ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <RowActions row={u} />
                </TableCell>
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow className="border-slate-800"><TableCell colSpan={7} className="text-center text-slate-500 font-mono text-xs py-8">no rows</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-3 font-mono text-xs text-slate-400">
        <span>page {page + 1}/{totalPages}</span>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-7 border-slate-700 bg-slate-800/50 text-slate-200" onClick={() => setPage(p => Math.max(0, p - 1))}>‹ prev</Button>
          <Button size="sm" variant="outline" className="h-7 border-slate-700 bg-slate-800/50 text-slate-200" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>next ›</Button>
        </div>
      </div>
    </Panel>
  );
}

function RowActions({ row }: any) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="inline-flex items-center gap-1">
        <button onClick={() => setOpen(true)} className="p-1 rounded hover:bg-slate-700 text-cyan-300"><Eye size={12} /></button>
        <button onClick={() => toast({ title: `editing ${row.id}` })} className="p-1 rounded hover:bg-slate-700 text-amber-300"><Edit size={12} /></button>
        <button onClick={() => toast({ title: `${row.id} suspended` })} className="p-1 rounded hover:bg-slate-700 text-rose-300"><Ban size={12} /></button>
      </div>
      <DialogContent className="bg-[#0d1322] border-slate-700 text-slate-200 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-cyan-300 flex items-center gap-2"><Database size={14} /> account.inspect({row.id})</DialogTitle>
          <DialogDescription className="font-mono text-xs text-slate-500">raw record · god-mode read</DialogDescription>
        </DialogHeader>
        <pre className="font-mono text-[10px] text-emerald-300 bg-[#060a14] border border-slate-800 rounded-md p-3 max-h-[60vh] overflow-auto whitespace-pre-wrap">{JSON.stringify(row, null, 2)}</pre>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-200 font-mono text-xs">close()</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =================================================================
// SYSTEM
// =================================================================
function SystemSection() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Panel title="Infra · nodes" className="xl:col-span-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Array.from({ length: 16 }).map((_, i) => {
            const ok = Math.random() > 0.1;
            return (
              <div key={i} className={`rounded-md p-3 border font-mono text-[10px] ${ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">node-{(i + 1).toString().padStart(2, '0')}</span>
                  <Server size={10} className={ok ? 'text-emerald-400' : 'text-rose-400'} />
                </div>
                <div className="mt-1 text-slate-500">cpu {(20 + Math.random() * 60).toFixed(0)}% · mem {(30 + Math.random() * 50).toFixed(0)}%</div>
                <div className={ok ? 'text-emerald-400' : 'text-rose-400'}>{ok ? 'healthy' : 'degraded'}</div>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title="Storage">
        <div className="space-y-3 font-mono text-xs">
          {[
            { k: 'postgres.primary', used: 64, max: 100, color: 'cyan' },
            { k: 'redis.cache', used: 22, max: 100, color: 'emerald' },
            { k: 's3.media', used: 81, max: 100, color: 'amber' },
            { k: 'logs.cold', used: 47, max: 100, color: 'fuchsia' },
          ].map(s => (
            <div key={s.k}>
              <div className="flex justify-between"><span className="text-slate-300">{s.k}</span><span className="text-slate-500">{s.used}%</span></div>
              <div className="h-1.5 rounded-full bg-slate-800 mt-1 overflow-hidden">
                <div className={`h-full bg-${s.color}-400`} style={{ width: `${s.used}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Recent deploys" className="xl:col-span-3">
        <div className="font-mono text-xs space-y-1">
          {[
            ['12:04:22', 'v1.4.2', 'cyan', 'release/god-mode-builder · 28 files'],
            ['09:51:10', 'v1.4.1', 'emerald', 'hotfix/auth-redirect'],
            ['Mon 18:20', 'v1.4.0', 'fuchsia', 'feature/minigames-engine'],
            ['Mon 11:02', 'v1.3.9', 'amber', 'chore/dep-bump'],
            ['Sun 22:14', 'v1.3.8', 'sky', 'feature/accessibility-userway'],
          ].map(([t, v, c, msg]) => (
            <div key={t} className="flex gap-3 border-b border-slate-800/60 py-1">
              <span className="text-slate-500 w-24">{t}</span>
              <span className={`text-${c}-300 w-16`}>{v}</span>
              <span className="text-slate-300">{msg}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
