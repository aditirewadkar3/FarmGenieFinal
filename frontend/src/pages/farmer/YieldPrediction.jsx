import React from 'react';
import CropYieldPredictor from '../../components/CropYieldPredictor';

export default function YieldPredictionPage() {
  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <CropYieldPredictor />
    </div>
  );
}
