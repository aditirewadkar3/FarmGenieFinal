import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import CropYieldPredictor from '../../components/CropYieldPredictor';
import {
  Sprout,
  Search,
  Check,
  CheckCircle2,
  Scaling,
  Brain,
  ChevronRight,
  ClipboardList,
  TrendingUp,
  Droplets,
  Beaker,
  Calendar,
  Bug,
  AlertTriangle,
  Lightbulb,
  Ban,
  X,
  Plus,
  Trash2,
  LayoutGrid,
  Info,
  Layers,
  MapPin,
  CircleCheck,
  Circle,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { geminiAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import AIKeyModal from '../../components/AIKeyModal';

// ── Popular Indian crops with emoji ─────────────────────────────────────────
const POPULAR_CROPS = [
  { name: 'Wheat', emoji: '🌾', color: 'from-amber-400 to-yellow-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  { name: 'Rice', emoji: '🍚', color: 'from-yellow-300 to-amber-400', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { name: 'Sugarcane', emoji: '🎋', color: 'from-green-500 to-emerald-600', bg: 'bg-green-50', border: 'border-green-200' },
  { name: 'Cotton', emoji: '🌿', color: 'from-sky-400 to-blue-500', bg: 'bg-sky-50', border: 'border-sky-200' },
  { name: 'Maize', emoji: '🌽', color: 'from-yellow-500 to-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
  { name: 'Soybean', emoji: '🫘', color: 'from-lime-500 to-green-500', bg: 'bg-lime-50', border: 'border-lime-200' },
  { name: 'Tomato', emoji: '🍅', color: 'from-red-500 to-rose-600', bg: 'bg-red-50', border: 'border-red-200' },
  { name: 'Onion', emoji: '🧅', color: 'from-purple-400 to-violet-500', bg: 'bg-purple-50', border: 'border-purple-200' },
  { name: 'Potato', emoji: '🥔', color: 'from-amber-600 to-orange-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { name: 'Banana', emoji: '🍌', color: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { name: 'Chilli', emoji: '🌶️', color: 'from-red-600 to-rose-700', bg: 'bg-red-50', border: 'border-red-200' },
  { name: 'Turmeric', emoji: '🟡', color: 'from-yellow-500 to-amber-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { name: 'Ginger', emoji: '🫚', color: 'from-orange-400 to-amber-500', bg: 'bg-orange-50', border: 'border-orange-200' },
  { name: 'Garlic', emoji: '🧄', color: 'from-gray-400 to-slate-500', bg: 'bg-gray-50', border: 'border-gray-200' },
  { name: 'Cauliflower', emoji: '🥦', color: 'from-green-400 to-emerald-500', bg: 'bg-green-50', border: 'border-green-200' },
  { name: 'Groundnut', emoji: '🥜', color: 'from-amber-700 to-orange-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  { name: 'Mustard', emoji: '🌻', color: 'from-yellow-600 to-amber-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { name: 'Lentil', emoji: '🫘', color: 'from-orange-500 to-amber-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { name: 'Chickpea', emoji: '🫘', color: 'from-yellow-700 to-amber-800', bg: 'bg-amber-50', border: 'border-amber-200' },
  { name: 'Mango', emoji: '🥭', color: 'from-orange-400 to-yellow-500', bg: 'bg-orange-50', border: 'border-orange-200' },
  { name: 'Grapes', emoji: '🍇', color: 'from-purple-500 to-violet-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { name: 'Pomegranate', emoji: '🍎', color: 'from-red-500 to-pink-600', bg: 'bg-red-50', border: 'border-red-200' },
  { name: 'Radish', emoji: '🌱', color: 'from-pink-400 to-fuchsia-500', bg: 'bg-pink-50', border: 'border-pink-200' },
  { name: 'Coconut', emoji: '🥥', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-200' },
];

// ── Image search via Unsplash (free tier) ────────────────────────────────────
const fetchCropImage = async (cropName) => {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(cropName + ' crop farm india')}&per_page=3&orientation=landscape`,
      { headers: { Authorization: 'Client-ID kXvLl0bDDCxjVJf1VoC8kFBZ0rSNfA9Z3bXNGnV8Mrc' } }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch {
    // Fallback to a reliable generic agriculture image if API fails
    return `https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=800&auto=format&fit=crop`;
  }
};

// ── Section component ────────────────────────────────────────────────────────
const InfoSection = ({ icon: Icon, title, color, children }) => (
  <div className={`rounded-2xl border p-4 ${color}`}>
    <p className="font-bold text-gray-800 mb-3 flex items-center gap-2">
      <Icon size={18} /> {title}
    </p>
    {children}
  </div>
);

const BulletList = ({ items, dotColor = 'bg-green-500' }) => (
  <ul className="space-y-1.5">
    {items?.map((item, i) => (
      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
        <span className={`w-1.5 h-1.5 ${dotColor} rounded-full mt-1.5 flex-shrink-0`} />
        {typeof item === 'string' ? item : JSON.stringify(item)}
      </li>
    ))}
  </ul>
);

// ── Main Page ────────────────────────────────────────────────────────────────
const CropManagement = () => {
  const { lang, t } = useLanguage();
  const { isDark } = useTheme();

  // ── Crop Management Guide state ──────────────────────────────────────────────
  const [selectedCrop, setSelectedCrop] = useState('');
  const [customCrop, setCustomCrop] = useState('');
  const [area, setArea] = useState('');
  const [areaUnit, setAreaUnit] = useState('acres');
  const [guideLoading, setGuideLoading] = useState(false);
  const [guide, setGuide] = useState(null);
  const [guideError, setGuideError] = useState('');
  const [cropImage, setCropImage] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const location = useLocation();
  const queryTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(queryTab === 'yield' ? 'yield' : 'guide'); // 'guide' | 'yield'

  useEffect(() => {
    if (queryTab === 'yield') setActiveTab('yield');
  }, [queryTab]);
  const [showKeyModal, setShowKeyModal] = useState(false);

  const guideRef = useRef(null);

  // ── Fetch crop guide ──────────────────────────────────────────────────────────
  const handleGetGuide = async () => {
    const cropName = customCrop.trim() || selectedCrop;
    if (!cropName) return;
    if (!area || parseFloat(area) <= 0) return;

    setGuideLoading(true);
    setGuide(null);
    setGuideError('');
    setCropImage('');

    // Check for User's API Key
    const userStored = JSON.parse(localStorage.getItem('user'));
    if (!userStored?.groqApiKey) {
      setShowKeyModal(true);
      setGuideLoading(false);
      return;
    }

    // Fetch image in parallel
    setImageLoading(true);
    fetchCropImage(cropName).then((url) => { setCropImage(url); setImageLoading(false); });

    try {
      const res = await geminiAPI.getCropManagementInfo(cropName, parseFloat(area), areaUnit, lang);
      const info = res.data.info;
      setGuide(info);
      setTimeout(() => guideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      setGuideError('Could not fetch crop management info. Please try again.');
    } finally {
      setGuideLoading(false);
    }
  };

  const finalCropName = customCrop.trim() || selectedCrop;

  return (
    <div className={`min-h-screen ${isDark ? 'kk-page-dark' : 'kk-page-light'}`} style={{ backgroundColor: 'var(--bg-page)' }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position:-400px 0; }
          100% { background-position:400px 0; }
        }
        @keyframes spinSlow { to { transform:rotate(360deg); } }
        .fade-up   { animation: fadeUp 0.45s ease both; }
        .spin-slow { animation: spinSlow 1s linear infinite; }
        .shimmer   {
          background: linear-gradient(90deg,#f0fdf4 25%,#d1fae5 50%,#f0fdf4 75%);
          background-size: 800px 100%;
          animation: shimmer 1.8s infinite;
        }
        .crop-chip { transition: all 0.2s cubic-bezier(.4,0,.2,1); }
        .crop-chip:hover { transform: translateY(-3px) scale(1.04); }
        .tab-btn { transition: all 0.2s ease; }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Hero Header ────────────────────────────────────────────── */}
        <div className="text-center mb-8 fade-up">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-green-700 text-white px-6 py-3 rounded-2xl shadow-lg mb-4">
            <Sprout size={24} />
            <h1 className="text-2xl font-extrabold tracking-tight">{t('Crop Management')}</h1>
          </div>
          <p className="text-gray-600 text-sm mt-2 max-w-xl mx-auto">
            {t('Select any crop, enter your land area, and get a complete AI-powered management guide')}
          </p>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-7 bg-[var(--bg-card)] rounded-2xl p-1.5 shadow border border-[var(--border-card)] fade-up">
          {[
            { id: 'guide', label: t('Crop Guide'), icon: ClipboardList },
            
            { id: 'yield', label: t('Yield Predictor') || 'Yield Predictor', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn flex-1 py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow'
                  : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* TAB: CROP GUIDE                                             */}
        {/* ════════════════════════════════════════════════════════════ */}
        {activeTab === 'guide' && (
          <div className="space-y-6">

            {/* ── Step 1: Select Crop ─────────────────────────────── */}
            <div className="bg-[var(--bg-card)] rounded-3xl shadow-xl border border-[var(--border-card)] p-6 fade-up">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow">1</div>
                <h2 className="text-lg font-bold text-gray-900">{t('Select Your Crop')}</h2>
              </div>

              {/* Crop grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 mb-5">
                {POPULAR_CROPS.map((crop) => {
                  const isSelected = selectedCrop === crop.name && !customCrop.trim();
                  return (
                    <button
                      key={crop.name}
                      onClick={() => { setSelectedCrop(crop.name); setCustomCrop(''); setGuide(null); }}
                      className={`crop-chip flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 cursor-pointer focus:outline-none
                        ${isSelected ? `${crop.bg} ${crop.border} shadow-md scale-105` : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                    >
                      <span className="text-2xl">{crop.emoji}</span>
                      <span className={`text-[11px] font-semibold text-center leading-tight ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                        {crop.name}
                      </span>
                      {isSelected && <span className="text-[9px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full flex items-center justify-center"><Check size={8} strokeWidth={4} /></span>}
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{t('OR type your crop')}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Custom crop input */}
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={customCrop}
                  onChange={(e) => { setCustomCrop(e.target.value); setSelectedCrop(''); setGuide(null); }}
                  placeholder={t('Type any crop name')}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-200 text-sm text-gray-800 
                    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
              </div>

              {/* Selected indicator */}
              {finalCropName && (
                <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full text-sm font-semibold text-emerald-800">
                  <CheckCircle2 size={14} /> {t('Selected')}: <strong>{finalCropName}</strong>
                </div>
              )}
            </div>

            {/* ── Step 2: Enter Area ──────────────────────────────── */}
            <div className="bg-[var(--bg-card)] rounded-3xl shadow-xl border border-[var(--border-card)] p-6 fade-up">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow">2</div>
                <h2 className="text-lg font-bold text-gray-900">{t('Enter Your Land Area')}</h2>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Scaling size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder={t('Enter area')}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-200 text-sm text-gray-800
                      placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                  />
                </div>
                <div className="relative">
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value)}
                    className="appearance-none h-full px-4 py-3 pr-8 rounded-2xl border-2 border-gray-200 text-sm font-semibold
                      text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="guntha">Guntha</option>
                    <option value="bigha">Bigha</option>
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▼</span>
                </div>
              </div>

              {/* Quick area chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {['0.5', '1', '2', '5', '10'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setArea(v)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all
                      ${area === v ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-700'}`}
                  >
                    {v} {areaUnit}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Step 3: Generate Button ─────────────────────────── */}
            <button
              onClick={handleGetGuide}
              disabled={!finalCropName || !area || parseFloat(area) <= 0 || guideLoading}
              className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-3 fade-up
                ${!finalCropName || !area || parseFloat(area) <= 0 || guideLoading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {guideLoading ? (
                <>
                  <RotateCcw className="spin-slow w-6 h-6" />
                  {t('Generating Management Guide...')}
                </>
              ) : (
                <>
                  <Brain size={20} />
                  {t('Get AI Crop Management Guide')}
                  <ChevronRight size={20} />
                </>
              )}
            </button>

            {/* Error */}
            {guideError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm fade-up flex items-center gap-2">
                <AlertTriangle size={18} /> {guideError}
              </div>
            )}

            {/* ── LOADING SKELETON ─────────────────────────────────── */}
            {guideLoading && (
              <div className="space-y-4 fade-up">
                {[200, 120, 160, 100].map((h, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden" style={{ height: h }}>
                    <div className="shimmer w-full h-full" />
                  </div>
                ))}
              </div>
            )}

            {/* ════════════════════════════════════════════════════════ */}
            {/* GUIDE RESULT                                             */}
            {/* ════════════════════════════════════════════════════════ */}
            {guide && !guideLoading && (
              <div ref={guideRef} className="space-y-5 fade-up">

                {/* ── Hero card with crop image ─────────────────────── */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-green-100">
                  {/* Background image */}
                  <div className="absolute inset-0">
                    {cropImage ? (
                      <img src={cropImage} alt={guide.cropName} className="w-full h-full object-cover" />
                    ) : imageLoading ? (
                      <div className="shimmer w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-green-700" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                  </div>

                  {/* Content over image */}
                  <div className="relative p-6 md:p-8 min-h-[200px] flex flex-col justify-end">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide flex items-center gap-1.5">
                            <Sprout size={12} /> {t('Crop Guide')}
                          </span>
                          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                            <Scaling size={12} /> {area} {areaUnit}
                          </span>
                        </div>
                        <h2 className="text-3xl font-extrabold text-white drop-shadow-lg">{guide.cropName}</h2>
                        <p className="text-green-200 text-sm mt-1 max-w-xl leading-relaxed">{guide.overview}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 text-center">
                          <p className="text-white/70 text-xs font-medium">Duration</p>
                          <p className="text-white font-extrabold text-lg">{guide.durationDays || '90-150'} days</p>
                        </div>
                        <div className="bg-amber-500/80 backdrop-blur-sm rounded-2xl px-4 py-2 text-center">
                          <p className="text-amber-100 text-xs font-medium">Best Season</p>
                          <p className="text-white font-bold text-sm">{guide.bestSeason}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Profit / Cost cards ───────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4 shadow">
                    <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-green-700 font-semibold uppercase">Estimated Cost</p>
                      <p className="text-base font-bold text-gray-900">{guide.estimatedCost}</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200 rounded-2xl p-5 flex items-center gap-4 shadow">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-amber-700 font-semibold uppercase">Expected Profit</p>
                      <p className="text-base font-bold text-gray-900">{guide.estimatedProfit}</p>
                    </div>
                  </div>
                </div>

                {/* ── Seed & Sowing ─────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoSection icon={Sprout} title="Seeds Required" color="bg-lime-50 border-lime-200">
                    <p className="text-sm text-gray-700">{guide.seedsRequired}</p>
                  </InfoSection>
                  <InfoSection icon={Layers} title="Sowing Method & Spacing" color="bg-emerald-50 border-emerald-200">
                    <p className="text-sm text-gray-700 mb-2">{guide.sowingMethod}</p>
                    <p className="text-sm text-gray-700 font-medium flex items-center gap-1.5"><Scaling size={14} /> {guide.spacing}</p>
                  </InfoSection>
                </div>

                {/* ── Soil Requirements ────────────────────────────── */}
                <InfoSection icon={MapPin} title="Soil Requirements" color="bg-amber-50 border-amber-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-amber-700 font-semibold uppercase mb-1.5">Soil Type</p>
                      <p className="text-sm text-gray-700">{guide.soilRequirements?.type}</p>
                      <p className="text-sm text-gray-700 mt-1">pH: <strong>{guide.soilRequirements?.ph}</strong></p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-700 font-semibold uppercase mb-1.5">Preparation Steps</p>
                      <BulletList items={guide.soilRequirements?.preparation} dotColor="bg-amber-500" />
                    </div>
                  </div>
                </InfoSection>

                {/* ── Irrigation ───────────────────────────────────── */}
                <InfoSection icon={Droplets} title="Irrigation" color="bg-blue-50 border-blue-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-blue-700 font-semibold uppercase mb-1">Frequency</p>
                      <p className="text-sm text-gray-700">{guide.irrigation?.frequency}</p>
                      <p className="text-xs text-blue-700 font-semibold uppercase mt-3 mb-1">Method</p>
                      <p className="text-sm text-gray-700">{guide.irrigation?.method}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700 font-semibold uppercase mb-1.5">Critical Stages</p>
                      <BulletList items={guide.irrigation?.criticalStages} dotColor="bg-blue-500" />
                    </div>
                  </div>
                </InfoSection>

                {/* ── Fertilizers ──────────────────────────────────── */}
                <InfoSection icon={Beaker} title="Fertilizers" color="bg-violet-50 border-violet-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {guide.fertilizers?.map((f, i) => (
                      <div key={i} className="bg-white rounded-xl p-3 border border-violet-100 shadow-sm">
                        <p className="font-bold text-violet-800 text-sm">{f.name}</p>
                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1.5"><Scaling size={12} /> {f.quantity}</p>
                        <p className="text-xs text-gray-600 flex items-center gap-1.5"><Calendar size={12} /> {f.timing}</p>
                        <p className="text-xs text-violet-700 mt-1 font-medium">{f.purpose}</p>
                      </div>
                    ))}
                  </div>
                </InfoSection>

                {/* ── Growth Stages timeline ───────────────────────── */}
                <InfoSection icon={Calendar} title="Growth Stages" color="bg-green-50 border-green-200">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-green-200" />
                    <div className="space-y-4 ml-10">
                      {guide.growthStages?.map((s, i) => (
                        <div key={i} className="relative fade-up">
                          <div className="absolute -left-10 w-7 h-7 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
                            {i + 1}
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-green-100 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-bold text-gray-900 text-sm">{s.stage}</p>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Calendar size={10} /> {s.duration}</span>
                            </div>
                            <p className="text-xs text-gray-600">{s.care}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </InfoSection>

                {/* ── Pest & Disease Control ───────────────────────── */}
                <InfoSection icon={Bug} title="Pest & Disease Control" color="bg-red-50 border-red-200">
                  <div className="space-y-3">
                    {guide.pestControl?.map((p, i) => (
                      <div key={i} className="bg-white rounded-xl p-3 border border-red-100 shadow-sm">
                        <p className="font-bold text-red-800 text-sm flex items-center gap-1.5"><AlertTriangle size={14} /> {p.pest}</p>
                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1.5"><Search size={12} /> <strong>Symptoms:</strong> {p.symptoms}</p>
                        <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1.5"><Beaker size={12} /> <strong>Remedy:</strong> {p.remedy}</p>
                      </div>
                    ))}
                  </div>
                </InfoSection>

                {/* ── Harvest ──────────────────────────────────────── */}
                <InfoSection icon={Sprout} title="Harvest Information" color="bg-amber-50 border-amber-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-amber-700 font-semibold uppercase mb-1">Duration & Yield</p>
                      <p className="text-sm text-gray-700 mb-1 flex items-center gap-1.5"><Calendar size={12} /> {guide.harvest?.duration}</p>
                      <p className="text-sm font-bold text-green-800 flex items-center gap-1.5"><Scaling size={12} /> {guide.harvest?.expectedYield}</p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-700 font-semibold uppercase mb-1">Ready Signs</p>
                      <p className="text-sm text-gray-700 mb-2">{guide.harvest?.signs}</p>
                      <p className="text-xs text-amber-700 font-semibold uppercase mb-1">Method</p>
                      <p className="text-sm text-gray-700">{guide.harvest?.method}</p>
                    </div>
                  </div>
                </InfoSection>

                {/* ── Tips & Mistakes ──────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoSection icon={Lightbulb} title="Success Tips" color="bg-yellow-50 border-yellow-200">
                    <BulletList items={guide.tips} dotColor="bg-yellow-500" />
                  </InfoSection>
                  <InfoSection icon={Ban} title="Common Mistakes to Avoid" color="bg-rose-50 border-rose-200">
                    <BulletList items={guide.commonMistakes} dotColor="bg-rose-500" />
                  </InfoSection>
                </div>

                {/* ── Footer ───────────────────────────────────────── */}
                <div className="text-center py-4 text-xs text-gray-400 flex items-center justify-center gap-2">
                  <Brain size={12} /> ✨ AI-generated crop guide · Specific to {area} {areaUnit} of {guide.cropName} · Consult a local agronomist for precise advice
                </div>

              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* TAB: YIELD PREDICTOR                                       */}
        {/* ════════════════════════════════════════════════════════════ */}
        {activeTab === 'yield' && (
          <div className="fade-up">
            <CropYieldPredictor />
          </div>
        )}
      </div>
      <AIKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
      />
    </div>
  );
};

export default CropManagement;
