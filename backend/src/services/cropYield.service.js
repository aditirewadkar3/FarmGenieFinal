import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:8000';
const ML_PROJECT_DIR = path.resolve(__dirname, '../../../ml_projet_models');
const PREDICT_CLI_SCRIPT = path.join(ML_PROJECT_DIR, 'predict_cli.py');
const META_JSON_PATH = path.join(ML_PROJECT_DIR, 'pretrained_models/yield_model/yield_model_meta.json');

/**
 * Fetch weather indicators from Open-Meteo API using coordinates
 * @param {number} latitude
 * @param {number} longitude
 */
export const fetchOpenMeteoWeather = async (latitude, longitude) => {
  if (!latitude || !longitude) return null;

  try {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    // 1. Current & 7-day forecast from Open-Meteo Forecast API
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    const forecastResp = await axios.get(forecastUrl, { timeout: 6000 });

    const current = forecastResp.data?.current || {};
    const daily = forecastResp.data?.daily || {};

    // 2. Estimate annual rainfall from Open-Meteo Historical Archive API
    let annualRainfall = null;
    try {
      const lastYear = new Date().getFullYear() - 1;
      const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${lastYear}-01-01&end_date=${lastYear}-12-31&daily=precipitation_sum&timezone=auto`;
      const archiveResp = await axios.get(archiveUrl, { timeout: 6000 });
      const precipArray = archiveResp.data?.daily?.precipitation_sum || [];
      const totalRain = precipArray.reduce((acc, val) => acc + (val || 0), 0);
      if (totalRain > 50) {
        annualRainfall = Math.round(totalRain * 10) / 10;
      }
    } catch (archiveErr) {
      console.warn('[Open-Meteo] Historical archive fetch fallback:', archiveErr.message);
    }

    return {
      source: 'Open-Meteo API',
      latitude: lat,
      longitude: lon,
      current: {
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        precipitation: current.precipitation,
        windSpeed: current.wind_speed_10m,
        weatherCode: current.weather_code,
        time: current.time,
      },
      forecast7Days: {
        maxTemp: daily.temperature_2m_max ? Math.max(...daily.temperature_2m_max) : null,
        minTemp: daily.temperature_2m_min ? Math.min(...daily.temperature_2m_min) : null,
        precipitationSum: daily.precipitation_sum ? Math.round(daily.precipitation_sum.reduce((a, b) => a + (b || 0), 0) * 10) / 10 : 0,
      },
      annualRainfallMm: annualRainfall,
    };
  } catch (err) {
    console.error('[Open-Meteo] Weather fetch failed:', err.message);
    return null;
  }
};

/**
 * Execute Python CLI script as fallback when FastAPI server is offline
 */
const runPythonCliPrediction = (inputPayload) => {
  return new Promise((resolve, reject) => {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const pyProcess = spawn(pythonCmd, [PREDICT_CLI_SCRIPT], {
      cwd: ML_PROJECT_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdoutData = '';
    let stderrData = '';

    pyProcess.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    pyProcess.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    pyProcess.on('close', (code) => {
      if (code !== 0 && !stdoutData.trim()) {
        return reject(new Error(`Python process exited with code ${code}: ${stderrData}`));
      }
      try {
        const parsed = JSON.parse(stdoutData.trim());
        if (parsed.success) {
          resolve(parsed.data);
        } else {
          reject(new Error(parsed.error || 'Prediction failed'));
        }
      } catch (err) {
        reject(new Error(`Failed to parse Python CLI output: ${stdoutData} (Error: ${err.message})`));
      }
    });

    pyProcess.on('error', (err) => {
      reject(err);
    });

    // Write input payload to stdin and end
    pyProcess.stdin.write(JSON.stringify(inputPayload));
    pyProcess.stdin.end();
  });
};

/**
 * Predict Crop Yield using local ML service with Open-Meteo integration
 */
export const predictYieldService = async (payload) => {
  let weatherData = null;

  // Auto-fetch Open-Meteo weather if coordinates are provided
  if (payload.latitude && payload.longitude) {
    weatherData = await fetchOpenMeteoWeather(payload.latitude, payload.longitude);
  }

  // Determine annual rainfall to pass
  let annualRainfall = payload.annualRainfall;
  if (!annualRainfall && weatherData?.annualRainfallMm) {
    annualRainfall = weatherData.annualRainfallMm;
  }

  const modelPayload = {
    crop: payload.crop,
    state: payload.state || 'Maharashtra',
    season: payload.season || 'Kharif',
    area: parseFloat(payload.area || 1),
    areaUnit: payload.areaUnit || 'acres',
    annualRainfall: annualRainfall ? parseFloat(annualRainfall) : null,
    soilType: payload.soilType || 'alluvial',
    irrigation: payload.irrigation || 'irrigated',
    latitude: payload.latitude,
    longitude: payload.longitude,
    weatherContext: weatherData?.current || payload.weatherContext || {},
  };

  let resultData = null;

  // 1. Try FastAPI ML Server
  try {
    const response = await axios.post(`${ML_SERVER_URL}/predict-yield`, modelPayload, { timeout: 8000 });
    if (response.data?.success) {
      resultData = response.data.data;
    }
  } catch (httpErr) {
    console.warn(`[CropYieldService] ML server HTTP unavailable (${httpErr.message}). Using local Python CLI fallback...`);
  }

  // 2. Fallback to direct Python CLI invocation
  if (!resultData) {
    resultData = await runPythonCliPrediction(modelPayload);
  }

  // Attach enriched weather details if available
  if (weatherData) {
    resultData.openMeteoWeather = weatherData;
  }

  return resultData;
};

/**
 * Get Yield Model Metadata
 */
export const getYieldMetadataService = async () => {
  try {
    const response = await axios.get(`${ML_SERVER_URL}/yield-metadata`, { timeout: 3000 });
    if (response.data?.success) {
      return response.data.metadata;
    }
  } catch {
    // Read directly from file
  }

  if (fs.existsSync(META_JSON_PATH)) {
    const raw = fs.readFileSync(META_JSON_PATH, 'utf-8');
    return JSON.parse(raw);
  }

  return {
    supported_crops: [
      { displayName: 'Rice', defaultSeason: 'Kharif' },
      { displayName: 'Wheat', defaultSeason: 'Rabi' },
      { displayName: 'Maize', defaultSeason: 'Kharif' },
      { displayName: 'Cotton', defaultSeason: 'Kharif' },
      { displayName: 'Soybean', defaultSeason: 'Kharif' },
      { displayName: 'Sugarcane', defaultSeason: 'Whole Year' },
      { displayName: 'Sorghum (Jowar)', defaultSeason: 'Kharif' },
      { displayName: 'Pearl millet (Bajra)', defaultSeason: 'Kharif' },
      { displayName: 'Chickpea (Chana)', defaultSeason: 'Rabi' },
      { displayName: 'Potato', defaultSeason: 'Rabi' },
      { displayName: 'Onion', defaultSeason: 'Rabi' },
      { displayName: 'Groundnut', defaultSeason: 'Kharif' },
    ],
  };
};
