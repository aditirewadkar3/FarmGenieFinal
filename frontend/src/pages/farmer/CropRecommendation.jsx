import React from 'react';
import CropRecommendationMap from '../../components/CropRecommendationMap';
import { useLanguage } from '../../context/LanguageContext';

export default function CropRecommendation() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <CropRecommendationMap />
    </div>
  );
}
