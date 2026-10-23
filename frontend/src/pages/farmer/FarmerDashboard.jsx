import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Sprout,
  User as UserIcon,
  Map as MapIcon,
  Search,
  Droplets,
  Leaf,
  LineChart,
  Beaker,
  CloudRain,
  Sun,
  CloudSun,
  Moon,
  ScanSearch,
  MapPin,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Zap,
  Sparkles
} from 'lucide-react';
import { agronomistAPI, weatherAPI, cropAPI, marketAPI } from '../../services/api';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import LocationPromptModal from '../../components/LocationPromptModal';

// ── Fix Leaflet default icon issue with Vite ───────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ── Custom map icons (using SVG paths from Lucide) ──────────────────────────
const farmerIcon = L.divIcon({
  html: `<div style="background:#166534;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);color:white">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg>
  </div>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20],
});

// ── AI Farming tips rotation ───────────────────────────────────────────────
const FARMING_TIPS = [
  { icon: Search, tip: 'Regularly inspect your crops for early signs of disease — catching problems early can save up to 70% of your harvest.', label: 'Disease Prevention' },
  { icon: Droplets, tip: 'Water your crops in the early morning or evening to reduce evaporation loss by up to 30% during hot seasons.', label: 'Smart Irrigation' },
  { icon: Leaf, tip: 'Apply organic compost before the sowing season to improve soil health and reduce fertilizer costs by 25%.', label: 'Soil Health' },
  { icon: LineChart, tip: 'Monitor mandi prices weekly before harvest to choose the best time to sell — prices can vary by 40% within a month.', label: 'Market Intelligence' },
  { icon: Beaker, tip: 'Conduct soil testing every 2 years to understand nutrient levels — over-fertilizing wastes money and harms crops.', label: 'Precision Farming' },
  { icon: CloudRain, tip: 'Watch for rain forecasts 48 hours before applying pesticides — rain washes away treatments, wasting resources.', label: 'Weather Planning' },
];

// ── Animated counter hook ─────────────────────────────────────────────────
function useCountUp(target, duration = 1200, active = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(Math.round(start));
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, active]);
  return count;
}

// ── Map auto-fly to location ──────────────────────────────────────────────
function MapFlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 11, { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
}

// ── Circular Risk Indicator ───────────────────────────────────────────────
function RiskRing({ value, label, color, suffix = '%', active }) {
  const animated = useCountUp(value, 1400, active);
  const radius = 28; const circum = 2 * Math.PI * radius;
  const offset = circum - (animated / 100) * circum;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
          <circle cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circum} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.1s' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-extrabold text-white text-sm">
          {suffix === '%' ? `${animated}%` : animated}
        </span>
      </div>
      <span className="text-[10px] font-semibold text-emerald-200 text-center leading-tight max-w-[64px]">{label}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
const FarmerDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // State
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipFading, setTipFading] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [heroVisible, setHeroVisible] = useState(false);
  const [myCrops, setMyCrops] = useState([]);
  const [weatherRisk, setWeatherRisk] = useState(34);
  const [diseaseRisk, setDiseaseRisk] = useState(22);
  const [marketTrend, setMarketTrend] = useState(71);
  const [profitConf, setProfitConf] = useState(82);
  const heroRef = useRef(null);

  useEffect(() => {
    // Socket: Join personal room for notifications
    if (user?._id) {
      if (!socket.connected) socket.connect();
      socket.emit('join_user', user._id);
    }

    const handleNotification = (data) => {
      console.log('📨 New Reply from Agronomist:', data);
      // Optional: Add toast or alert here
    };

    socket.on('expert_chat_notification', handleNotification);

    return () => {
      socket.off('expert_chat_notification', handleNotification);
    };
  }, [user?._id]);

  // Farmer location for map
  const farmerLat = user?.location?.coordinates?.[1];
  const farmerLng = user?.location?.coordinates?.[0];
  const mapCenter = farmerLat && farmerLng ? [farmerLat, farmerLng] : [20.5937, 78.9629];

  // ── Tip rotation ───────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setTipFading(true);
      setTimeout(() => {
        setTipIndex(i => (i + 1) % FARMING_TIPS.length);
        setTipFading(false);
      }, 400);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // ── Hero animation ─────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ── Location prompt ────────────────────────────────────────────────────
  useEffect(() => {
    const shouldShow = sessionStorage.getItem('showLocationPromptOnce');
    if (shouldShow === 'true') {
      sessionStorage.removeItem('showLocationPromptOnce');
      setTimeout(() => setShowLocationPrompt(true), 600);
    }
  }, [user]);

  // Fetch crops for hero section
  useEffect(() => {
    cropAPI.getCrops().then(r => setMyCrops(r.data || [])).catch(() => { });
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────
  const getInitials = (name = '') =>
    name.split(' ').map(p => p[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('Good Morning') : hour < 17 ? t('Good Afternoon') : t('Good Evening');
  const GreetIcon = hour < 12 ? Sun : hour < 17 ? CloudSun : Moon;

  const currentCrop = myCrops[0]?.name || null;

  const quickActionCards = [
    { to: '/farmer/crops', icon: Sprout, title: t('My Crops'), desc: t('Manage & track your crops'), gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', halo: '#22c55e' },
    { to: '/farmer/disease-reports', icon: ScanSearch, title: t('AI Disease Detection'), desc: t('Detect crop diseases with AI'), gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-50', halo: '#f97316' },
    { to: '/farmer/weather', icon: CloudSun, title: t('Weather Forecast'), desc: t('7-day forecast for your farm'), gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', halo: '#3b82f6' },
    { to: '/profile', icon: UserIcon, title: t('My Profile'), desc: t('Update location & settings'), gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-50', halo: '#f43f5e' },
  ];

  const cardBase = 'bg-[var(--bg-card)] border-[var(--border-card)] hover:bg-[var(--bg-card-hover)]';
  const textH = 'text-[var(--text-primary)]';
  const textS = 'text-[var(--text-secondary)]';

  return (
    <div className={`min-h-screen ${isDark ? 'kk-page-dark' : 'kk-page-light'}`} style={{ backgroundColor: 'var(--bg-page)' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.6)} 50%{box-shadow:0 0 0 8px rgba(34,197,94,0)} }
        @keyframes bgShimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .fade-up { animation: fadeUp 0.55s cubic-bezier(.4,0,.2,1) both; }
        .fade-in { animation: fadeIn 0.4s ease both; }
        .card-lift { transition: transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s, border-color .25s; }
        .card-lift:hover { transform: translateY(-6px); }
        .glow-card:hover { box-shadow: 0 0 0 2px var(--halo), 0 16px 40px rgba(0,0,0,.15); }
        .ai-badge { background: linear-gradient(90deg,#166534,#15803d,#166534); background-size:200% 100%; animation: bgShimmer 3s ease infinite; }
        .pulse-dot { animation: pulse-glow 1.8s infinite; }
        .tip-box { transition: opacity .4s ease; }
        .hero-bg { background: var(--bg-header); }

        /* Map container reset */
        .kk-map .leaflet-container { border-radius: 0 0 1.5rem 1.5rem; }
        
        /* Leaflet popup card style */
        .leaflet-popup-content-wrapper { 
          background: var(--bg-card-solid)!important; 
          color: var(--text-primary)!important;
          border-radius:14px!important; 
          box-shadow:0 8px 32px rgba(0,0,0,.18)!important; 
          padding:0!important; 
          overflow:hidden; 
          border: 1px solid var(--border-card);
        }
        .leaflet-popup-content { margin:0!important; padding:0; }
        .leaflet-popup-tip-container { display:none; }
      `}</style>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ══ 1. AI HERO SUMMARY ════════════════════════════════════════════ */}
        <div
          ref={heroRef}
          className={`relative overflow-hidden rounded-3xl shadow-2xl fade-up hero-bg`}
          style={{ animationDelay: '0.05s' }}
        >
          {/* Animated background rings */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-400/10 border border-emerald-400/20" />
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-emerald-400/10 border border-emerald-400/20" />
          <div className="absolute bottom-0 left-1/2 w-32 h-32 rounded-full bg-yellow-400/5 blur-xl" />


          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center gap-8">

              {/* LEFT — Greeting and context */}
              <div className="flex-1 min-w-0">
                {/* AI Engine badge */}
                <div className="inline-flex items-center gap-2 ai-badge text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 shadow-lg">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full pulse-dot" />
                  AI Farm Intelligence Engine Active
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-2 leading-tight">
                  {user?.fullName?.split(' ')[0]}
                </h1>

                <div className="flex flex-wrap items-center gap-3 mt-3">
                  {user?.address?.district && (
                    <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-emerald-200 px-3 py-1.5 rounded-xl text-sm font-medium border border-white/10">
                      <MapPin size={16} /> {user.address.district}
                    </span>
                  )}
                  {currentCrop && (
                    <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-emerald-200 px-3 py-1.5 rounded-xl text-sm font-medium border border-white/10">
                      <Sprout size={16} /> {currentCrop}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 bg-emerald-400/20 text-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-400/30">
                    <Zap size={14} className="text-yellow-400" /> AI Confidence: {profitConf}%
                  </span>
                </div>


                <p className="text-rose-900 text-sm mt-4 flex items-center gap-2">
                  {t('Manage your farm, track crops, and get expert advice')}
                  <ChevronRight size={14} />
                </p>
              </div>

              {/* RIGHT — AI risk indicators */}

              <div className="flex-shrink-0">
                <p className="text-rose-900 text-xs font-semibold uppercase tracking-widest mb-4 text-center">
                  AI Risk Analysis
                </p>

                <div className="grid grid-cols-3 gap-3 sm:gap-5">
                  <RiskRing value={weatherRisk} label={t('Weather Risk')} color="#60a5fa" active={heroVisible} />
                  <RiskRing value={diseaseRisk} label={t('Disease Risk')} color="#f87171" active={heroVisible} />
                  <RiskRing value={profitConf} label={t('Profit Confidence')} color="#144124ff" active={heroVisible} />
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* ══ 2. INTERACTIVE MAP ══════════════════════════════════════════════ */}
        <div className={`rounded-3xl overflow-hidden shadow-xl border bg-[var(--bg-card)] border-[var(--border-card)] fade-up`} style={{ animationDelay: '0.15s' }}>
          {/* Map header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow">
                <MapIcon size={20} />
              </div>
              <div>
                <h2 className={`font-extrabold text-base ${textH}`}>{t('Farm Location Map')}</h2>
                <p className={`text-xs ${textS}`}>{t('Your farm location and active monitoring')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowMap(v => !v)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-card)] hover:bg-[var(--bg-card-hover)]`}
              >
                {showMap ? '▲ Collapse' : '▼ Expand'}
              </button>
            </div>
          </div>

          {showMap && (
            <div className="kk-map relative" style={{ height: 380 }}>
              <MapContainer
                center={mapCenter}
                zoom={farmerLat ? 11 : 5}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                  url={isDark
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                />
                {farmerLat && farmerLng && (
                  <>
                    <MapFlyTo center={[farmerLat, farmerLng]} />
                    <Marker position={[farmerLat, farmerLng]} icon={farmerIcon}>
                      <Popup>
                        <div className="p-3 min-w-[160px]">
                          <p className="font-extrabold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
                            <Sprout size={14} className="text-emerald-700" /> Your Farm
                          </p>
                          <p className="text-xs text-gray-500 font-medium">{user?.address?.district || 'Your location'}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Active Monitor</p>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}
              </MapContainer>

              {/* No location overlay */}
              {!farmerLat && (
                <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none z-[500]">
                  <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl px-5 py-3 flex items-center gap-3 pointer-events-auto">
                    <MapPin size={24} className="text-emerald-600" />
                    <div>
                      <p className="font-extrabold text-gray-900 text-sm">{t('Set your location')}</p>
                      <p className="text-xs text-gray-500">{t('Enable precise farm mapping')}</p>
                    </div>
                    <Link to="/profile?tab=location" className="ml-2 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-emerald-700 transition-colors">
                      {t('Update')}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ 3. QUICK ACTIONS ════════════════════════════════════════════════ */}
        <div className="fade-up" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-extrabold flex items-center gap-2 ${textH}`}>
              <Zap size={20} className="text-yellow-500 fill-yellow-500" /> {t('Quick Actions')}
            </h2>
            <span className={`text-xs font-medium ${textS}`}>{t('Tap to navigate')}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickActionCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.to}
                  to={card.to}
                  style={{ '--halo': card.halo }}
                  className={`group card-lift glow-card rounded-2xl border shadow-sm overflow-hidden ${cardBase}`}
                >
                  <div className={`h-1 bg-gradient-to-r ${card.gradient}`} />
                  <div className="p-4 sm:p-5">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon size={24} />
                    </div>
                    <h3 className={`font-extrabold text-sm mb-0.5 leading-tight ${textH}`}>{card.title}</h3>
                    <p className={`text-[11px] leading-snug ${textS}`}>{card.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ══ 4. AI TIP CAROUSEL ══════════════════════════════════════════════ */}
        <div
          className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 fade-up bg-[var(--bg-card)] border-[var(--border-accent)]`}
          style={{ animationDelay: '0.32s' }}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              {(() => {
                const Icon = FARMING_TIPS[tipIndex].icon;
                return <Icon size={24} />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                  🤖 AI Recommended Tip for Today
                </span>

                <span className="text-[10px] font-semibold text-orange-700 ml-auto">
                  {FARMING_TIPS[tipIndex].label}
                </span>
              </div>

              <p
                className="text-sm leading-relaxed tip-box text-orange-800"
                style={{ opacity: tipFading ? 0 : 1 }}
              >
                {FARMING_TIPS[tipIndex].tip}
              </p>
              {/* Dot indicators */}
              <div className="flex items-center gap-1.5 mt-3">
                {FARMING_TIPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setTipFading(true); setTimeout(() => { setTipIndex(i); setTipFading(false); }, 300); }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === tipIndex ? 'bg-amber-500 w-4' : isDark ? 'bg-amber-700' : 'bg-amber-300'}`}
                  />
                ))}
                <span className={`text-[10px] ml-auto ${textS}`}>AI Confidence: {profitConf}%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ══ FLOATING AI ASSISTANT ══════════════════════════════════════════ */}
      <div className="fixed bottom-6 right-6 z-50 group">
        <div className="absolute -top-10 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          <div className="bg-gray-900 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap border border-white/10">
            Ask KrishiBandhu AI <Sparkles size={12} className="text-yellow-400" />
          </div>
        </div>
        <Link to="/farmer/ai-assistant" className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-2xl hover:shadow-indigo-500/50 hover:scale-110 transition-all duration-300 border border-white/20">
          <MessageSquare size={24} className="text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white pulse-dot" />
        </Link>
      </div>

      {showLocationPrompt && <LocationPromptModal onClose={() => setShowLocationPrompt(false)} />}
    </div>
  );
};

export default FarmerDashboard;
