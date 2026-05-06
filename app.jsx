import React, { useState, useEffect } from 'react';
import { Home, ListTodo, Trophy, Settings, LogOut, Clock, CheckCircle2, ChevronRight, Activity, Shield } from 'lucide-react';

// ==========================================
// CONFIGURACIÓN: URL de Google Apps Script
// ==========================================
// Reemplaza esta cadena con la URL que te dará Google Apps Script al desplegar
const GAS_URL = ""; // Ejemplo: "https://script.google.com/macros/s/AKfycbwV95wRSSAntK-30SKHRBIgjYQizC7WcBWOTSc5G3Br6faMmUEYowf5fuVU4HPXciWd/exec"

// ==========================================
// MOCK DATA (Para vista previa sin backend)
// ==========================================
const MOCK_MATCHES = [
  { id: 1, local: "Brasil", visitor: "Argentina", date: new Date(Date.now() + 86400000).toISOString(), local_goals: null, visitor_goals: null, status: "pending" },
  { id: 2, local: "Colombia", visitor: "Uruguay", date: new Date(Date.now() - 86400000).toISOString(), local_goals: 2, visitor_goals: 1, status: "finished" },
  { id: 3, local: "España", visitor: "Alemania", date: new Date(Date.now() + 172800000).toISOString(), local_goals: null, visitor_goals: null, status: "pending" },
];

const MOCK_PREDICTIONS = [
  { match_id: 2, local_goals: 2, visitor_goals: 0 } // Predicción pasada
];

const MOCK_RANKING = [
  { rank: 1, name: "Carlos M.", points: 15, average: 3.5 },
  { rank: 2, name: "Ana Gomez", points: 12, average: 2.8 },
  { rank: 3, name: "Tú (Demo)", points: 5, average: 2.5 },
];

export default function App() {
  const [user, setUser] = useState(null); // null = no logueado
  const [loading, setLoading] = useState(false);

  // Login simple simulado o real
  const handleLogin = async (username, password) => {
    setLoading(true);
    if (GAS_URL) {
      try {
        const res = await fetch(GAS_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'login', username, password })
        });
        const data = await res.json();
        if (data.success) setUser(data.user);
        else alert("Credenciales incorrectas");
      } catch (err) {
        alert("Error conectando al servidor");
      }
    } else {
      // Modo Demo
      setTimeout(() => {
        if (username === 'admin') setUser({ username, role: 'admin', name: "Administrador" });
        else setUser({ username, role: 'player', name: "Jugador Demo" });
        setLoading(false);
      }, 800);
    }
  };

  if (!user) return <LoginScreen onLogin={handleLogin} loading={loading} />;

  return <MainDashboard user={user} onLogout={() => setUser(null)} />;
}

// ==========================================
// PANTALLA DE LOGIN
// ==========================================
function LoginScreen({ onLogin, loading }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white p-8 rounded-2xl shadow-lg shadow-slate-200/50 w-full max-w-md transition-all duration-300 transform hover:shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-inner">
            <Trophy className="text-white w-8 h-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Polla Mundialista</h1>
        <p className="text-center text-slate-500 mb-8 text-sm">Ingresa para predecir y ganar</p>
        
        <form onSubmit={(e) => { e.preventDefault(); onLogin(username, password); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
              placeholder="Ej: juanperez"
              value={username} onChange={e => setUsername(e.target.value)} required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Activity className="animate-spin w-5 h-5" /> : 'Ingresar'}
          </button>
          {!GAS_URL && <p className="text-xs text-center text-orange-500 mt-4">Modo Demo Activo (Usa "admin" para ver panel admin)</p>}
        </form>
      </div>
    </div>
  );
}

// ==========================================
// DASHBOARD PRINCIPAL Y NAVEGACIÓN
// ==========================================
function MainDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  
  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Trophy className="text-blue-600 w-6 h-6" />
          <h1 className="font-bold text-lg text-slate-900 tracking-tight">MundialPlay</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{user.name}</span>
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="p-4 max-w-3xl mx-auto animate-fade-in">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'predictions' && <PredictionsTab user={user} />}
        {activeTab === 'ranking' && <RankingTab />}
        {activeTab === 'admin' && user.role === 'admin' && <AdminTab />}
      </main>

      {/* Navegación Inferior (Mobile First) */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around max-w-md mx-auto">
          <NavItem icon={<Home />} label="Inicio" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={<ListTodo />} label="Pronósticos" active={activeTab === 'predictions'} onClick={() => setActiveTab('predictions')} />
          <NavItem icon={<Trophy />} label="Ranking" active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} />
          {user.role === 'admin' && (
            <NavItem icon={<Settings />} label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
          )}
        </div>
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full py-3 transition-colors duration-200 ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <div className={`mb-1 transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </button>
  );
}

// ==========================================
// PESTAÑA 1: INICIO
// ==========================================
function HomeTab() {
  const [nextMatch, setNextMatch] = useState(MOCK_MATCHES[0]);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    // Lógica simple de countdown
    const timer = setInterval(() => {
      if (!nextMatch) return;
      const diff = new Date(nextMatch.date).getTime() - new Date().getTime();
      if (diff <= 0) { setTimeLeft('En juego'); return; }
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${d}d ${h}h ${m}m`);
    }, 1000);
    return () => clearInterval(timer);
  }, [nextMatch]);

  return (
    <div className="space-y-6">
      {/* Banner Anuncio / Bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-20">
          <Trophy className="w-40 h-40" />
        </div>
        <h2 className="text-2xl font-bold mb-1 relative z-10">¡Demuestra lo que sabes!</h2>
        <p className="text-blue-100 mb-4 relative z-10 text-sm">Acierta resultados exactos para sumar más puntos.</p>
        <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm shadow-sm hover:bg-blue-50 transition-colors relative z-10">
          Ver mis puntos
        </button>
      </div>

      {/* Próximo Partido */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Próximo Partido
        </h3>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="text-center text-xs font-semibold text-orange-500 mb-4 bg-orange-50 inline-block px-3 py-1 rounded-full mx-auto table">
            Falta: {timeLeft}
          </div>
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-center w-1/3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl shadow-inner mb-2">🇧🇷</div>
              <span className="font-bold text-slate-800 text-sm">{nextMatch.local}</span>
            </div>
            <div className="w-1/3 text-center">
              <span className="text-slate-400 font-bold">VS</span>
            </div>
            <div className="flex flex-col items-center w-1/3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl shadow-inner mb-2">🇦🇷</div>
              <span className="font-bold text-slate-800 text-sm">{nextMatch.visitor}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// PESTAÑA 2: PRONÓSTICOS
// ==========================================
function PredictionsTab({ user }) {
  const [predictions, setPredictions] = useState(MOCK_PREDICTIONS);
  const [saving, setSaving] = useState(false);

  const handleGoalChange = (matchId, team, value) => {
    const val = parseInt(value);
    if (isNaN(val) || val < 0) return;
    
    setPredictions(prev => {
      const existing = prev.find(p => p.match_id === matchId);
      if (existing) {
        return prev.map(p => p.match_id === matchId ? { ...p, [team]: val } : p);
      }
      return [...prev, { match_id: matchId, local_goals: team === 'local_goals' ? val : 0, visitor_goals: team === 'visitor_goals' ? val : 0 }];
    });
  };

  const handleSave = () => {
    setSaving(true);
    // Simulación de guardado
    setTimeout(() => {
      setSaving(false);
      // Aquí iría el fetch real a Apps Script
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Tus Pronósticos</h2>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          {saving ? <Activity className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {saving ? 'Guardando...' : 'Guardar Todo'}
        </button>
      </div>

      {MOCK_MATCHES.map((match) => {
        const isLocked = new Date(match.date).getTime() < new Date().getTime();
        const pred = predictions.find(p => p.match_id === match.id) || { local_goals: '', visitor_goals: '' };

        return (
          <div key={match.id} className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 transition-opacity ${isLocked ? 'opacity-75 bg-slate-50' : ''}`}>
            <div className="text-xs text-center text-slate-400 mb-3 font-medium">
              {new Date(match.date).toLocaleDateString()} - {new Date(match.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              {isLocked && <span className="ml-2 text-red-500 flex items-center justify-center gap-1 mt-1"><Shield className="w-3 h-3"/> Partido Cerrado</span>}
            </div>
            
            <div className="flex justify-between items-center gap-4">
              <div className="flex flex-col items-center flex-1">
                <span className="font-semibold text-slate-800 mb-2 truncate w-full text-center">{match.local}</span>
                <input 
                  type="number" 
                  min="0"
                  disabled={isLocked}
                  value={pred.local_goals}
                  onChange={(e) => handleGoalChange(match.id, 'local_goals', e.target.value)}
                  className="w-16 h-14 text-center text-2xl font-bold bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-200 disabled:text-slate-500"
                />
              </div>
              
              <div className="text-slate-300 font-bold text-xl">-</div>
              
              <div className="flex flex-col items-center flex-1">
                <span className="font-semibold text-slate-800 mb-2 truncate w-full text-center">{match.visitor}</span>
                <input 
                  type="number" 
                  min="0"
                  disabled={isLocked}
                  value={pred.visitor_goals}
                  onChange={(e) => handleGoalChange(match.id, 'visitor_goals', e.target.value)}
                  className="w-16 h-14 text-center text-2xl font-bold bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-200 disabled:text-slate-500"
                />
              </div>
            </div>
            
            {/* Si el partido terminó, mostrar resultado real */}
            {match.status === 'finished' && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                <span className="text-slate-500">Resultado real:</span>
                <span className="font-bold text-emerald-600">{match.local_goals} - {match.visitor_goals}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// PESTAÑA 3: RANKING
// ==========================================
function RankingTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Ranking Global</h2>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-2 text-center">#</div>
          <div className="col-span-6">Jugador</div>
          <div className="col-span-4 text-center">Puntos</div>
        </div>
        
        {MOCK_RANKING.map((player, index) => (
          <div key={index} className="grid grid-cols-12 p-4 items-center border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
            <div className="col-span-2 flex justify-center">
              {index === 0 ? <span className="w-8 h-8 flex items-center justify-center bg-yellow-100 text-yellow-600 rounded-full font-bold">1</span> :
               index === 1 ? <span className="w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-600 rounded-full font-bold">2</span> :
               index === 2 ? <span className="w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full font-bold">3</span> :
               <span className="text-slate-400 font-bold">{player.rank}</span>}
            </div>
            <div className="col-span-6 font-semibold text-slate-800">{player.name}</div>
            <div className="col-span-4 flex flex-col items-center">
              <span className="font-bold text-blue-600 text-lg">{player.points}</span>
              <span className="text-[10px] text-slate-400">Prom: {player.average}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// PESTAÑA 4: ADMIN (Solo visible para admins)
// ==========================================
function AdminTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Panel de Administración</h2>
      
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Crear Jugador</h3>
        <div className="space-y-3">
          <input type="text" placeholder="Nombre completo" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none" />
          <input type="text" placeholder="Usuario" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none" />
          <input type="password" placeholder="Contraseña inicial" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none" />
          <button className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
            Crear Usuario
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Actualizar Resultados Reales</h3>
        <p className="text-xs text-slate-500 mb-4">Ingresa los goles para actualizar rankings automáticamente.</p>
        
        {MOCK_MATCHES.filter(m => m.status === 'pending').map(match => (
          <div key={match.id} className="flex items-center gap-3 mb-3 p-3 bg-slate-50 rounded-xl">
            <span className="text-sm font-semibold flex-1 truncate text-right">{match.local}</span>
            <input type="number" className="w-12 h-10 text-center border border-slate-200 rounded-lg outline-none" placeholder="-" />
            <span className="text-slate-400">-</span>
            <input type="number" className="w-12 h-10 text-center border border-slate-200 rounded-lg outline-none" placeholder="-" />
            <span className="text-sm font-semibold flex-1 truncate">{match.visitor}</span>
            <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
              <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}