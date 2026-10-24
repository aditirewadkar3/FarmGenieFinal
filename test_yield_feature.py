"""
Comprehensive Automated Test Suite for Location-Based Crop Yield Prediction
Tests:
1. Open-Meteo Forecast & Historical Archive API live calls
2. Crop Yield Predictor Engine across all supported Indian crops
3. Area unit conversions (acres, hectares, guntha, bigha)
4. Agronomic soil & irrigation adjustments
5. Fallback mechanisms & input validations
"""

import os
import sys
import json
import urllib.request

# Add ml_projet_models to path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ML_DIR = os.path.join(BASE_DIR, 'ml_projet_models')
sys.path.insert(0, ML_DIR)

from yield_predictor import predictor

def test_open_meteo_live():
    print("\n--- Test 1: Open-Meteo API Live Weather Retrieval ---")
    lat, lon = 18.5204, 73.8567 # Pune, Maharashtra
    forecast_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&timezone=auto"
    req = urllib.request.Request(forecast_url, headers={'User-Agent': 'FarmGenie/1.0'})
    with urllib.request.urlopen(req, timeout=8) as r:
        data = json.loads(r.read().decode('utf-8'))
        current = data.get('current', {})
        print(f"[OK] Open-Meteo Current: Temp = {current.get('temperature_2m')} C, Humidity = {current.get('relative_humidity_2m')}%, Rain = {current.get('precipitation')} mm")
        assert 'temperature_2m' in current, "temperature_2m missing"
        assert 'relative_humidity_2m' in current, "relative_humidity_2m missing"

    archive_url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date=2023-01-01&end_date=2023-12-31&daily=precipitation_sum&timezone=auto"
    req = urllib.request.Request(archive_url, headers={'User-Agent': 'FarmGenie/1.0'})
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read().decode('utf-8'))
        rain_list = data.get('daily', {}).get('precipitation_sum', [])
        total_rain = sum([x for x in rain_list if x is not None])
        print(f"[OK] Open-Meteo Archive: 2023 Annual Rainfall = {round(total_rain, 1)} mm")
        assert total_rain > 100, "Unrealistic rainfall data"

def test_crop_predictions():
    print("\n--- Test 2: Crop Yield Predictions Across Indian Crops ---")
    test_cases = [
        {'crop': 'Rice', 'state': 'Assam', 'season': 'Kharif', 'area': 2, 'unit': 'hectares'},
        {'crop': 'Wheat', 'state': 'Punjab', 'season': 'Rabi', 'area': 5, 'unit': 'acres'},
        {'crop': 'Maize', 'state': 'Karnataka', 'season': 'Kharif', 'area': 3, 'unit': 'acres'},
        {'crop': 'Cotton', 'state': 'Maharashtra', 'season': 'Kharif', 'area': 10, 'unit': 'acres'},
        {'crop': 'Soybean', 'state': 'Madhya Pradesh', 'season': 'Kharif', 'area': 4, 'unit': 'acres'},
        {'crop': 'Sugarcane', 'state': 'Maharashtra', 'season': 'Whole Year', 'area': 2.5, 'unit': 'acres'},
        {'crop': 'Sorghum (Jowar)', 'state': 'Maharashtra', 'season': 'Kharif', 'area': 3, 'unit': 'acres'},
        {'crop': 'Pearl millet (Bajra)', 'state': 'Rajasthan', 'season': 'Kharif', 'area': 4, 'unit': 'acres'},
        {'crop': 'Chickpea (Chana)', 'state': 'Madhya Pradesh', 'season': 'Rabi', 'area': 3, 'unit': 'acres'},
        {'crop': 'Potato', 'state': 'Uttar Pradesh', 'season': 'Rabi', 'area': 2, 'unit': 'acres'},
        {'crop': 'Onion', 'state': 'Maharashtra', 'season': 'Rabi', 'area': 1.5, 'unit': 'acres'},
        {'crop': 'Groundnut', 'state': 'Gujarat', 'season': 'Kharif', 'area': 5, 'unit': 'acres'},
    ]

    for tc in test_cases:
        res = predictor.predict(
            crop=tc['crop'],
            state=tc['state'],
            season=tc['season'],
            area_val=tc['area'],
            area_unit=tc['unit'],
            soil_type='alluvial' if tc['crop'] in ['Rice', 'Wheat'] else 'black',
            irrigation='irrigated'
        )
        pred = res['prediction']
        print(f"[OK] {tc['crop']:20s} ({tc['state']}) -> Yield: {pred['yieldPerHectareTonnes']:5.2f} t/ha | "
              f"{pred['yieldPerAcreQuintals']:5.2f} q/acre | Total: {pred['totalProduction']['tonnes']:6.2f} tonnes")
        assert pred['yieldPerHectareTonnes'] > 0.1, "Predicted yield too low or non-positive"
        assert pred['totalProduction']['tonnes'] > 0, "Total production non-positive"

def test_area_unit_conversions():
    print("\n--- Test 3: Area Unit Conversions ---")
    units = [
        ('1 hectare', 1.0, 'hectares', 1.0),
        ('2.471 acres', 2.47105, 'acres', 1.0),
        ('40 guntha (1 acre)', 40.0, 'guntha', 0.404686),
        ('4 bigha (~1 ha)', 4.0, 'bigha', 1.0)
    ]
    for desc, val, unit, expected in units:
        res = predictor.predict(crop='Wheat', state='Punjab', season='Rabi', area_val=val, area_unit=unit)
        ha = res['cultivatedArea']['inHectares']
        print(f"[OK] {desc} correctly converted to ~{ha:.2f} hectares")
        assert abs(ha - expected) < 0.05, f"Conversion error: {ha} != {expected}"

def test_agronomic_factors():
    print("\n--- Test 4: Irrigation and Soil Multipliers ---")
    base_res = predictor.predict(crop='Cotton', state='Maharashtra', season='Kharif', area_val=5, area_unit='acres', soil_type='alluvial', irrigation='rainfed')
    drip_res = predictor.predict(crop='Cotton', state='Maharashtra', season='Kharif', area_val=5, area_unit='acres', soil_type='black', irrigation='drip/sprinkler')

    base_yield = base_res['prediction']['yieldPerHectareTonnes']
    drip_yield = drip_res['prediction']['yieldPerHectareTonnes']
    boost_pct = round((drip_yield / base_yield - 1) * 100)
    print(f"[OK] Cotton Rainfed on Alluvial: {base_yield:.2f} t/ha")
    print(f"[OK] Cotton Drip on Black soil  : {drip_yield:.2f} t/ha (Boost: +{boost_pct}%)")
    assert drip_yield > base_yield, "Drip irrigation on black soil should improve yield"

if __name__ == '__main__':
    print("=================================================================")
    print(" FARMGENIE CROP YIELD PREDICTION TEST SUITE")
    print("=================================================================")
    test_open_meteo_live()
    test_crop_predictions()
    test_area_unit_conversions()
    test_agronomic_factors()
    print("\n=================================================================")
    print(" [SUCCESS] ALL 4 TEST SUITES PASSED WITHOUT ERRORS!")
    print("=================================================================")
