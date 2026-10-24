import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sprout,
  Search,
  Check,
  CheckCircle2,
  Scaling,
  ChevronRight,
  ChevronDown,
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
  Info,
  Layers,
  MapPin,
  RotateCcw,
  Sparkles,
  DollarSign,
  Clock,
  ArrowRight,
  Printer,
  Bookmark,
  Save,
  FileText,
  Crosshair,
  Award,
  ShieldAlert,
  HelpCircle,
  Sliders,
  CheckSquare,
  Square,
  Thermometer,
  CloudSun,
  CloudRain,
  ExternalLink,
} from 'lucide-react';
import CropYieldPredictor from '../../components/CropYieldPredictor';
import { cropAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

// Indian agricultural states list
const INDIAN_STATES = [
  'Maharashtra', 'Madhya Pradesh', 'Punjab', 'Haryana', 'Uttar Pradesh',
  'Gujarat', 'Karnataka', 'Rajasthan', 'Andhra Pradesh', 'Telangana',
  'Bihar', 'West Bengal', 'Tamil Nadu', 'Odisha', 'Chhattisgarh',
  'Assam', 'Jharkhand', 'Kerala', 'Himachal Pradesh', 'Uttarakhand'
];

// Supported crops metadata
const SUPPORTED_CROPS = [
  { id: 'Rice', name: 'Rice (Paddy / धान / भात)', season: 'Kharif', icon: '🌾', duration: '125 days' },
  { id: 'Wheat', name: 'Wheat (गेहूं / गहू)', season: 'Rabi', icon: '🌾', duration: '120 days' },
  { id: 'Cotton', name: 'Cotton (कपास / कापूस)', season: 'Kharif', icon: '🌱', duration: '165 days' },
  { id: 'Soybean', name: 'Soybean (सोयाबीन)', season: 'Kharif', icon: '🌿', duration: '100 days' },
  { id: 'Maize', name: 'Maize (Corn / मक्का / मका)', season: 'Kharif', icon: '🌽', duration: '105 days' },
  { id: 'Chickpea', name: 'Chickpea (Chana / Gram / चना / हरभरा)', season: 'Rabi', icon: '🫘', duration: '105 days' },
  { id: 'Sugarcane', name: 'Sugarcane (गन्ना / ऊस)', season: 'Whole Year', icon: '🎋', duration: '330 days' },
  { id: 'Groundnut', name: 'Groundnut (Peanut / मूंगफली / भुईमूग)', season: 'Kharif', icon: '🥜', duration: '110 days' },
  { id: 'Mustard', name: 'Mustard (Sarson / Rai / सरसों / मोहरी)', season: 'Rabi', icon: '🌼', duration: '115 days' },
  { id: 'Potato', name: 'Potato (आलू / बटाटा)', season: 'Rabi', icon: '🥔', duration: '95 days' },
  { id: 'Onion', name: 'Onion (प्याज / कांदा)', season: 'Rabi', icon: '🧅', duration: '125 days' },
];

const SOIL_TYPES = [
  { id: 'black', label: 'Black / Regur Soil (Moisture retentive, Cotton & Soybean)' },
  { id: 'alluvial', label: 'Alluvial Soil (Fertile river plains, Wheat & Paddy)' },
  { id: 'red', label: 'Red & Yellow Soil (Good drainage, Groundnut & Millets)' },
  { id: 'sandy loam', label: 'Sandy Loam (Light, friable, Potato & Onion)' },
  { id: 'clayey', label: 'Clayey Soil (Heavy, water retentive)' },
  { id: 'laterite', label: 'Laterite / Hill Soil (Acidic, plantation)' },
  { id: 'unknown', label: "I don't know my soil type (Use regional default)" },
];

const SEASONS = [
  { id: 'Kharif', label: 'Kharif (Monsoon / Summer Sowing: June – October)' },
  { id: 'Rabi', label: 'Rabi (Winter Sowing: October – March)' },
  { id: 'Summer', label: 'Zaid / Summer (March – June)' },
  { id: 'Whole Year', label: 'Whole Year / Annual' },
];

const IRRIGATION_TYPES = [
  { id: 'irrigated', label: 'Canal / Borewell / Well Irrigated' },
  { id: 'drip/sprinkler', label: 'Micro-Irrigation (Drip / Sprinkler)' },
  { id: 'rainfed', label: 'Rainfed (Dependent on monsoon rains)' },
];

const PREFERENCES = [
  { id: 'balanced', label: 'Balanced (Recommended for typical farm)' },
  { id: 'low_investment', label: 'Lower Investment (Low initial cash outlay)' },
  { id: 'high_return', label: 'Higher Potential Returns (Commercial/Cash crops)' },
  { id: 'low_water', label: 'Lower Water Consumption (Drought hardy)' },
  { id: 'short_duration', label: 'Shorter Crop Duration (Fast turnaround)' },
];

export default function CropManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Active top tab
  const queryTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(queryTab === 'yield' ? 'yield' : 'guide');

  // ── Farm Details Form State ──
  // Check if coordinates exist in user object
  const userLat = user?.location?.coordinates?.[1] || null;
  const userLng = user?.location?.coordinates?.[0] || null;
  const userDistrict = user?.address?.district || '';
  const userFarmArea = user?.farmInfo?.totalArea?.value || '2.5';
  const userAreaUnit = user?.farmInfo?.totalArea?.unit || 'acres';
  const userSoil = user?.farmInfo?.soilType?.toLowerCase() || 'black';

  const [coords, setCoords] = useState(
    userLat && userLng && (userLat !== 0 || userLng !== 0)
      ? { lat: userLat, lon: userLng }
      : null
  );
  const [manualLocationMode, setManualLocationMode] = useState(false);
  const [manualLat, setManualLat] = useState(userLat ? userLat.toString() : '');
  const [manualLon, setManualLon] = useState(userLng ? userLng.toString() : '');
  const [selectedState, setSelectedState] = useState('Maharashtra');
  const [selectedDistrict, setSelectedDistrict] = useState(userDistrict || 'Nashik');
  const [isLocating, setIsLocating] = useState(false);
  const [locationNote, setLocationNote] = useState(
    userLat && userLng && (userLat !== 0 || userLng !== 0)
      ? 'Reusing your saved farm location coordinates'
      : ''
  );

  // Land & Crop Selection
  const [area, setArea] = useState(userFarmArea.toString());
  const [areaUnit, setAreaUnit] = useState(userAreaUnit);
  const [selectedCrop, setSelectedCrop] = useState(''); // empty = Option B (recommend for me)
  const [cropSearch, setCropSearch] = useState('');
  const [season, setSeason] = useState('Kharif');
  const [sowingDate, setSowingDate] = useState(new Date().toISOString().slice(0, 10));
  const [soilType, setSoilType] = useState(userSoil || 'black');
  const [irrigation, setIrrigation] = useState('irrigated');
  const [budget, setBudget] = useState('');
  const [preference, setPreference] = useState('balanced');

  // Soil Test state (optional)
  const [showSoilTest, setShowSoilTest] = useState(false);
  const [soilN, setSoilN] = useState('medium');
  const [soilP, setSoilP] = useState('medium');
  const [soilK, setSoilK] = useState('medium');
  const [soilPh, setSoilPh] = useState('');

  // Execution & Output State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultMode, setResultMode] = useState(null); // 'plan' | 'recommendations'
  const [currentPlan, setCurrentPlan] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Editable Expenses in current plan
  const [editableExpenses, setEditableExpenses] = useState([]);
  const [editablePrice, setEditablePrice] = useState(0);

  // Saved Plans Drawer
  const [savedPlans, setSavedPlans] = useState([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const planRef = useRef(null);

  // ── Auto-fetch weather on mount if coords exist ──
  useEffect(() => {
    if (coords?.lat && coords?.lon) {
      fetchWeather(coords.lat, coords.lon);
    }
  }, [coords]);

  const fetchWeather = async (lat, lon) => {
    setWeatherLoading(true);
    try {
      const res = await cropAPI.getOpenMeteoWeather(lat, lon);
      if (res.data?.success) {
        setWeatherData(res.data.data);
      }
    } catch (e) {
      console.warn('Weather fetch warning:', e.message);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Browser Geolocation Detection (Only if user clicks, or if coords missing)
  const handleDetectLocation = () => {
    setIsLocating(true);
    setLocationNote('');
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please enter manually.');
      setIsLocating(false);
      setManualLocationMode(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const detected = {
          lat: parseFloat(pos.coords.latitude.toFixed(5)),
          lon: parseFloat(pos.coords.longitude.toFixed(5)),
        };
        setCoords(detected);
        setManualLat(detected.lat.toString());
        setManualLon(detected.lon.toString());
        setIsLocating(false);
        setLocationNote('Detected from your browser GPS');

        // Reverse geocode to state/district
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${detected.lat}&lon=${detected.lon}`
          );
          if (resp.ok) {
            const data = await resp.json();
            const addr = data.address || {};
            if (addr.state) setSelectedState(addr.state);
            const dist = addr.state_district || addr.county || addr.district || addr.city;
            if (dist) setSelectedDistrict(dist);
          }
        } catch {}

        fetchWeather(detected.lat, detected.lon);
      },
      (err) => {
        setIsLocating(false);
        setLocationNote('Permission denied or unavailable. Enter coordinates manually below.');
        setManualLocationMode(true);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleApplyManualCoords = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      alert('Please enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    setCoords({ lat, lon });
    setLocationNote('Applied manual coordinates');
    fetchWeather(lat, lon);
  };

  // ── Missing input analyzer ──
  const missingInputs = useMemo(() => {
    const missing = [];
    if (!coords && !manualLat) {
      missing.push({ field: 'Location Coordinates', impact: 'Reduces precision of weather-based moisture & temperature matching.' });
    }
    if (soilType === 'unknown') {
      missing.push({ field: 'Specific Soil Type', impact: 'General regional soil default assumed. Fertilizer & water retention may vary.' });
    }
    if (!budget || parseFloat(budget) <= 0) {
      missing.push({ field: 'Budget Constraint', impact: 'Assumes unconstrained operational capital for standard package of practices.' });
    }
    if (!showSoilTest) {
      missing.push({ field: 'Soil Test Report', impact: 'Standard university N-P-K recommendation used without soil nutrient adjustments.' });
    }
    return missing;
  }, [coords, manualLat, soilType, budget, showSoilTest]);

  // ── Filtered crop list for dropdown ──
  const filteredCrops = useMemo(() => {
    if (!cropSearch.trim()) return SUPPORTED_CROPS;
    return SUPPORTED_CROPS.filter(
      (c) =>
        c.name.toLowerCase().includes(cropSearch.toLowerCase()) ||
        c.id.toLowerCase().includes(cropSearch.toLowerCase())
    );
  }, [cropSearch]);

  // ── Form Submit: Generate Plan (Option A) or Recommendations (Option B) ──
  const handleGenerate = async (overrideCrop = null) => {
    const targetCrop = overrideCrop !== null ? overrideCrop : selectedCrop;

    if (!area || parseFloat(area) <= 0) {
      setErrorMsg('Please specify a valid cultivated land area (> 0).');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResultMode(null);

    const payload = {
      crop: targetCrop,
      season,
      sowingDate,
      area: parseFloat(area),
      areaUnit,
      state: selectedState,
      district: selectedDistrict,
      latitude: coords?.lat || (manualLat ? parseFloat(manualLat) : null),
      longitude: coords?.lon || (manualLon ? parseFloat(manualLon) : null),
      soilType,
      irrigation,
      budget: parseFloat(budget) || 0,
      preference,
      soilTest: showSoilTest
        ? {
            tested: true,
            nitrogen: soilN,
            phosphorus: soilP,
            potassium: soilK,
            ph: parseFloat(soilPh) || null,
          }
        : { tested: false },
    };

    try {
      const res = await cropAPI.generateFarmingPlan(payload);
      if (res.data?.success) {
        if (res.data.mode === 'plan') {
          setResultMode('plan');
          setCurrentPlan(res.data.plan);
          setEditableExpenses(res.data.plan.budgetEstimates.expenses || []);
          setEditablePrice(res.data.plan.budgetEstimates.assumedMarketPricePerUnit || 0);
          setSelectedCrop(res.data.selectedCrop);
        } else {
          setResultMode('recommendations');
          setRecommendations(res.data.recommendations || []);
          setCurrentPlan(null);
        }

        setTimeout(() => {
          planRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else {
        setErrorMsg(res.data?.message || 'Failed to generate plan.');
      }
    } catch (err) {
      console.error('Plan generation error:', err);
      setErrorMsg(err.response?.data?.message || 'Error communicating with server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle calendar task status
  const handleToggleTask = async (taskId) => {
    if (!currentPlan) return;
    const taskIndex = currentPlan.calendarTasks.findIndex((t) => t.taskId === taskId);
    if (taskIndex === -1) return;

    const newCompleted = !currentPlan.calendarTasks[taskIndex].completed;
    const updatedTasks = [...currentPlan.calendarTasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      completed: newCompleted,
      completedAt: newCompleted ? new Date().toISOString() : null,
    };

    setCurrentPlan({
      ...currentPlan,
      calendarTasks: updatedTasks,
    });

    // If plan is saved in DB, update on backend
    if (currentPlan._id) {
      try {
        await cropAPI.updatePlanTask(currentPlan._id, {
          taskId,
          completed: newCompleted,
        });
      } catch (e) {
        console.warn('Could not sync task update with DB:', e);
      }
    }
  };

  // Recalculate dynamic budget on local price edits
  const recalculatedBudget = useMemo(() => {
    if (!currentPlan) return null;
    const totalExp = editableExpenses.reduce((sum, e) => sum + (parseFloat(e.estimatedCost) || 0), 0);
    const areaVal = currentPlan.farmDetails.areaInAcres || 1;
    const costPerAcre = Math.round(totalExp / areaVal);
    const meanProd = currentPlan.budgetEstimates.expectedProductionMean || 1;
    const grossRev = Math.round(meanProd * (parseFloat(editablePrice) || 0));
    const netRet = grossRev - totalExp;
    const breakEven = Math.round(totalExp / meanProd);

    return {
      totalCost: totalExp,
      costPerAcre,
      grossRevenue: grossRev,
      netReturn: netRet,
      breakEvenPrice: breakEven,
    };
  }, [editableExpenses, editablePrice, currentPlan]);

  const handleExpenseChange = (index, newAmount) => {
    const updated = [...editableExpenses];
    updated[index] = {
      ...updated[index],
      estimatedCost: parseFloat(newAmount) || 0,
    };
    setEditableExpenses(updated);
  };

  // Save Plan to DB
  const handleSavePlan = async () => {
    if (!currentPlan) return;
    try {
      const planToSave = {
        ...currentPlan,
        budgetEstimates: {
          ...currentPlan.budgetEstimates,
          expenses: editableExpenses,
          totalCost: recalculatedBudget?.totalCost || currentPlan.budgetEstimates.totalCost,
          grossRevenue: recalculatedBudget?.grossRevenue || currentPlan.budgetEstimates.grossRevenue,
          netReturn: recalculatedBudget?.netReturn || currentPlan.budgetEstimates.netReturn,
          breakEvenPrice: recalculatedBudget?.breakEvenPrice || currentPlan.budgetEstimates.breakEvenPrice,
          assumedMarketPricePerUnit: editablePrice,
        },
      };

      const res = await cropAPI.saveFarmingPlan(planToSave);
      if (res.data?.success) {
        setSaveSuccessMsg('Plan successfully saved to your profile!');
        setCurrentPlan(res.data.plan);
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
    } catch (e) {
      alert('Failed to save plan: ' + (e.response?.data?.message || e.message));
    }
  };

  // Fetch saved plans
  const handleOpenSavedPlans = async () => {
    setShowSavedModal(true);
    try {
      const res = await cropAPI.getSavedFarmingPlans();
      if (res.data?.success) {
        setSavedPlans(res.data.plans || []);
      }
    } catch (e) {
      console.warn('Failed to load saved plans:', e);
    }
  };

  const handleLoadSavedPlan = (plan) => {
    setCurrentPlan(plan);
    setResultMode('plan');
    setSelectedCrop(plan.cropName);
    setArea(plan.farmDetails.area.value.toString());
    setAreaUnit(plan.farmDetails.area.unit);
    setEditableExpenses(plan.budgetEstimates.expenses || []);
    setEditablePrice(plan.budgetEstimates.assumedMarketPricePerUnit || 0);
    setShowSavedModal(false);
  };

  const handleDeleteSavedPlan = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this saved farming plan?')) return;
    try {
      await cropAPI.deleteFarmingPlan(id);
      setSavedPlans(savedPlans.filter((p) => p._id !== id));
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-emerald-100 mb-3">
            <ClipboardList size={14} />
            <span>Integrated Farm Planning & Cultivation Guide</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Comprehensive Crop Guide & Farming Planner
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-50 leading-relaxed">
            Select a preferred crop or let our engine recommend the top crops for your land. Get a complete lifecycle plan including seed rate, fertilizer schedule, stage-wise irrigations, pest IPM, itemized budget, and a dated task calendar.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenSavedPlans}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-900 font-bold text-xs sm:text-sm hover:bg-emerald-50 transition-all shadow-md active:scale-95"
            >
              <Bookmark size={15} className="text-emerald-700" />
              <span>My Saved Farming Plans</span>
            </button>

            <button
              onClick={() => setActiveTab(activeTab === 'guide' ? 'yield' : 'guide')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-950/80 text-emerald-200 border border-emerald-400/30 font-bold text-xs sm:text-sm backdrop-blur-sm transition-all"
            >
              <TrendingUp size={15} />
              <span>{activeTab === 'guide' ? 'Open Standalone ML Yield Predictor' : 'Back to Crop Guide'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Switcher if Yield Predictor is selected */}
      {activeTab === 'yield' ? (
        <div className="space-y-4">
          <button
            onClick={() => setActiveTab('guide')}
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 p-2"
          >
            ← Return to Crop Guide Planner
          </button>
          <CropYieldPredictor />
        </div>
      ) : (
        <div className="space-y-8">
          {/* ═══════════════════════════════════════════════════════════ */}
          {/* SECTION 1: FARM INFORMATION & CROP SELECTION FORM          */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Sliders size={20} className="text-emerald-600" />
                  1. Farm Details & Crop Selection
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter your field parameters. Choose a specific crop or leave blank for automatic top recommendations.
                </p>
              </div>

              {/* Weather Chip */}
              {weatherData && (
                <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs">
                  <CloudSun size={16} className="text-amber-500" />
                  <span className="font-semibold text-foreground">
                    {weatherData.current?.temperature ?? 28}°C
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    Rain: {weatherData.annualRainfallMm ?? 850} mm/yr
                  </span>
                </div>
              )}
            </div>

            {/* ── Sub-section A: Location (Reused) ── */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-600" />
                  <span className="text-xs font-bold text-foreground">
                    Farm Location & Coordinates
                  </span>
                  {coords && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-bold border border-emerald-500/20">
                      {coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground transition-all"
                  >
                    <Crosshair size={13} className={isLocating ? 'animate-spin' : ''} />
                    {isLocating ? 'Detecting...' : 'Detect GPS'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setManualLocationMode(!manualLocationMode)}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    {manualLocationMode ? 'Hide Manual Coords' : 'Manual Entry'}
                  </button>
                </div>
              </div>

              {locationNote && (
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  ✓ {locationNote}
                </p>
              )}

              {/* State and District Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">State</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">District / Taluka</label>
                  <input
                    type="text"
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    placeholder="e.g. Nashik, Ludhiana, Pune, Varanasi"
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Manual Lat/Lon drawer */}
              {manualLocationMode && (
                <div className="pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <input
                      type="number"
                      step="0.0001"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      placeholder="Latitude (e.g. 19.9975)"
                      className="w-full text-xs px-3 py-1.5 rounded-lg bg-card border border-border text-foreground"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.0001"
                      value={manualLon}
                      onChange={(e) => setManualLon(e.target.value)}
                      placeholder="Longitude (e.g. 73.7898)"
                      className="w-full text-xs px-3 py-1.5 rounded-lg bg-card border border-border text-foreground"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleApplyManualCoords}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                    >
                      Apply Coordinates
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Sub-section B: Crop Selection (Optional - Option A vs Option B) ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sprout size={16} className="text-emerald-600" />
                  Select Target Crop (Optional):
                </label>
                {selectedCrop ? (
                  <button
                    type="button"
                    onClick={() => setSelectedCrop('')}
                    className="text-[11px] text-red-500 hover:text-red-600 font-semibold flex items-center gap-1"
                  >
                    <X size={12} /> Clear selection (Recommend for me)
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    ★ Mode: Automatic Top Recommendations
                  </span>
                )}
              </div>

              {/* Crop Searchable Dropdown */}
              <div className="relative">
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3 rounded-xl bg-card border-2 border-border text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">
                    🌾 -- No Crop Selected (Automatically Recommend the Best Crops for Me) --
                  </option>
                  {SUPPORTED_CROPS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Typical Season: {c.season} ({c.duration})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Select Crop Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground font-medium mr-1">Quick Select:</span>
                {['Cotton', 'Soybean', 'Wheat', 'Rice', 'Maize', 'Chickpea', 'Sugarcane', 'Onion', 'Groundnut'].map(
                  (cr) => (
                    <button
                      key={cr}
                      type="button"
                      onClick={() => setSelectedCrop(cr)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        selectedCrop === cr
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-muted/40 hover:bg-muted text-foreground border-border'
                      }`}
                    >
                      {cr}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* ── Sub-section C: Land Area & Farming Season ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Land Area */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Cultivated Land Area *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Area"
                    className="flex-1 text-xs font-semibold px-3 py-2.5 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value)}
                    className="w-28 text-xs font-semibold px-2 py-2.5 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="guntha">Guntha</option>
                    <option value="bigha">Bigha</option>
                  </select>
                </div>
                {/* Area quick chips */}
                <div className="flex gap-1.5 mt-2">
                  {['1', '2.5', '5', '10'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setArea(v)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        area === v
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                      }`}
                    >
                      {v} {areaUnit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Season */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Farming Season</label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2.5 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  {SEASONS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Sowing Date */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Intended Sowing Date</label>
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2.5 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* ── Sub-section D: Soil, Irrigation, Budget & Preferences ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Soil Type */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Soil Type</label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  {SOIL_TYPES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Irrigation */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Water / Irrigation</label>
                <select
                  value={irrigation}
                  onChange={(e) => setIrrigation(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  {IRRIGATION_TYPES.map((ir) => (
                    <option key={ir.id} value={ir.id}>{ir.label}</option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Available Budget (₹)</label>
                <input
                  type="number"
                  step="1000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 50000 (Optional)"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Preference */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Farming Goal</label>
                <select
                  value={preference}
                  onChange={(e) => setPreference(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-card border border-border text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  {PREFERENCES.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Sub-section E: Soil Test Results (Optional Expandable) ── */}
            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowSoilTest(!showSoilTest)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
              >
                <span>{showSoilTest ? '− Hide Soil Test Data' : '+ Add Soil-Test Report (N-P-K & pH) for Precise Fertilizer Dosing'}</span>
              </button>

              {showSoilTest && (
                <div className="mt-3 p-4 rounded-2xl bg-muted/40 border border-border grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">Nitrogen (N)</label>
                    <select
                      value={soilN}
                      onChange={(e) => setSoilN(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg bg-card border border-border text-foreground"
                    >
                      <option value="low">Low (&lt;280 kg/ha)</option>
                      <option value="medium">Medium (280-560 kg/ha)</option>
                      <option value="high">High (&gt;560 kg/ha)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">Phosphorus (P)</label>
                    <select
                      value={soilP}
                      onChange={(e) => setSoilP(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg bg-card border border-border text-foreground"
                    >
                      <option value="low">Low (&lt;10 kg/ha)</option>
                      <option value="medium">Medium (10-25 kg/ha)</option>
                      <option value="high">High (&gt;25 kg/ha)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">Potassium (K)</label>
                    <select
                      value={soilK}
                      onChange={(e) => setSoilK(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg bg-card border border-border text-foreground"
                    >
                      <option value="low">Low (&lt;120 kg/ha)</option>
                      <option value="medium">Medium (120-280 kg/ha)</option>
                      <option value="high">High (&gt;280 kg/ha)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">Soil pH</label>
                    <input
                      type="number"
                      step="0.1"
                      value={soilPh}
                      onChange={(e) => setSoilPh(e.target.value)}
                      placeholder="e.g. 6.8 (Optional)"
                      className="w-full text-xs px-2 py-1.5 rounded-lg bg-card border border-border text-foreground"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Missing Information Indicator ── */}
            {missingInputs.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Info size={14} className="text-amber-500" />
                  Optional Missing Inputs (Planner will use realistic regional assumptions):
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground">
                  {missingInputs.map((m, i) => (
                    <li key={i}>
                      <strong className="text-foreground">{m.field}:</strong> {m.impact}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error Display */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ── Generate Action Button ── */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-black text-base text-white shadow-xl transition-all duration-200 flex items-center justify-center gap-3 ${
                  loading
                    ? 'bg-muted text-muted-foreground cursor-wait'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {loading ? (
                  <>
                    <RotateCcw className="animate-spin w-5 h-5" />
                    <span>Analyzing Agricultural Data & Generating Plan...</span>
                  </>
                ) : selectedCrop ? (
                  <>
                    <Sprout size={20} />
                    <span>Generate End-to-End Cultivation Plan for {selectedCrop}</span>
                    <ChevronRight size={20} />
                  </>
                ) : (
                  <>
                    <Sparkles size={20} className="text-amber-300" />
                    <span>Recommend Top Suitable Crops for My Farm</span>
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* RESULTS SECTION: OPTION B (RECOMMENDATIONS)                 */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {resultMode === 'recommendations' && (
            <div ref={planRef} className="space-y-5 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    <Award size={22} className="text-emerald-600" />
                    Top Recommended Crops for Your Farm ({selectedDistrict}, {selectedState})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Evaluated against your soil ({soilType}), season ({season}), water ({irrigation}), and {area} {areaUnit} land area.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-600 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  {recommendations.length} High-Potential Options
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {recommendations.map((crop, idx) => (
                  <div
                    key={crop.cropId}
                    className="bg-card border border-border hover:border-emerald-500/50 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    {idx === 0 && (
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
                    )}

                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-base text-foreground group-hover:text-emerald-600 transition-colors">
                              {crop.displayName}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mt-0.5">
                            {crop.category}
                          </span>
                        </div>
                        <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-black shrink-0">
                          {crop.suitabilityScore}% Match
                        </div>
                      </div>

                      {/* Reasons */}
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1 mb-3">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                          <CheckCircle2 size={11} /> Why Recommended:
                        </span>
                        <p className="text-foreground text-[11px] leading-relaxed">
                          {crop.reasons[0] || 'Matches regional agronomic conditions well.'}
                        </p>
                      </div>

                      {/* Specs Matrix */}
                      <div className="space-y-2 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center justify-between py-1 border-b border-border/40 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-emerald-500" /> Duration:
                          </span>
                          <span className="font-semibold text-foreground">{crop.durationRange}</span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-border/40 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Droplets size={12} className="text-blue-500" /> Water Need:
                          </span>
                          <span className="font-semibold text-foreground">{crop.waterRequirement}</span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-border/40 text-[11px]">
                          <span className="flex items-center gap-1">
                            <TrendingUp size={12} className="text-emerald-500" /> Expected Yield ({area} {areaUnit}):
                          </span>
                          <span className="font-semibold text-foreground">{crop.expectedYieldTotal}</span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-border/40 text-[11px]">
                          <span className="flex items-center gap-1">
                            <DollarSign size={12} className="text-emerald-600" /> Approx. Investment:
                          </span>
                          <span className="font-bold text-foreground">₹{crop.approxInvestment.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center justify-between py-1 text-[11px]">
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">Est. Net Return:</span>
                          <span className="font-black text-emerald-600 text-xs">
                            ₹{crop.expectedNetReturn.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Risks Note */}
                      {crop.majorRisks && crop.majorRisks[0] && (
                        <div className="p-2 rounded-lg bg-amber-500/10 text-[10px] text-amber-800 dark:text-amber-300 mb-4 flex items-start gap-1">
                          <AlertTriangle size={12} className="shrink-0 mt-0.5 text-amber-500" />
                          <span><strong>Key Risk:</strong> {crop.majorRisks[0]}</span>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <button
                      type="button"
                      onClick={() => handleGenerate(crop.cropId)}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <span>Open Full Farming Plan</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* RESULTS SECTION: OPTION A (COMPLETE END-TO-END PLAN)       */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {resultMode === 'plan' && currentPlan && (
            <div ref={planRef} className="space-y-6 animate-in fade-in duration-300">
              {/* ── Banner & Actions Bar ── */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Active Plan
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      Sowing Date: {new Date(currentPlan.sowingDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-foreground">
                    {currentPlan.cropName} Cultivation Guide & Financial Planner
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Tailored for {currentPlan.farmDetails.area.value} {currentPlan.farmDetails.area.unit} in {currentPlan.farmDetails.location.district || currentPlan.farmDetails.location.state} ({currentPlan.farmDetails.soilType} soil).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSavePlan}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                  >
                    <Save size={15} />
                    <span>Save Plan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors"
                    title="Print or Save PDF"
                  >
                    <Printer size={15} />
                    <span>Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCrop('');
                      handleGenerate('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors"
                  >
                    <span>Compare Other Crops</span>
                  </button>
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* ── Section A: Suitability Assessment Card ── */}
              <div className={`rounded-3xl border p-6 space-y-4 ${
                currentPlan.suitabilityAssessment.isSuitable
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-amber-500/5 border-amber-500/30'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${
                      currentPlan.suitabilityAssessment.isSuitable
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}>
                      {currentPlan.suitabilityAssessment.score}%
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Suitability Assessment
                      </span>
                      <h4 className="text-lg font-black text-foreground">
                        {currentPlan.suitabilityAssessment.tier} for Your Farm
                      </h4>
                    </div>
                  </div>

                  {!currentPlan.suitabilityAssessment.isSuitable && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold">
                      <ShieldAlert size={14} />
                      High Risk Detected
                    </div>
                  )}
                </div>

                {/* Reasons & Cautions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      Supporting Agricultural Factors:
                    </span>
                    <ul className="space-y-1 text-muted-foreground text-[11px] list-disc list-inside">
                      {currentPlan.suitabilityAssessment.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <AlertTriangle size={14} className="text-amber-500" />
                      Constraints & Risks to Manage:
                    </span>
                    <ul className="space-y-1 text-muted-foreground text-[11px] list-disc list-inside">
                      {currentPlan.suitabilityAssessment.cautions.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* If unsuitable, suggest alternatives without replacing */}
                {currentPlan.suitabilityAssessment.alternatives?.length > 0 && (
                  <div className="p-3 rounded-2xl bg-card border border-border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-muted-foreground text-[11px]">
                      💡 <strong>Better Alternatives for this season/soil:</strong>{' '}
                      {currentPlan.suitabilityAssessment.alternatives.join(', ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const alt = currentPlan.suitabilityAssessment.alternatives[0];
                        if (alt) handleGenerate(alt.split(' ')[0]);
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline shrink-0"
                    >
                      Switch to {currentPlan.suitabilityAssessment.alternatives[0]?.split(' ')[0]}
                    </button>
                  </div>
                )}
              </div>

              {/* ── Section B: Crop Overview Specs ── */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Info size={18} className="text-emerald-600" />
                  Crop Overview & Key Characteristics
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border text-center">
                    <span className="text-[10px] text-muted-foreground block font-medium">Crop Duration</span>
                    <span className="text-base font-black text-foreground mt-0.5 block">
                      {currentPlan.cropOverview.durationDays} Days
                    </span>
                    <span className="text-[10px] text-muted-foreground">{currentPlan.cropOverview.durationRange}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/40 border border-border text-center">
                    <span className="text-[10px] text-muted-foreground block font-medium">Water Requirement</span>
                    <span className="text-sm font-black text-foreground mt-0.5 block">
                      {currentPlan.cropOverview.waterRequirement}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Seasonal needs</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/40 border border-border text-center">
                    <span className="text-[10px] text-muted-foreground block font-medium">Expected Yield / Acre</span>
                    <span className="text-base font-black text-emerald-600 mt-0.5 block">
                      {currentPlan.cropOverview.expectedYieldMin} – {currentPlan.cropOverview.expectedYieldMax} Q
                    </span>
                    <span className="text-[10px] text-muted-foreground">Avg: {currentPlan.cropOverview.expectedYieldMean} Quintals</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/40 border border-border text-center">
                    <span className="text-[10px] text-muted-foreground block font-medium">Total Production ({currentPlan.farmDetails.area.value} {currentPlan.farmDetails.area.unit})</span>
                    <span className="text-base font-black text-foreground mt-0.5 block">
                      {currentPlan.budgetEstimates.expectedProductionMean} Q
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Range: {currentPlan.budgetEstimates.expectedProductionMin} – {currentPlan.budgetEstimates.expectedProductionMax} Q
                    </span>
                  </div>
                </div>

                {/* ML model prediction if available */}
                {currentPlan.predictedYieldMl && (
                  <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-blue-600" />
                      <div>
                        <span className="font-bold text-foreground">
                          Integrated ML Random Forest Model Prediction:
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          Trained on 5,800+ ICAR Indian agricultural harvest points (R² 0.97).
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-blue-700 dark:text-blue-300 block">
                        {currentPlan.predictedYieldMl.predictedYieldQuintalsPerAcre?.toFixed(1)} Q / Acre
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Total: {currentPlan.predictedYieldMl.totalProductionQuintals?.toFixed(1)} Q
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Section C: Land Preparation & Sowing Plan ── */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Layers size={18} className="text-emerald-600" />
                  Land Preparation & Seed Management
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Seed specifications */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2.5">
                    <span className="font-bold text-foreground block text-xs">
                      Seed Requirements for {currentPlan.farmDetails.area.value} {currentPlan.farmDetails.area.unit}:
                    </span>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground block">Seed Rate</span>
                        <span className="font-bold text-foreground">{currentPlan.landPrepAndSowing.seedRatePerAcre}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Total Seed to Procure</span>
                        <span className="font-black text-emerald-600 text-sm">{currentPlan.landPrepAndSowing.totalSeedRequired}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Row & Plant Spacing</span>
                        <span className="font-bold text-foreground">{currentPlan.landPrepAndSowing.spacing}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Sowing Depth</span>
                        <span className="font-bold text-foreground">{currentPlan.landPrepAndSowing.sowingDepth}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/60">
                      <span className="text-[11px] font-bold text-foreground block mb-1">
                        Recommended High-Yielding Varieties for {currentPlan.farmDetails.location.state}:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentPlan.landPrepAndSowing.recommendedVarieties.map((v, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-card border border-border text-[11px] font-semibold text-foreground">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Seed Treatment */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                    <span className="font-bold text-foreground block text-xs">
                      Mandatory Seed Treatment Protocol:
                    </span>
                    <ul className="space-y-1.5 text-[11px] text-muted-foreground list-disc list-inside leading-relaxed">
                      {currentPlan.landPrepAndSowing.seedTreatment.map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ul>

                    <div className="pt-2 border-t border-border/60">
                      <span className="font-bold text-foreground text-xs block mb-1">Recommended Sowing Window:</span>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        {currentPlan.landPrepAndSowing.recommendedWindow}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Field prep steps */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border text-xs space-y-1.5">
                  <span className="font-bold text-foreground block">Land Preparation Operations:</span>
                  <ul className="space-y-1 text-muted-foreground text-[11px] list-decimal list-inside">
                    {currentPlan.landPrepAndSowing.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* ── Section D: Fertilizer & Nutrient Plan ── */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-base font-extrabold text-foreground flex items-center gap-2">
                    <Beaker size={18} className="text-emerald-600" />
                    Fertilizer Plan & Commercial Quantity Requirements
                  </h4>
                  <span className="text-xs font-bold text-muted-foreground">
                    Nutrient Target: {currentPlan.fertilizerPlan.nutrientRecommendation.n}N : {currentPlan.fertilizerPlan.nutrientRecommendation.p}P : {currentPlan.fertilizerPlan.nutrientRecommendation.k}K (kg)
                  </span>
                </div>

                {/* Commercial products conversion table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-border rounded-2xl overflow-hidden divide-y divide-border">
                    <thead className="bg-muted font-bold text-foreground">
                      <tr>
                        <th className="p-3">Commercial Fertilizer</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Standard Bags</th>
                        <th className="p-3">Application Timing</th>
                        <th className="p-3">Method</th>
                        <th className="p-3 text-right">Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {currentPlan.fertilizerPlan.commercialProducts.map((p, idx) => (
                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-bold text-foreground">{p.name}</td>
                          <td className="p-3 font-semibold text-emerald-600">{p.quantityKg} kg</td>
                          <td className="p-3 font-bold text-foreground">{p.bags} Bags</td>
                          <td className="p-3 text-muted-foreground">{p.timing}</td>
                          <td className="p-3 text-muted-foreground">{p.method}</td>
                          <td className="p-3 font-bold text-foreground text-right">₹{p.estimatedCost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1">
                    <span className="font-bold text-foreground block">Organic Manure & Biofertilizers:</span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {currentPlan.fertilizerPlan.organicOptions[0]}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1">
                    <span className="font-bold text-foreground block">Soil-Test Based Adjustments:</span>
                    <ul className="text-[11px] text-muted-foreground list-disc list-inside">
                      {currentPlan.fertilizerPlan.soilTestAdjustments.map((adj, i) => (
                        <li key={i}>{adj}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* ── Section E: Irrigation & Crop Maintenance ── */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Droplets size={18} className="text-blue-500" />
                  Growth-Stage Irrigation & Crop Protection (IPM)
                </h4>

                {/* Irrigation Schedule */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-foreground block">
                    Critical Irrigation Timing Schedule:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {currentPlan.irrigationAndMaintenance.irrigationSchedule.map((irr, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-muted/40 border border-border text-xs space-y-1">
                        <span className="font-bold text-blue-600 block">{irr.stageName}</span>
                        <span className="text-[10px] text-muted-foreground block">{irr.timingDescription}</span>
                        <p className="text-[11px] text-foreground leading-tight">{irr.instructions}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* IPM Pest table */}
                <div className="pt-2 border-t border-border space-y-2">
                  <span className="text-xs font-bold text-foreground block flex items-center gap-1.5">
                    <Bug size={14} className="text-red-500" />
                    Integrated Pest & Disease Management (IPM):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {currentPlan.irrigationAndMaintenance.ipmPractices.map((ipm, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-card border border-border space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground text-xs">{ipm.pest}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-600 font-semibold">Priority</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          <strong>Symptoms:</strong> {ipm.symptoms}
                        </p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          <strong>Biological Control:</strong> {ipm.organicRemedy}
                        </p>
                        <p className="text-[11px] text-blue-700 dark:text-blue-400">
                          <strong>Chemical Control:</strong> {ipm.chemicalRemedy}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Section F: Harvesting & Post-Harvest ── */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Calendar size={18} className="text-amber-500" />
                  Harvesting & Post-Harvest Storage Guide
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1">
                    <span className="font-bold text-foreground block">Maturity Indicators:</span>
                    <ul className="text-[11px] text-muted-foreground list-disc list-inside space-y-0.5">
                      {currentPlan.harvestingAndPostHarvest.maturitySigns.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1">
                    <span className="font-bold text-foreground block">Drying & Safe Storage:</span>
                    <ul className="text-[11px] text-muted-foreground list-disc list-inside space-y-0.5">
                      {currentPlan.harvestingAndPostHarvest.storageGuidance.map((sg, i) => (
                        <li key={i}>{sg}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1">
                    <span className="font-bold text-foreground block">APMC Mandi Selling Advice:</span>
                    <ul className="text-[11px] text-muted-foreground list-disc list-inside space-y-0.5">
                      {currentPlan.harvestingAndPostHarvest.marketPrepTips.map((mp, i) => (
                        <li key={i}>{mp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* ── Section G: Complete Farming Budget & Profit Estimator (Editable) ── */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <h4 className="text-base font-extrabold text-foreground flex items-center gap-2">
                      <DollarSign size={18} className="text-emerald-600" />
                      Farming Budget & Profit Estimator (Editable Local Prices)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Calculated for your actual {currentPlan.farmDetails.area.value} {currentPlan.farmDetails.area.unit}. Adjust input costs or expected price as per your local mandi rates.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">Total Estimated Cost</span>
                    <span className="text-xl font-black text-foreground">
                      ₹{recalculatedBudget?.totalCost?.toLocaleString() || currentPlan.budgetEstimates.totalCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Editable Expenses Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-border rounded-2xl overflow-hidden divide-y divide-border">
                    <thead className="bg-muted font-bold text-foreground">
                      <tr>
                        <th className="p-3">Expense Item</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Details</th>
                        <th className="p-3 text-right">Cost (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {editableExpenses.map((exp, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="p-3 font-semibold text-foreground">{exp.name}</td>
                          <td className="p-3 text-muted-foreground">{exp.category}</td>
                          <td className="p-3 text-muted-foreground text-[11px]">{exp.notes}</td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              value={exp.estimatedCost}
                              onChange={(e) => handleExpenseChange(idx, e.target.value)}
                              className="w-24 text-right text-xs font-bold px-2 py-1 rounded-lg bg-muted border border-border text-foreground focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Selling Price Adjustment */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <label className="font-bold text-foreground block">
                      Assumed Mandi Selling Price (₹ / Quintal):
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      Source: {currentPlan.cropOverview?.priceSource || 'Government of India MSP Benchmark'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">₹</span>
                    <input
                      type="number"
                      step="50"
                      value={editablePrice}
                      onChange={(e) => setEditablePrice(parseFloat(e.target.value) || 0)}
                      className="w-28 font-black text-sm px-3 py-1.5 rounded-xl bg-card border border-border text-foreground"
                    />
                    <span className="text-muted-foreground font-semibold">/ Quintal</span>
                  </div>
                </div>

                {/* Summary Profit/Loss Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-muted/50 border border-border">
                    <span className="text-[10px] text-muted-foreground block">Cost / Acre</span>
                    <span className="text-sm font-bold text-foreground mt-0.5 block">
                      ₹{recalculatedBudget?.costPerAcre?.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/50 border border-border">
                    <span className="text-[10px] text-muted-foreground block">Gross Revenue</span>
                    <span className="text-sm font-bold text-foreground mt-0.5 block">
                      ₹{recalculatedBudget?.grossRevenue?.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-bold">Estimated Net Return</span>
                    <span className="text-base font-black text-emerald-600 mt-0.5 block">
                      ₹{recalculatedBudget?.netReturn?.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/50 border border-border">
                    <span className="text-[10px] text-muted-foreground block">Break-Even Price</span>
                    <span className="text-sm font-bold text-foreground mt-0.5 block">
                      ₹{recalculatedBudget?.breakEvenPrice?.toLocaleString()} / Q
                    </span>
                  </div>
                </div>

                {/* Scenario Analysis */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-foreground block">
                    Three-Outcome Scenario Analysis:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {Object.entries(currentPlan.budgetEstimates.scenarios).map(([key, sc]) => (
                      <div
                        key={key}
                        className={`p-3.5 rounded-2xl border space-y-1.5 ${
                          key === 'moderate'
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : 'bg-muted/40 border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold capitalize text-foreground">{key} Outcome</span>
                          <span className="text-[10px] font-bold text-muted-foreground">{sc.yield} Q/Acre</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-tight">{sc.description}</p>
                        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Net Return:</span>
                          <span className={`font-black ${sc.netReturn >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            ₹{sc.netReturn.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Section H: Farming Calendar & Task Tracking ── */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <h4 className="text-base font-extrabold text-foreground flex items-center gap-2">
                      <Calendar size={18} className="text-emerald-600" />
                      Crop Growth Calendar & Task Tracking
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Check off completed tasks to monitor cultivation progress from sowing through harvest.
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    Progress: {currentPlan.calendarTasks.filter((t) => t.completed).length} / {currentPlan.calendarTasks.length} Done
                  </div>
                </div>

                <div className="space-y-2.5">
                  {currentPlan.calendarTasks.map((task) => (
                    <div
                      key={task.taskId}
                      onClick={() => handleToggleTask(task.taskId)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        task.completed
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-muted-foreground line-through'
                          : 'bg-card border-border hover:border-emerald-500/40 text-foreground'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-emerald-600 shrink-0"
                      >
                        {task.completed ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>

                      <div className="flex-1 min-w-0 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          <span className="font-extrabold text-sm">{task.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                              {task.category}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600">
                              {new Date(task.scheduledDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${task.completed ? 'opacity-70' : 'text-muted-foreground'}`}>
                          {task.instructions}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* SAVED PLANS MODAL                                           */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {showSavedModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-card border border-border rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200 space-y-4">
                <button
                  onClick={() => setShowSavedModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors"
                >
                  <X size={18} />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                    <Bookmark size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">Saved Farming Plans</h3>
                    <p className="text-xs text-muted-foreground">Load any previously prepared cultivation plan</p>
                  </div>
                </div>

                {savedPlans.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
                    <FileText size={32} className="mx-auto text-muted-foreground/50" />
                    <p>No saved farming plans found yet.</p>
                    <p className="text-[11px]">Generate a plan above and click "Save Plan" to store it here.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 divide-y divide-border/60">
                    {savedPlans.map((plan) => (
                      <div
                        key={plan._id}
                        onClick={() => handleLoadSavedPlan(plan)}
                        className="p-3.5 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-all border border-border cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-sm text-foreground group-hover:text-emerald-600 transition-colors">
                              {plan.planTitle}
                            </h5>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                              {plan.cropName}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Saved on {new Date(plan.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} · {plan.calendarTasks?.length || 0} tasks
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSavedPlan(plan._id, e)}
                            className="p-2 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-card"
                            title="Delete Plan"
                          >
                            <Trash2 size={16} />
                          </button>
                          <ChevronRight size={18} className="text-muted-foreground group-hover:text-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-border flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSavedModal(false)}
                    className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
