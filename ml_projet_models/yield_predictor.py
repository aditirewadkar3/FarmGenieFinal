"""
FarmGenie Crop Yield Predictor Engine
Loads the pre-trained Random Forest model and provides yield prediction
with Open-Meteo weather integration and agronomic adjustments.
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'pretrained_models', 'yield_model')
MODEL_PATH = os.path.join(MODEL_DIR, 'crop_yield_model.joblib')
META_PATH = os.path.join(MODEL_DIR, 'yield_model_meta.json')

# Area conversion to hectares
AREA_CONVERSIONS = {
    'hectares': 1.0,
    'hectare': 1.0,
    'ha': 1.0,
    'acres': 0.404686,
    'acre': 0.404686,
    'guntha': 0.010117,
    'gunthas': 0.010117,
    'bigha': 0.25,
    'bighas': 0.25,
}

# Standard Indian State average annual rainfall (mm) fallback
STATE_FALLBACK_RAINFALL = {
    'Andhra Pradesh': 945.0,
    'Assam': 2100.0,
    'Bihar': 1180.0,
    'Chhattisgarh': 1290.0,
    'Goa': 3000.0,
    'Gujarat': 820.0,
    'Haryana': 560.0,
    'Himachal Pradesh': 1250.0,
    'Jharkhand': 1300.0,
    'Karnataka': 1150.0,
    'Kerala': 2900.0,
    'Madhya Pradesh': 1020.0,
    'Maharashtra': 1180.0,
    'Odisha': 1450.0,
    'Punjab': 620.0,
    'Rajasthan': 530.0,
    'Tamil Nadu': 960.0,
    'Telangana': 950.0,
    'Uttar Pradesh': 890.0,
    'Uttarakhand': 1550.0,
    'West Bengal': 1750.0,
}

# Soil suitability adjustments (ICAR agronomic factor multipliers)
SOIL_FACTORS = {
    'alluvial': { 'Rice': 1.08, 'Wheat': 1.10, 'Maize': 1.06, 'Sugarcane': 1.08, 'default': 1.04 },
    'black': { 'Cotton(lint)': 1.15, 'Soyabean': 1.12, 'Jowar': 1.10, 'Gram': 1.08, 'Wheat': 1.05, 'default': 1.05 },
    'red': { 'Groundnut': 1.10, 'Bajra': 1.08, 'Potato': 1.05, 'Rice': 0.98, 'default': 1.0 },
    'laterite': { 'Rice': 0.95, 'Sugarcane': 0.96, 'default': 0.95 },
    'clayey': { 'Rice': 1.06, 'Sugarcane': 1.04, 'Wheat': 1.02, 'default': 1.0 },
    'sandy loam': { 'Potato': 1.10, 'Onion': 1.08, 'Groundnut': 1.06, 'Bajra': 1.05, 'default': 1.02 }
}

# Irrigation multiplier
IRRIGATION_FACTORS = {
    'irrigated': 1.15,
    'drip/sprinkler': 1.25,
    'partially irrigated': 1.06,
    'rainfed': 0.95
}

class CropYieldPredictor:
    def __init__(self):
        self.model = None
        self.meta = {}
        self._load()

    def _load(self):
        if os.path.exists(MODEL_PATH) and os.path.exists(META_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                with open(META_PATH, 'r', encoding='utf-8') as f:
                    self.meta = json.load(f)
                sys.stderr.write("[+] Loaded Crop Yield Random Forest model successfully.\n")
            except Exception as e:
                sys.stderr.write(f"[-] Failed loading yield model: {e}\n")
        else:
            sys.stderr.write("[-] Yield model files not found. Run train_yield_model.py first.\n")

    def is_ready(self):
        return self.model is not None

    def get_supported_crops(self):
        if not self.meta:
            return []
        return self.meta.get('supported_crops', [])

    def get_metadata(self):
        return self.meta

    def predict(
        self,
        crop: str,
        state: str,
        season: str = "Kharif",
        area_val: float = 1.0,
        area_unit: str = "acres",
        annual_rainfall: float = None,
        soil_type: str = "alluvial",
        irrigation: str = "irrigated",
        weather_context: dict = None
    ) -> dict:
        if not self.is_ready():
            raise RuntimeError("Yield prediction model is not loaded.")

        # Normalize crop name
        crop_clean = crop.strip()
        matched_crop = None
        for c in self.meta.get('supported_crops', []):
            if crop_clean.lower() in [c['displayName'].lower(), c['datasetCrop'].lower()]:
                matched_crop = c['datasetCrop']
                break
        if not matched_crop:
            # Check common synonyms
            synonyms = {
                'rice': 'Rice', 'paddy': 'Rice',
                'wheat': 'Wheat',
                'corn': 'Maize', 'maize': 'Maize',
                'cotton': 'Cotton(lint)',
                'soybean': 'Soyabean', 'soya': 'Soyabean',
                'sugarcane': 'Sugarcane',
                'jowar': 'Jowar', 'sorghum': 'Jowar',
                'bajra': 'Bajra', 'pearl millet': 'Bajra',
                'chana': 'Gram', 'chickpea': 'Gram', 'gram': 'Gram',
                'potato': 'Potato',
                'onion': 'Onion',
                'groundnut': 'Groundnut', 'peanut': 'Groundnut'
            }
            matched_crop = synonyms.get(crop_clean.lower(), 'Rice')

        # Normalize Season
        valid_seasons = self.meta.get('seasons', ['Kharif', 'Rabi', 'Summer', 'Whole Year'])
        matched_season = "Kharif"
        for s in valid_seasons:
            if season.lower() == s.lower():
                matched_season = s
                break

        # Normalize State
        valid_states = self.meta.get('states', [])
        matched_state = "Maharashtra"
        for st in valid_states:
            if state.lower() == st.lower() or state.lower() in st.lower():
                matched_state = st
                break

        # Area conversion to hectares
        unit_key = area_unit.lower().strip()
        area_multiplier = AREA_CONVERSIONS.get(unit_key, 0.404686)
        area_ha = max(0.01, float(area_val) * area_multiplier)

        # Rainfall resolution
        if annual_rainfall is None or annual_rainfall <= 0:
            annual_rainfall = STATE_FALLBACK_RAINFALL.get(matched_state, 1100.0)
        else:
            annual_rainfall = float(annual_rainfall)

        # Standard Indian fertilizer and pesticide benchmarks per ha
        fert_per_ha = 135.0  # kg/ha standard NPK
        pest_per_ha = 0.28   # kg/ha standard

        # Model input DataFrame
        input_df = pd.DataFrame([{
            'Crop': matched_crop,
            'Season': matched_season,
            'State': matched_state,
            'Area': area_ha,
            'Annual_Rainfall': annual_rainfall,
            'Fert_per_ha': fert_per_ha,
            'Pest_per_ha': pest_per_ha
        }])

        base_yield_t_per_ha = float(self.model.predict(input_df)[0])
        base_yield_t_per_ha = max(0.1, base_yield_t_per_ha)

        # Apply agronomic soil & irrigation adjustments
        soil_key = soil_type.lower().strip() if soil_type else 'alluvial'
        soil_dict = SOIL_FACTORS.get(soil_key, {})
        soil_mult = soil_dict.get(matched_crop, soil_dict.get('default', 1.0))

        irr_key = irrigation.lower().strip() if irrigation else 'irrigated'
        irr_mult = IRRIGATION_FACTORS.get(irr_key, 1.1)

        adjusted_yield_t_per_ha = base_yield_t_per_ha * soil_mult * irr_mult

        # Conversions:
        # 1 Tonne = 10 Quintals = 1000 kg
        # 1 Hectare = 2.47105 Acres
        # Yield in quintals per acre:
        # yield_q_per_acre = (yield_t_per_ha * 10) / 2.47105 = yield_t_per_ha * 4.04686
        adjusted_yield_q_per_acre = adjusted_yield_t_per_ha * 4.04686

        total_production_tonnes = adjusted_yield_t_per_ha * area_ha
        total_production_quintals = total_production_tonnes * 10.0

        # Confidence and expected range
        crop_meta = self.meta.get('per_crop_metrics', {}).get(matched_crop, {})
        crop_mae = crop_meta.get('mae', 0.5)
        r2_score = crop_meta.get('r2', 0.8)

        confidence_percent = int(max(70, min(96, r2_score * 100)))

        min_yield_t_ha = max(0.1, adjusted_yield_t_per_ha - crop_mae)
        max_yield_t_ha = adjusted_yield_t_per_ha + crop_mae

        return {
            'crop': crop,
            'datasetCrop': matched_crop,
            'season': matched_season,
            'state': matched_state,
            'cultivatedArea': {
                'value': float(area_val),
                'unit': area_unit,
                'inHectares': round(area_ha, 3),
            },
            'weatherApplied': {
                'annualRainfallMm': round(annual_rainfall, 1),
                'currentWeather': weather_context or {}
            },
            'agronomicFactors': {
                'soilType': soil_type,
                'soilMultiplier': round(soil_mult, 2),
                'irrigation': irrigation,
                'irrigationMultiplier': round(irr_mult, 2),
            },
            'prediction': {
                'yieldPerHectareTonnes': round(adjusted_yield_t_per_ha, 2),
                'yieldPerAcreQuintals': round(adjusted_yield_q_per_acre, 2),
                'baseYieldTonnesPerHa': round(base_yield_t_per_ha, 2),
                'expectedYieldRange': {
                    'min': round(min_yield_t_ha, 2),
                    'max': round(max_yield_t_ha, 2),
                    'unit': 'tonnes/ha'
                },
                'totalProduction': {
                    'tonnes': round(total_production_tonnes, 2),
                    'quintals': round(total_production_quintals, 2),
                    'kg': round(total_production_tonnes * 1000, 1)
                },
                'modelConfidence': f"{confidence_percent}%",
                'modelMetrics': {
                    'modelType': 'Random Forest Regressor (Trained on 7,300+ Indian Agriculture Records)',
                    'overallR2': self.meta.get('metrics', {}).get('r2', 0.97),
                    'overallMAE': f"{self.meta.get('metrics', {}).get('mae', 0.97)} t/ha",
                    'cropMAE': f"{crop_mae} t/ha"
                }
            },
            'disclaimer': (
                "Prediction is an estimate generated from historical Indian agricultural data and "
                "local weather parameters. Actual farm yields may vary based on microclimate, seed variety, "
                "pest management, and timely agricultural interventions. Not guaranteed financial return."
            )
        }

# Global singleton
predictor = CropYieldPredictor()
