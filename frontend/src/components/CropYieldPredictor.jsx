import React, { useState, useEffect } from 'react';
import {
  Sprout,
  MapPin,
  Compass,
  CloudSun,
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Layers,
  Sparkles,
  RefreshCw,
  Sliders,
  Calendar,
  Ruler,
  Info,
  ChevronRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { cropAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

// Supported Indian crops with icons and metadata
const CROPS = [
  { id: 'Rice', name: 'Rice (Paddy)', hindi: 'चावल (धान)', marathi: 'भात / तांदूळ', season: 'Kharif', icon: '🌾', typical: '1.8 – 4.5 t/ha' },
  { id: 'Wheat', name: 'Wheat', hindi: 'गेहूं', marathi: 'गहू', season: 'Rabi', icon: '🌾', typical: '1.5 – 4.2 t/ha' },
  { id: 'Maize', name: 'Maize (Corn)', hindi: 'मक्का', marathi: 'मका', season: 'Kharif', icon: '🌽', typical: '1.5 – 5.0 t/ha' },
  { id: 'Cotton', name: 'Cotton', hindi: 'कपास', marathi: 'कापूस', season: 'Kharif', icon: '🌱', typical: '1.0 – 2.8 t/ha' },
  { id: 'Soybean', name: 'Soybean', hindi: 'सोयाबीन', marathi: 'सोयाबीन', season: 'Kharif', icon: '🌿', typical: '0.9 – 2.2 t/ha' },
  { id: 'Sugarcane', name: 'Sugarcane', hindi: 'गन्ना', marathi: 'ऊस', season: 'Whole Year', icon: '🎋', typical: '45 – 85 t/ha' },
  { id: 'Sorghum (Jowar)', name: 'Sorghum (Jowar)', hindi: 'ज्वार', marathi: 'ज्वारी', season: 'Kharif', icon: '🌾', typical: '0.8 – 2.0 t/ha' },
  { id: 'Pearl millet (Bajra)', name: 'Pearl Millet (Bajra)', hindi: 'बाजरा', marathi: 'बाजरी', season: 'Kharif', icon: '🌾', typical: '0.9 – 2.5 t/ha' },
  { id: 'Chickpea (Chana)', name: 'Chickpea (Gram/Chana)', hindi: 'चना', marathi: 'हरभरा / चणा', season: 'Rabi', icon: '🌱', typical: '0.7 – 1.8 t/ha' },
  { id: 'Potato', name: 'Potato', hindi: 'आलू', marathi: 'बटाटा', season: 'Rabi', icon: '🥔', typical: '10 – 25 t/ha' },
  { id: 'Onion', name: 'Onion', hindi: 'प्याज', marathi: 'कांदा', season: 'Rabi', icon: '🧅', typical: '8 – 22 t/ha' },
  { id: 'Groundnut', name: 'Groundnut (Peanut)', hindi: 'मूंगफली', marathi: 'भुईमूग', season: 'Kharif', icon: '🥜', typical: '1.0 – 2.5 t/ha' },
];

const SEASONS = [
  { id: 'Kharif', label: 'Kharif (Monsoon / Summer sowing)', period: 'June – October' },
  { id: 'Rabi', label: 'Rabi (Winter sowing)', period: 'October – March' },
  { id: 'Summer', label: 'Summer / Zaid', period: 'March – June' },
  { id: 'Whole Year', label: 'Whole Year (Perennial / Annual)', period: 'Full Year' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const SOIL_TYPES = [
  { id: 'alluvial', label: 'Alluvial Soil (Fertile river plains)' },
  { id: 'black', label: 'Black / Regur Soil (Ideal for Cotton & Soybean)' },
  { id: 'red', label: 'Red / Yellow Soil (Good drainage)' },
  { id: 'clayey', label: 'Clayey Soil (High moisture retention)' },
  { id: 'sandy loam', label: 'Sandy Loam (Ideal for Potato, Onion, Groundnut)' },
  { id: 'laterite', label: 'Laterite Soil (Acidic / Hill areas)' },
];

const IRRIGATION_TYPES = [
  { id: 'irrigated', label: 'Canal / Borewell / Well Irrigated (+15% boost)' },
  { id: 'drip/sprinkler', label: 'Micro-Irrigation: Drip / Sprinkler (+25% boost)' },
  { id: 'partially irrigated', label: 'Partially Irrigated (Occasional watering)' },
  { id: 'rainfed', label: 'Rainfed (Dependent on monsoon rain)' },
];

// Weather interpretation code
const getWeatherDesc = (code) => {
  if (code === 0) return 'Clear Sky';
  if ([1, 2, 3].includes(code)) return 'Partly Cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55, 61, 63, 65].includes(code)) return 'Rain Showers';
  if ([80, 81, 82].includes(code)) return 'Heavy Rain';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Overcast';
};

export default function CropYieldPredictor() {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();

  // Form State
  const [selectedCrop, setSelectedCrop] = useState(CROPS[0].id);
  const [season, setSeason] = useState(CROPS[0].season);
  const [area, setArea] = useState('2.5');
  const [areaUnit, setAreaUnit] = useState('acres');
  const [selectedState, setSelectedState] = useState('Maharashtra');
  const [soilType, setSoilType] = useState('black');
  const [irrigation, setIrrigation] = useState('irrigated');

  // Geolocation State
  const [coords, setCoords] = useState(null); // { lat, lon, accuracy }
  const [locationName, setLocationName] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [manualLocationMode, setManualLocationMode] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');

  // Open-Meteo Weather State
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  // Prediction State
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictError, setPredictError] = useState('');

  // Sync default season when crop changes
  const handleCropChange = (cropId) => {
    setSelectedCrop(cropId);
    const found = CROPS.find((c) => c.id === cropId);
    if (found && found.season) {
      setSeason(found.season);
    }
  };

  // Browser Geolocation API: Detect My Location
  const handleDetectLocation = () => {
    setLocationError('');
    setIsLocating(true);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your current browser. Please enter your location manually.');
      setIsLocating(false);
      setManualLocationMode(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const detected = {
          lat: parseFloat(latitude.toFixed(5)),
          lon: parseFloat(longitude.toFixed(5)),
          accuracy: Math.round(accuracy),
        };
        setCoords(detected);
        setManualLat(detected.lat.toString());
        setManualLon(detected.lon.toString());
        setIsLocating(false);

        // Fetch free reverse geocoding to identify Indian State/District
        fetchReverseGeocode(detected.lat, detected.lon);

        // Auto-fetch Open-Meteo weather
        fetchOpenMeteoWeather(detected.lat, detected.lon);
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Failed to retrieve location.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = 'Location permission was denied. Please allow location access in your browser or enter coordinates manually below.';
            break;
          case err.POSITION_UNAVAILABLE:
            msg = 'Location information is currently unavailable from your device. Please enter coordinates manually.';
            break;
          case err.TIMEOUT:
            msg = 'Location request timed out. Please try again or enter your location manually.';
            break;
          default:
            msg = err.message || 'An unknown location error occurred.';
        }
        setLocationError(msg);
        setManualLocationMode(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Reverse Geocoding (free client-side lookup via BigDataCloud or Nominatim)
  const fetchReverseGeocode = async (lat, lon) => {
    try {
      const resp = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      if (resp.ok) {
        const data = await resp.json();
        const city = data.city || data.locality || data.principalSubdivision || '';
        const stateName = data.principalSubdivision || '';
        setLocationName(`${city}${city && stateName ? ', ' : ''}${stateName}`);

        // Match detected state if recognized in Indian States list
        if (stateName) {
          const matched = INDIAN_STATES.find(
            (st) => st.toLowerCase() === stateName.toLowerCase() || stateName.toLowerCase().includes(st.toLowerCase())
          );
          if (matched) {
            setSelectedState(matched);
          }
        }
      }
    } catch (e) {
      console.warn('Reverse geocoding unavailable (non-critical):', e);
    }
  };

  // Fetch Weather Data from Open-Meteo (Free Open Weather API)
  const fetchOpenMeteoWeather = async (lat, lon) => {
    setWeatherLoading(true);
    setWeatherError('');
    try {
      // 1. Live Current & 7-Day Forecast from Open-Meteo Forecast API
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
      const res = await fetch(forecastUrl);
      if (!res.ok) throw new Error(`Open-Meteo forecast error ${res.status}`);
      const data = await res.json();

      // 2. Fetch Historical Annual Rainfall from Open-Meteo Archive API
      let annualRain = null;
      try {
        const lastYear = new Date().getFullYear() - 1;
        const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${lastYear}-01-01&end_date=${lastYear}-12-31&daily=precipitation_sum&timezone=auto`;
        const archRes = await fetch(archiveUrl);
        if (archRes.ok) {
          const archData = await archRes.json();
          const precipList = archData.daily?.precipitation_sum || [];
          const totalSum = precipList.reduce((acc, curr) => acc + (curr || 0), 0);
          if (totalSum > 50) {
            annualRain = Math.round(totalSum * 10) / 10;
          }
        }
      } catch (archErr) {
        console.warn('Open-Meteo Archive historical rainfall unavailable, will use regional default:', archErr);
      }

      const current = data.current || {};
      const daily = data.daily || {};

      setWeatherData({
        source: 'Open-Meteo (open-meteo.com)',
        latitude: lat,
        longitude: lon,
        temp: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        precipitation: current.precipitation,
        windSpeed: current.wind_speed_10m,
        weatherCode: current.weather_code,
        weatherDesc: getWeatherDesc(current.weather_code),
        annualRainfall: annualRain,
        forecastMax: daily.temperature_2m_max ? Math.max(...daily.temperature_2m_max) : null,
        forecastMin: daily.temperature_2m_min ? Math.min(...daily.temperature_2m_min) : null,
        forecastRainSum: daily.precipitation_sum
          ? Math.round(daily.precipitation_sum.reduce((a, b) => a + (b || 0), 0) * 10) / 10
          : 0,
      });
    } catch (err) {
      console.error('Weather fetch error:', err);
      setWeatherError('Unable to fetch live weather from Open-Meteo. Regional historical averages will be used.');
    } finally {
      setWeatherLoading(false);
    }
  };

  // Manual Coordinates Apply
  const handleApplyManualCoords = () => {
    const parsedLat = parseFloat(manualLat);
    const parsedLon = parseFloat(manualLon);
    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      setLocationError('Please enter valid numeric latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    if (parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
      setLocationError('Coordinates out of range. Latitude: -90 to 90, Longitude: -180 to 180.');
      return;
    }
    setLocationError('');
    setCoords({ lat: parsedLat, lon: parsedLon, accuracy: null });
    fetchReverseGeocode(parsedLat, parsedLon);
    fetchOpenMeteoWeather(parsedLat, parsedLon);
  };

  // Submit Prediction Request
  const handlePredict = async (e) => {
    e.preventDefault();
    setPredictError('');
    setPredictionResult(null);

    const numericArea = parseFloat(area);
    if (isNaN(numericArea) || numericArea <= 0) {
      setPredictError('Please enter a valid positive farm area.');
      return;
    }

    setIsPredicting(true);

    try {
      const payload = {
        crop: selectedCrop,
        state: selectedState,
        season,
        area: numericArea,
        areaUnit,
        soilType,
        irrigation,
        latitude: coords?.lat,
        longitude: coords?.lon,
        annualRainfall: weatherData?.annualRainfall || null,
        weatherContext: weatherData ? {
          temperature: weatherData.temp,
          humidity: weatherData.humidity,
          precipitation: weatherData.precipitation,
          weatherDesc: weatherData.weatherDesc,
        } : null,
      };

      const res = await cropAPI.predictYield(payload);
      if (res.data?.success && res.data.data) {
        setPredictionResult(res.data.data);
      } else {
        throw new Error(res.data?.message || 'Failed to calculate yield prediction');
      }
    } catch (err) {
      console.error('Prediction failed:', err);
      setPredictError(err.response?.data?.message || err.message || 'Error occurred while predicting yield.');
    } finally {
      setIsPredicting(false);
    }
  };

  const selectedCropMeta = CROPS.find((c) => c.id === selectedCrop);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-bold mb-3 backdrop-blur-sm">
            <Sparkles size={14} className="text-yellow-300" />
            <span>AI Agricultural Yield Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Location-Based Crop Yield Prediction
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Predict your expected harvest yield and total production using your device's geographical coordinates, live & seasonal weather indicators from Open-Meteo, and trained Machine Learning models on Indian agricultural data.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handlePredict} className="bg-card rounded-3xl border border-border p-6 shadow-sm space-y-6">
            {/* Step 1: Crop Selection */}
            <div>
              <label className="block text-sm font-black text-foreground mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sprout size={18} className="text-emerald-500" />
                  1. Select Crop to Cultivate
                </span>
                <span className="text-xs font-normal text-muted-foreground">12 Indian Crops Supported</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {CROPS.map((crop) => {
                  const active = selectedCrop === crop.id;
                  return (
                    <button
                      key={crop.id}
                      type="button"
                      onClick={() => handleCropChange(crop.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        active
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/30'
                          : 'border-border bg-card hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xl">{crop.icon}</span>
                        {active && <CheckCircle2 size={16} className="text-emerald-600" />}
                      </div>
                      <div>
                        <p className="font-black text-xs sm:text-sm leading-tight">{crop.name}</p>
                        {language === 'hi' && <p className="text-[10px] text-muted-foreground mt-0.5">{crop.hindi}</p>}
                        {language === 'mr' && <p className="text-[10px] text-muted-foreground mt-0.5">{crop.marathi}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Location Detection (Geolocation API) */}
            <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-foreground flex items-center gap-2">
                  <MapPin size={18} className="text-emerald-500" />
                  2. Farm Location Detection
                </label>
                <button
                  type="button"
                  onClick={() => setManualLocationMode(!manualLocationMode)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                >
                  {manualLocationMode ? 'Use Geolocation' : 'Manual Coordinates'}
                </button>
              </div>

              {!manualLocationMode ? (
                <div>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="w-full py-3 px-4 rounded-xl font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60"
                  >
                    {isLocating ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Detecting Browser Coordinates...
                      </>
                    ) : (
                      <>
                        <Compass size={18} />
                        Detect My Location (Browser GPS)
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
                    Uses native Browser Geolocation. Requires location permission on HTTPS or localhost.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1">Latitude (°N)</label>
                      <input
                        type="number"
                        step="any"
                        value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)}
                        placeholder="e.g. 18.5204"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1">Longitude (°E)</label>
                      <input
                        type="number"
                        step="any"
                        value={manualLon}
                        onChange={(e) => setManualLon(e.target.value)}
                        placeholder="e.g. 73.8567"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyManualCoords}
                    className="w-full py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                  >
                    Apply Coordinates & Fetch Weather
                  </button>
                </div>
              )}

              {/* Location Feedback and Coordinate Display */}
              {coords && (
                <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100 flex items-start gap-2.5 text-xs">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">
                      Location Detected: {coords.lat}° N, {coords.lon}° E
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {locationName ? `Area: ${locationName}` : 'Accuracy: '}
                      {coords.accuracy ? ` (±${coords.accuracy}m accuracy)` : ''}
                    </p>
                  </div>
                </div>
              )}

              {locationError && (
                <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-2 text-xs">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p>{locationError}</p>
                </div>
              )}
            </div>

            {/* Step 3: State & Season */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Indian State / Region</label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-medium"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-emerald-500" />
                  Sowing Season
                </label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-medium"
                >
                  {SEASONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 4: Cultivated Area */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                <Ruler size={14} className="text-emerald-500" />
                Cultivated Farm Area
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-bold"
                  placeholder="e.g. 3.5"
                />
                <select
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value)}
                  className="w-36 px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-semibold"
                >
                  <option value="acres">Acres (एकड़)</option>
                  <option value="hectares">Hectares (हेक्टेयर)</option>
                  <option value="guntha">Guntha (गुंठा)</option>
                  <option value="bigha">Bigha (बीघा)</option>
                </select>
              </div>
            </div>

            {/* Step 5: Soil Type & Irrigation Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Layers size={14} className="text-emerald-500" />
                  Soil Classification
                </label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm"
                >
                  {SOIL_TYPES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Droplets size={14} className="text-emerald-500" />
                  Irrigation Facility
                </label>
                <select
                  value={irrigation}
                  onChange={(e) => setIrrigation(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm"
                >
                  {IRRIGATION_TYPES.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            {predictError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-200 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{predictError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isPredicting}
              className="w-full py-4 rounded-2xl font-black text-base bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isPredicting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Predicting Yield with Machine Learning...
                </>
              ) : (
                <>
                  <TrendingUp size={20} />
                  Predict Crop Yield
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Weather & Prediction Result */}
        <div className="lg:col-span-5 space-y-6">
          {/* Open-Meteo Weather Card */}
          <div className="bg-card rounded-3xl border border-border p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <CloudSun size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground">Open-Meteo Weather Data</h3>
                  <p className="text-[10px] text-muted-foreground">Free Meteorological Forecast & Archive</p>
                </div>
              </div>

              {coords && (
                <button
                  type="button"
                  onClick={() => fetchOpenMeteoWeather(coords.lat, coords.lon)}
                  disabled={weatherLoading}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 p-1 rounded hover:bg-muted"
                  title="Refresh weather data"
                >
                  <RefreshCw size={14} className={weatherLoading ? 'animate-spin' : ''} />
                </button>
              )}
            </div>

            {weatherLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <RefreshCw size={20} className="animate-spin text-sky-500" />
                <span>Fetching meteorological data from Open-Meteo...</span>
              </div>
            ) : weatherData ? (
              <div className="space-y-3">
                {/* Current Weather Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border text-center">
                    <div className="flex justify-center text-amber-500 mb-1">
                      <Thermometer size={16} />
                    </div>
                    <p className="text-xs font-black text-foreground">{weatherData.temp}°C</p>
                    <p className="text-[10px] text-muted-foreground">Temperature</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border text-center">
                    <div className="flex justify-center text-blue-500 mb-1">
                      <Droplets size={16} />
                    </div>
                    <p className="text-xs font-black text-foreground">{weatherData.humidity}%</p>
                    <p className="text-[10px] text-muted-foreground">Humidity</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border text-center">
                    <div className="flex justify-center text-sky-500 mb-1">
                      <CloudRain size={16} />
                    </div>
                    <p className="text-xs font-black text-foreground">{weatherData.precipitation} mm</p>
                    <p className="text-[10px] text-muted-foreground">Current Rain</p>
                  </div>
                </div>

                {/* Seasonal vs Current distinction badge */}
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-sky-900 dark:text-sky-200">
                    <span>Annual Rainfall Indicator</span>
                    <span className="text-sky-600 font-black">
                      {weatherData.annualRainfall ? `${weatherData.annualRainfall} mm` : 'Regional Avg (~1100 mm)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Historical annual rainfall from Open-Meteo archive used for seasonal crop model calibration.
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                  <span>Conditions: {weatherData.weatherDesc}</span>
                  <a
                    href="https://open-meteo.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-sky-500"
                  >
                    Open-Meteo (CC BY 4.0)
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <Compass size={28} className="mx-auto mb-2 opacity-40" />
                <p>Click "Detect My Location" above to pull real-time weather and precipitation records for your coordinates.</p>
              </div>
            )}
          </div>

          {/* Prediction Result Display */}
          {predictionResult && (
            <div className="bg-card rounded-3xl border-2 border-emerald-500 p-6 shadow-md space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedCropMeta?.icon || '🌾'}</span>
                  <div>
                    <h3 className="font-black text-base text-foreground leading-tight">
                      {predictionResult.crop} Yield Estimate
                    </h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {predictionResult.state} • {predictionResult.season} Season
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-black text-xs">
                  {predictionResult.prediction.modelConfidence} Confidence
                </span>
              </div>

              {/* Main Numbers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-600 text-white text-center shadow-sm">
                  <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider mb-0.5">Estimated Yield</p>
                  <p className="text-2xl font-black">
                    {predictionResult.prediction.yieldPerHectareTonnes}{' '}
                    <span className="text-xs font-semibold">t/ha</span>
                  </p>
                  <p className="text-[11px] text-emerald-200 mt-1">
                    ≈ {predictionResult.prediction.yieldPerAcreQuintals} Quintals / Acre
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-muted/60 border border-border text-center">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Total Harvest</p>
                  <p className="text-2xl font-black text-foreground">
                    {predictionResult.prediction.totalProduction.tonnes}{' '}
                    <span className="text-xs font-semibold">Tonnes</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    ({predictionResult.prediction.totalProduction.quintals} Quintals on {predictionResult.cultivatedArea.value} {predictionResult.cultivatedArea.unit})
                  </p>
                </div>
              </div>

              {/* Range & Agronomic Factors */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">Expected Range:</span>
                  <span className="font-bold text-foreground">
                    {predictionResult.prediction.expectedYieldRange.min} – {predictionResult.prediction.expectedYieldRange.max} tonnes/ha
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">Irrigation & Soil Factors:</span>
                  <span className="font-bold text-foreground">
                    {predictionResult.agronomicFactors.irrigation} (x{predictionResult.agronomicFactors.irrigationMultiplier})
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground">Rainfall Used:</span>
                  <span className="font-bold text-foreground">
                    {predictionResult.weatherApplied.annualRainfallMm} mm
                  </span>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p>{predictionResult.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
