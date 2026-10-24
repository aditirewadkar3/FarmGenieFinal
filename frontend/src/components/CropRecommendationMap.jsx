import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Search,
  Crosshair,
  CloudSun,
  Thermometer,
  Droplets,
  CloudRain,
  Sparkles,
  TrendingUp,
  Sprout,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  BookOpen,
  Calendar,
  X,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { cropAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

// Fix Leaflet marker icons for Vite/Webpack bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom glowing pin icon for farm location
const farmPinIcon = new L.DivIcon({
  className: 'custom-farm-pin',
  html: `
    <div style="
      position: relative;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.35);
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #059669;
        border: 3px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
      ">🌱</div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

// Pre-curated Indian Agricultural Regions for quick selection
const QUICK_REGIONS = [
  { name: 'Maharashtra (Nashik / Pune)', state: 'Maharashtra', district: 'Nashik', lat: 19.9975, lon: 73.7898, soil: 'black', tag: '🍇 Horticulture & Onions' },
  { name: 'Punjab (Ludhiana)', state: 'Punjab', district: 'Ludhiana', lat: 30.901, lon: 75.8573, soil: 'alluvial', tag: '🌾 Wheat & Rice Granary' },
  { name: 'Uttar Pradesh (Varanasi / Lucknow)', state: 'Uttar Pradesh', district: 'Varanasi', lat: 25.3176, lon: 82.9739, soil: 'alluvial', tag: '🎋 Sugarcane & Pulses' },
  { name: 'Gujarat (Rajkot / Saurashtra)', state: 'Gujarat', district: 'Rajkot', lat: 22.3039, lon: 70.8022, soil: 'black', tag: '🥜 Groundnut & Cotton' },
  { name: 'Madhya Pradesh (Indore / Malwa)', state: 'Madhya Pradesh', district: 'Indore', lat: 22.7196, lon: 75.8577, soil: 'black', tag: '🌿 Soybean Capital' },
  { name: 'Karnataka (Dharwad / Mandya)', state: 'Karnataka', district: 'Dharwad', lat: 15.4589, lon: 75.0078, soil: 'red', tag: '🌽 Maize, Cotton & Millets' },
  { name: 'Rajasthan (Kota / Jaipur)', state: 'Rajasthan', district: 'Kota', lat: 25.2138, lon: 75.8648, soil: 'sandy loam', tag: '🌼 Mustard & Bajra' },
  { name: 'West Bengal (Hooghly)', state: 'West Bengal', district: 'Hooghly', lat: 22.904, lon: 88.3888, soil: 'alluvial', tag: '🥔 Potato & Jute' },
];

const SOIL_OPTIONS = [
  { id: 'black', label: 'Black / Regur Soil', desc: 'Moisture rich, great for Cotton & Soybean' },
  { id: 'alluvial', label: 'Alluvial Soil', desc: 'Fertile river silt, ideal for Wheat & Rice' },
  { id: 'red', label: 'Red & Yellow Soil', desc: 'Well drained, suitable for Groundnut & Millets' },
  { id: 'sandy loam', label: 'Sandy Loam', desc: 'Light & friable, great for Potato & Onion' },
  { id: 'clayey', label: 'Clayey Soil', desc: 'High water retention, ideal for Paddy & Cane' },
  { id: 'laterite', label: 'Laterite / Hill Soil', desc: 'Acidic, good for Spices & Plantation' },
];

const SEASONS = [
  { id: 'All', label: 'All Seasons' },
  { id: 'Kharif', label: 'Kharif (Monsoon / Summer)', sub: 'June – October' },
  { id: 'Rabi', label: 'Rabi (Winter)', sub: 'October – April' },
  { id: 'Summer', label: 'Zaid / Summer', sub: 'March – June' },
  { id: 'Whole Year', label: 'Annual / Perennial', sub: 'Year-round' },
];

const IRRIGATION_TYPES = [
  { id: 'irrigated', label: 'Canal / Borewell Irrigated' },
  { id: 'drip/sprinkler', label: 'Drip / Micro-Irrigation' },
  { id: 'rainfed', label: 'Rainfed (Monsoon dependent)' },
];

// Helper to handle map clicks
function MapClickObserver({ onLocationSelected }) {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Helper to animate fly-to on coordinate changes
function MapFlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.lat && coords.lon) {
      map.flyTo([coords.lat, coords.lon], Math.max(map.getZoom(), 8), {
        duration: 1.2,
      });
    }
  }, [coords, map]);
  return null;
}

export default function CropRecommendationMap() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { isDark } = useTheme();

  // Location State (Default: Maharashtra Agricultural Belt)
  const [coords, setCoords] = useState({ lat: 19.9975, lon: 73.7898 });
  const [locationName, setLocationName] = useState('Nashik, Maharashtra');
  const [stateName, setStateName] = useState('Maharashtra');
  const [districtName, setDistrictName] = useState('Nashik');
  const [isLocating, setIsLocating] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Agronomic Controls
  const [selectedSoil, setSelectedSoil] = useState('black');
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [selectedIrrigation, setSelectedIrrigation] = useState('irrigated');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Weather State
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Recommendations State
  const [recommendations, setRecommendations] = useState([]);
  const [regionInfo, setRegionInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCropDetail, setSelectedCropDetail] = useState(null);


  // Map Tile layer option: street | satellite
  const [mapLayer, setMapLayer] = useState('street');

  // Load initial recommendations on mount
  useEffect(() => {
    fetchLocationDetailsAndRecommend(coords.lat, coords.lon, true);
  }, []);

  // Fetch Reverse Geocode, Live Weather, and Recommendations
  const fetchLocationDetailsAndRecommend = async (lat, lon, autoDetectSoil = false) => {
    setIsLoading(true);
    setWeatherLoading(true);

    try {
      // 1. Reverse Geocoding via Nominatim
      let detectedState = stateName;
      let detectedDistrict = districtName;
      let placeDisplayName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

      try {
        const geoResp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`
        );
        if (geoResp.ok) {
          const geoData = await geoResp.json();
          const addr = geoData.address || {};
          detectedState = addr.state || detectedState;
          detectedDistrict =
            addr.state_district || addr.county || addr.district || addr.city || detectedDistrict;
          const locality = addr.city || addr.town || addr.village || addr.suburb || detectedDistrict;
          placeDisplayName = `${locality ? locality + ', ' : ''}${detectedState}`;
          setLocationName(placeDisplayName);
          setStateName(detectedState);
          setDistrictName(detectedDistrict);

          // Auto-select typical soil for this state if requested
          if (autoDetectSoil) {
            if (['Maharashtra', 'Gujarat', 'Madhya Pradesh'].includes(detectedState)) {
              setSelectedSoil('black');
            } else if (['Punjab', 'Haryana', 'Uttar Pradesh', 'Bihar', 'West Bengal'].includes(detectedState)) {
              setSelectedSoil('alluvial');
            } else if (['Karnataka', 'Tamil Nadu', 'Andhra Pradesh'].includes(detectedState)) {
              setSelectedSoil('red');
            } else if (['Rajasthan'].includes(detectedState)) {
              setSelectedSoil('sandy loam');
            }
          }
        }
      } catch (geoErr) {
        console.warn('Reverse geocode error:', geoErr);
      }

      // 2. Fetch Live Weather via backend or Open-Meteo
      let weather = null;
      try {
        const weatherResp = await cropAPI.getOpenMeteoWeather(lat, lon);
        if (weatherResp.data?.success) {
          weather = weatherResp.data.data;
          setWeatherData(weather);
        }
      } catch (wErr) {
        console.warn('Weather fetch fallback:', wErr);
      }
      setWeatherLoading(false);

      // 3. Request Crop Recommendations from Backend
      try {
        const res = await cropAPI.getRecommendations({
          latitude: lat,
          longitude: lon,
          state: detectedState,
          district: detectedDistrict,
          soilType: selectedSoil,
          season: selectedSeason,
          irrigation: selectedIrrigation,
        });

        if (res.data?.success) {
          setRecommendations(res.data.data.recommendations || []);
          setRegionInfo(res.data.data.regionInfo || null);
          if (res.data.data.weather && !weather) {
            setWeatherData(res.data.data.weather);
          }
        }
      } catch (recErr) {
        console.error('Recommendation API error:', recErr);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
      setWeatherLoading(false);
    }
  };

  // Re-run recommendations when user changes soil, season, or irrigation
  useEffect(() => {
    if (coords) {
      fetchRecommendationsOnly();
    }
  }, [selectedSoil, selectedSeason, selectedIrrigation]);

  const fetchRecommendationsOnly = async () => {
    setIsLoading(true);
    try {
      const res = await cropAPI.getRecommendations({
        latitude: coords.lat,
        longitude: coords.lon,
        state: stateName,
        district: districtName,
        soilType: selectedSoil,
        season: selectedSeason,
        irrigation: selectedIrrigation,
      });
      if (res.data?.success) {
        setRecommendations(res.data.data.recommendations || []);
        setRegionInfo(res.data.data.regionInfo || null);
      }
    } catch (e) {
      console.error('Failed to refresh recommendations:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Map Click Handler
  const handleMapClick = (lat, lng) => {
    const newCoords = {
      lat: parseFloat(lat.toFixed(5)),
      lon: parseFloat(lng.toFixed(5)),
    };
    setCoords(newCoords);
    fetchLocationDetailsAndRecommend(newCoords.lat, newCoords.lon, true);
  };

  // Preset Region Selection
  const handleSelectPresetRegion = (region) => {
    const newCoords = { lat: region.lat, lon: region.lon };
    setCoords(newCoords);
    setLocationName(`${region.district}, ${region.state}`);
    setStateName(region.state);
    setDistrictName(region.district);
    setSelectedSoil(region.soil);
    fetchLocationDetailsAndRecommend(region.lat, region.lon, false);
  };

  // Geolocation: My Location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detected = {
          lat: parseFloat(pos.coords.latitude.toFixed(5)),
          lon: parseFloat(pos.coords.longitude.toFixed(5)),
        };
        setCoords(detected);
        fetchLocationDetailsAndRecommend(detected.lat, detected.lon, true);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        alert(`Unable to get location: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Location Search Handler
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ', India'
        )}&limit=5&countrycodes=in`
      );
      if (resp.ok) {
        const data = await resp.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setCoords({ lat, lon });
    setShowSearchResults(false);
    setSearchQuery('');
    fetchLocationDetailsAndRecommend(lat, lon, true);
  };

  // Category Filtering
  const filteredCrops = recommendations.filter((crop) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'high') return crop.suitabilityScore >= 90;
    if (categoryFilter === 'cash')
      return (
        crop.category.toLowerCase().includes('cash') ||
        crop.category.toLowerCase().includes('fiber') ||
        crop.category.toLowerCase().includes('commercial')
      );
    if (categoryFilter === 'cereal')
      return crop.category.toLowerCase().includes('cereal') || crop.category.toLowerCase().includes('staple');
    if (categoryFilter === 'pulse')
      return (
        crop.category.toLowerCase().includes('pulse') ||
        crop.category.toLowerCase().includes('oilseed')
      );
    if (categoryFilter === 'horticulture')
      return (
        crop.category.toLowerCase().includes('vegetable') ||
        crop.category.toLowerCase().includes('fruit') ||
        crop.category.toLowerCase().includes('spice')
      );
    if (categoryFilter === 'drought')
      return (
        crop.waterRequirement.toLowerCase().includes('low') ||
        crop.waterRequirement.toLowerCase().includes('drought')
      );
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── Top Header & Hero ── */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white mb-3">
            <Compass size={14} className="animate-spin-slow" />
            <span>Interactive Agro-Climatic Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Region & Map-Based Crop Recommendations
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-50 leading-relaxed">
            Click anywhere on the map to pinpoint your farm location. Our agronomic engine instantly analyzes the local climate, soil characteristics, rainfall patterns, and season to recommend the most profitable, high-yielding crops for your region.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs sm:text-sm hover:bg-emerald-50 transition-all shadow-md active:scale-95 disabled:opacity-75"
            >
              <Crosshair size={16} className={isLocating ? 'animate-spin' : ''} />
              {isLocating ? 'Detecting Location...' : 'Use My Current Location'}
            </button>

          </div>
        </div>
      </div>

      {/* ── Quick Region Presets ── */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <MapPin size={14} className="text-emerald-500" />
            Quick Select Major Agricultural Belts:
          </span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Click any region to inspect recommendations
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {QUICK_REGIONS.map((reg) => (
            <button
              key={reg.name}
              onClick={() => handleSelectPresetRegion(reg)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                stateName === reg.state && districtName === reg.district
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-muted/50 hover:bg-muted text-foreground border-border hover:border-emerald-500/50'
              }`}
            >
              <span>{reg.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Map and Selected Location Context Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Leaflet Map (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col h-[520px]">
            {/* Map Top Bar with Search & Layer Toggle */}
            <div className="p-3 border-b border-border bg-card/90 backdrop-blur-sm flex items-center gap-2 z-10 relative">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search village, city, district, or state..."
                  className="w-full pl-9 pr-20 py-2 rounded-xl text-xs bg-muted/60 border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500 text-foreground"
                />
                <Search size={15} className="absolute left-3 top-2.5 text-muted-foreground" />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-1.5 top-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors"
                >
                  {isSearching ? '...' : 'Search'}
                </button>

                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-border">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSearchResult(item)}
                        className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors text-xs text-foreground flex items-center gap-2"
                      >
                        <MapPin size={14} className="text-emerald-500 shrink-0" />
                        <span className="truncate">{item.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </form>

              {/* Map Layer Switcher */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border shrink-0">
                <button
                  onClick={() => setMapLayer('street')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    mapLayer === 'street'
                      ? 'bg-card text-emerald-600 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Map
                </button>
                <button
                  onClick={() => setMapLayer('satellite')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    mapLayer === 'satellite'
                      ? 'bg-card text-emerald-600 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Satellite
                </button>
              </div>
            </div>

            {/* Leaflet Map Canvas */}
            <div className="flex-1 relative w-full h-full">
              <MapContainer
                center={[coords.lat, coords.lon]}
                zoom={7}
                scrollWheelZoom={true}
                className="w-full h-full"
                style={{ height: '100%', width: '100%' }}
              >
                {mapLayer === 'street' ? (
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                ) : (
                  <TileLayer
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                )}

                <MapClickObserver onLocationSelected={handleMapClick} />
                <MapFlyTo coords={coords} />

                <Marker position={[coords.lat, coords.lon]} icon={farmPinIcon}>
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 text-center">
                      <p className="font-bold text-xs text-foreground mb-1">{locationName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E
                      </p>
                      <p className="text-[10px] font-semibold text-emerald-600 mt-1">
                        Active Farm Location
                      </p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>

              {/* Map floating prompt */}
              <div className="absolute bottom-3 left-3 z-[400] bg-background/90 backdrop-blur-md border border-border px-3 py-1.5 rounded-xl shadow-lg pointer-events-none flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-medium text-foreground">
                  Click anywhere on map to reposition farm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Environmental & Agro-Climatic Context (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Selected Location Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle2 size={12} /> Selected Farm Region
                </span>
                <h3 className="text-lg font-extrabold text-foreground mt-0.5">{locationName}</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  Coordinates: {coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E
                </p>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold text-center">
                {regionInfo?.agroClimaticZone ? regionInfo.agroClimaticZone.split(' ')[0] : 'Regional'} Zone
              </div>
            </div>

            {/* Live Regional Climate Metrics */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex flex-col items-center text-center">
                <Thermometer size={18} className="text-amber-500 mb-1" />
                <span className="text-[10px] text-muted-foreground font-medium">Temperature</span>
                <span className="text-sm font-black text-foreground mt-0.5">
                  {weatherLoading ? '...' : `${weatherData?.current?.temperature ?? 28}°C`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border flex flex-col items-center text-center">
                <Droplets size={18} className="text-blue-500 mb-1" />
                <span className="text-[10px] text-muted-foreground font-medium">Humidity</span>
                <span className="text-sm font-black text-foreground mt-0.5">
                  {weatherLoading ? '...' : `${weatherData?.current?.humidity ?? 62}%`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border flex flex-col items-center text-center">
                <CloudRain size={18} className="text-teal-500 mb-1" />
                <span className="text-[10px] text-muted-foreground font-medium">Rainfall Est.</span>
                <span className="text-sm font-black text-foreground mt-0.5">
                  {weatherLoading ? '...' : `${weatherData?.annualRainfallMm ?? 820} mm`}
                </span>
              </div>
            </div>

            {/* Agro-Climatic Zone info */}
            {regionInfo && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-xs space-y-1">
                <div className="font-bold text-emerald-900 dark:text-emerald-300">
                  {regionInfo.agroClimaticZone}
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Climate: {regionInfo.climate} · Elevation: {regionInfo.elevation}
                </p>
              </div>
            )}

            {/* Interactive Agronomic Tuners */}
            <div className="space-y-3 pt-2 border-t border-border">
              {/* Soil Selector */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">
                  Soil Type in Your Field:
                </label>
                <select
                  value={selectedSoil}
                  onChange={(e) => setSelectedSoil(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-muted/60 border border-border text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {SOIL_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.desc})
                    </option>
                  ))}
                </select>
              </div>

              {/* Season Selector */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    Target Season:
                  </label>
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-muted/60 border border-border text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {SEASONS.map((sn) => (
                      <option key={sn.id} value={sn.id}>
                        {sn.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Irrigation Selector */}
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">
                    Water / Irrigation:
                  </label>
                  <select
                    value={selectedIrrigation}
                    onChange={(e) => setSelectedIrrigation(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-muted/60 border border-border text-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {IRRIGATION_TYPES.map((ir) => (
                      <option key={ir.id} value={ir.id}>
                        {ir.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recommendations Section Header & Category Filters ── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sprout className="text-emerald-500" size={22} />
              <h2 className="text-xl font-extrabold text-foreground">
                Recommended Plants & Crops for {districtName || locationName}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ranked by agro-climatic compatibility score, seasonal alignment, and market profitability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">
              {filteredCrops.length} Crops Available
            </span>
            <button
              onClick={fetchRecommendationsOnly}
              disabled={isLoading}
              className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-all"
              title="Refresh Recommendations"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: 'all', label: 'All Crops' },
            { id: 'high', label: 'Top Matches (90%+ Suitability)' },
            { id: 'cash', label: 'Cash & Commercial' },
            { id: 'cereal', label: 'Cereals & Grains' },
            { id: 'pulse', label: 'Pulses & Oilseeds' },
            { id: 'horticulture', label: 'Horticulture & Vegetables' },
            { id: 'drought', label: 'Low Water / Drought Hardy' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                categoryFilter === cat.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:border-emerald-500/40 hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Recommendations Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-card border border-border rounded-2xl p-5 animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-muted rounded-xl" />
                <div className="w-20 h-6 bg-muted rounded-full" />
              </div>
              <div className="w-32 h-5 bg-muted rounded" />
              <div className="w-full h-12 bg-muted rounded" />
              <div className="w-full h-8 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : filteredCrops.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl p-8">
          <AlertTriangle size={36} className="mx-auto text-amber-500 mb-2" />
          <h3 className="font-bold text-base text-foreground">No crops match current filter</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Try switching category filter to "All Crops" or adjusting your target season.
          </p>
          <button
            onClick={() => setCategoryFilter('all')}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
          >
            Show All Recommended Crops
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCrops.map((crop) => {
            const isTopMatch = crop.suitabilityScore >= 90;
            const scoreColor = isTopMatch
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
              : crop.suitabilityScore >= 80
              ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
              : 'bg-amber-500/10 text-amber-600 border-amber-500/30';

            return (
              <div
                key={crop.id}
                className="bg-card border border-border hover:border-emerald-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Glow border for 90%+ match */}
                {isTopMatch && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
                )}

                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                        {crop.icon || '🌱'}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-foreground group-hover:text-emerald-600 transition-colors">
                          {crop.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground font-medium">
                          {crop.hindiName} · {crop.marathiName}
                        </p>
                        <p className="text-[10px] text-muted-foreground/80 italic font-serif">
                          {crop.scientificName}
                        </p>
                      </div>
                    </div>

                    <div className={`px-2.5 py-1 rounded-full text-xs font-black border shrink-0 ${scoreColor}`}>
                      {crop.suitabilityScore}% Match
                    </div>
                  </div>

                  {/* Category & Season Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-foreground">
                      {crop.category}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      Season: {crop.seasons.join(' / ')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      💧 {crop.waterRequirement}
                    </span>
                  </div>

                  {/* Agronomic Justification: Why it fits this region */}
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs mb-3 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                      <Sparkles size={11} /> Regional Suitability
                    </span>
                    <p className="text-foreground text-[11px] leading-relaxed">
                      {crop.whySuitable}
                    </p>
                  </div>

                  {/* Agronomic Matrix Table */}
                  <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center justify-between py-1 border-b border-border/50">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar size={13} className="text-emerald-500" /> Sowing Window:
                      </span>
                      <span className="font-semibold text-foreground text-[11px]">
                        {crop.sowingWindow}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/50">
                      <span className="flex items-center gap-1 text-[11px]">
                        <TrendingUp size={13} className="text-emerald-500" /> Expected Yield:
                      </span>
                      <span className="font-semibold text-foreground text-[11px]">
                        {crop.expectedYield}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Award size={13} className="text-emerald-500" /> Market Outlook:
                      </span>
                      <span className="font-bold text-emerald-600 text-[11px]">
                        {crop.profitability} Profit
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-border flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCropDetail(crop)}
                    className="flex-1 py-2 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <BookOpen size={14} />
                    <span>View Guide</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate(`/farmer/yield-prediction?crop=${encodeURIComponent(crop.name)}&state=${encodeURIComponent(stateName)}`);
                    }}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                    title="Run AI Yield Predictor for this crop"
                  >
                    <span>Predict Yield</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Detailed Crop Agronomy & Pest Guide ── */}
      {selectedCropDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedCropDetail(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-3xl">
                {selectedCropDetail.icon || '🌱'}
              </div>
              <div>
                <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 mb-1">
                  {selectedCropDetail.suitabilityScore}% Suitability in {stateName}
                </div>
                <h3 className="text-xl font-extrabold text-foreground">{selectedCropDetail.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedCropDetail.hindiName} · {selectedCropDetail.marathiName} ({selectedCropDetail.scientificName})
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Recommended Varieties */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                <span className="font-bold text-foreground block mb-2 flex items-center gap-1.5">
                  <Award size={15} className="text-emerald-500" />
                  Recommended High-Yielding Varieties for this Region:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedCropDetail.recommendedVarieties?.map((v, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-card border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs shadow-xs"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sowing & Agronomy Tips */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                <span className="font-bold text-foreground block flex items-center gap-1.5">
                  <Sprout size={15} className="text-emerald-500" />
                  Sowing & Field Preparation Tips:
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedCropDetail.agronomyTips}
                </p>
              </div>

              {/* Pest & Disease Alerts */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1">
                <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-amber-500" />
                  Regional Risks & Pest Management:
                </span>
                <p className="text-amber-800 dark:text-amber-200 leading-relaxed text-[11px]">
                  {selectedCropDetail.risksAndPrecautions}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-muted/50 text-center">
                  <span className="text-[10px] text-muted-foreground block">Duration</span>
                  <span className="font-bold text-foreground text-xs">{selectedCropDetail.durationDays}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/50 text-center">
                  <span className="text-[10px] text-muted-foreground block">Optimum Temp</span>
                  <span className="font-bold text-foreground text-xs">{selectedCropDetail.tempRange?.optimal}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/50 text-center">
                  <span className="text-[10px] text-muted-foreground block">Water Need</span>
                  <span className="font-bold text-foreground text-xs">{selectedCropDetail.waterRequirement}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/50 text-center">
                  <span className="text-[10px] text-muted-foreground block">Expected Yield</span>
                  <span className="font-bold text-foreground text-xs">{selectedCropDetail.expectedYield}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setSelectedCropDetail(null)}
                className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const crop = selectedCropDetail;
                  setSelectedCropDetail(null);
                  navigate(`/farmer/yield-prediction?crop=${encodeURIComponent(crop.name)}&state=${encodeURIComponent(stateName)}`);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
              >
                <span>Run Yield Prediction</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
