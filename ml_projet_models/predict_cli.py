"""
CLI Runner for Crop Yield Prediction (used directly or as fallback by Node.js backend)
Usage: python predict_cli.py '{"crop": "Wheat", ...}'
"""

import sys
import json
import os

# Add directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from yield_predictor import predictor

def main():
    if len(sys.argv) > 1:
        raw_input = sys.argv[1]
    else:
        raw_input = sys.stdin.read()

    try:
        data = json.loads(raw_input)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Invalid JSON input: {e}"}))
        sys.exit(1)

    try:
        result = predictor.predict(
            crop=data.get('crop', 'Rice'),
            state=data.get('state', 'Maharashtra'),
            season=data.get('season', 'Kharif'),
            area_val=float(data.get('area', 1.0)),
            area_unit=data.get('areaUnit', 'acres'),
            annual_rainfall=data.get('annualRainfall'),
            soil_type=data.get('soilType', 'alluvial'),
            irrigation=data.get('irrigation', 'irrigated'),
            weather_context=data.get('weatherContext')
        )
        print(json.dumps({"success": True, "data": result}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
