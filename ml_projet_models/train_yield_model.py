"""
FarmGenie Crop Yield Prediction Model Training
Dataset: Agricultural-Crop-Yield-in-Indian-States-Dataset (Indian Ministry of Agriculture data)
Model: Random Forest Regressor with OneHotEncoder ColumnTransformer Pipeline
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODEL_DIR = os.path.join(BASE_DIR, 'pretrained_models', 'yield_model')
CSV_PATH = os.path.join(DATA_DIR, 'crop_yield.csv')

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

CROP_MAPPING = {
    'Rice': 'Rice',
    'Wheat': 'Wheat',
    'Maize': 'Maize',
    'Cotton': 'Cotton(lint)',
    'Cotton(lint)': 'Cotton(lint)',
    'Soybean': 'Soyabean',
    'Soyabean': 'Soyabean',
    'Sugarcane': 'Sugarcane',
    'Sorghum (Jowar)': 'Jowar',
    'Jowar': 'Jowar',
    'Pearl millet (Bajra)': 'Bajra',
    'Bajra': 'Bajra',
    'Chickpea (Chana)': 'Gram',
    'Gram': 'Gram',
    'Potato': 'Potato',
    'Onion': 'Onion',
    'Groundnut': 'Groundnut'
}

def train_and_save():
    print(f"[*] Loading dataset from {CSV_PATH}...")
    if not os.path.exists(CSV_PATH):
        import urllib.request
        url = 'https://raw.githubusercontent.com/Aswins10/Agricultural-Crop-Yield-in-Indian-States-Dataset/main/crop_yield.csv'
        print(f"[*] Downloading dataset from {url}...")
        urllib.request.urlretrieve(url, CSV_PATH)

    df = pd.read_csv(CSV_PATH)
    print(f"[+] Loaded raw dataset: {df.shape[0]} rows, {df.shape[1]} columns.")

    # Target crop selection
    target_crops = list(set(CROP_MAPPING.values()))
    df = df[df['Crop'].isin(target_crops)].copy()
    df['Season'] = df['Season'].str.strip()
    df['State'] = df['State'].str.strip()

    # Clean extreme outliers per crop (bottom 1% and top 1%)
    cleaned_dfs = []
    for crop_name, grp in df.groupby('Crop'):
        q_low = grp['Yield'].quantile(0.01)
        q_high = grp['Yield'].quantile(0.99)
        cleaned = grp[(grp['Yield'] >= q_low) & (grp['Yield'] <= q_high)]
        cleaned_dfs.append(cleaned)
    df = pd.concat(cleaned_dfs, ignore_index=True)
    print(f"[+] Cleaned dataset: {df.shape[0]} rows across {len(target_crops)} Indian crops.")

    # Feature engineering: per hectare inputs to prevent collinearity with farm area
    df['Fert_per_ha'] = (df['Fertilizer'] / df['Area']).clip(50, 300)
    df['Pest_per_ha'] = (df['Pesticide'] / df['Area']).clip(0.05, 1.5)

    features = ['Crop', 'Season', 'State', 'Area', 'Annual_Rainfall', 'Fert_per_ha', 'Pest_per_ha']
    X = df[features]
    y = df['Yield']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"[*] Train set: {len(X_train)} samples | Test set: {len(X_test)} samples")

    cat_features = ['Crop', 'Season', 'State']
    num_features = ['Area', 'Annual_Rainfall', 'Fert_per_ha', 'Pest_per_ha']

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_features),
            ('num', 'passthrough', num_features)
        ]
    )

    rf = RandomForestRegressor(
        n_estimators=120,
        max_depth=18,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )

    pipeline = Pipeline([
        ('prep', preprocessor),
        ('rf', rf)
    ])

    print("[*] Training Random Forest Regressor...")
    pipeline.fit(X_train, y_train)

    # Evaluation
    y_pred = pipeline.predict(X_test)
    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = float(r2_score(y_test, y_pred))

    print(f"[+] Overall Model Performance:")
    print(f"    R^2 Score : {r2:.4f}")
    print(f"    MAE       : {mae:.4f} tonnes/ha")
    print(f"    RMSE      : {rmse:.4f} tonnes/ha")

    # Per crop evaluation
    crop_eval = {}
    test_eval_df = X_test.copy()
    test_eval_df['Actual'] = y_test
    test_eval_df['Predicted'] = y_pred

    for c, grp in test_eval_df.groupby('Crop'):
        c_mae = float(mean_absolute_error(grp['Actual'], grp['Predicted']))
        c_r2 = float(r2_score(grp['Actual'], grp['Predicted'])) if len(grp) > 2 else 0.0
        c_mean = float(grp['Actual'].mean())
        crop_eval[c] = {
            'samples': len(grp),
            'actual_mean': round(c_mean, 2),
            'mae': round(c_mae, 2),
            'r2': round(c_r2, 2)
        }
        print(f"    - {c:15s}: Mean {c_mean:6.2f} t/ha | MAE {c_mae:5.2f} t/ha | R2 {c_r2:5.2f}")

    # Save model pipeline
    model_file = os.path.join(MODEL_DIR, 'crop_yield_model.joblib')
    joblib.dump(pipeline, model_file)
    print(f"[+] Saved model pipeline to {model_file}")

    # Save metadata
    meta = {
        'model_name': 'Random Forest Crop Yield Regressor',
        'target_variable': 'Yield (Tonnes per Hectare)',
        'metrics': {
            'r2': round(r2, 4),
            'mae': round(mae, 4),
            'rmse': round(rmse, 4),
            'train_samples': len(X_train),
            'test_samples': len(X_test)
        },
        'per_crop_metrics': crop_eval,
        'supported_crops': [
            {'displayName': 'Rice', 'datasetCrop': 'Rice', 'defaultSeason': 'Kharif', 'typicalYieldRange': '1.8 - 4.5 t/ha'},
            {'displayName': 'Wheat', 'datasetCrop': 'Wheat', 'defaultSeason': 'Rabi', 'typicalYieldRange': '1.5 - 4.2 t/ha'},
            {'displayName': 'Maize', 'datasetCrop': 'Maize', 'defaultSeason': 'Kharif', 'typicalYieldRange': '1.5 - 5.0 t/ha'},
            {'displayName': 'Cotton', 'datasetCrop': 'Cotton(lint)', 'defaultSeason': 'Kharif', 'typicalYieldRange': '1.0 - 2.8 t/ha'},
            {'displayName': 'Soybean', 'datasetCrop': 'Soyabean', 'defaultSeason': 'Kharif', 'typicalYieldRange': '0.9 - 2.2 t/ha'},
            {'displayName': 'Sugarcane', 'datasetCrop': 'Sugarcane', 'defaultSeason': 'Whole Year', 'typicalYieldRange': '45 - 85 t/ha'},
            {'displayName': 'Sorghum (Jowar)', 'datasetCrop': 'Jowar', 'defaultSeason': 'Kharif', 'typicalYieldRange': '0.8 - 2.0 t/ha'},
            {'displayName': 'Pearl millet (Bajra)', 'datasetCrop': 'Bajra', 'defaultSeason': 'Kharif', 'typicalYieldRange': '0.9 - 2.5 t/ha'},
            {'displayName': 'Chickpea (Chana)', 'datasetCrop': 'Gram', 'defaultSeason': 'Rabi', 'typicalYieldRange': '0.7 - 1.8 t/ha'},
            {'displayName': 'Potato', 'datasetCrop': 'Potato', 'defaultSeason': 'Rabi', 'typicalYieldRange': '10 - 25 t/ha'},
            {'displayName': 'Onion', 'datasetCrop': 'Onion', 'defaultSeason': 'Rabi', 'typicalYieldRange': '8 - 22 t/ha'},
            {'displayName': 'Groundnut', 'datasetCrop': 'Groundnut', 'defaultSeason': 'Kharif', 'typicalYieldRange': '1.0 - 2.5 t/ha'}
        ],
        'seasons': ['Kharif', 'Rabi', 'Summer', 'Whole Year'],
        'states': sorted(df['State'].unique().tolist()),
        'features': features
    }

    meta_file = os.path.join(MODEL_DIR, 'yield_model_meta.json')
    with open(meta_file, 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=2)
    print(f"[+] Saved model metadata to {meta_file}")
    return meta

if __name__ == '__main__':
    train_and_save()
