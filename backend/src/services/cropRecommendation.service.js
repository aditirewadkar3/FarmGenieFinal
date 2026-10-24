import axios from 'axios';
import { fetchOpenMeteoWeather } from './cropYield.service.js';
import { callWithFallback, createClient, normalizeAndParseJSON } from './gemini.service.js';

// ── Master Agronomic Database for Indian Regions & Crops ─────────────────────

export const AGRO_CLIMATIC_ZONES = {
  'Western Himalayan': {
    states: ['Jammu and Kashmir', 'Himachal Pradesh', 'Uttarakhand'],
    typicalSoil: 'brown hill soil / laterite',
    elevation: 'High (Hilly/Mountainous)',
    climate: 'Cool temperate to sub-tropical',
  },
  'Eastern Himalayan': {
    states: ['Assam', 'Arunachal Pradesh', 'Meghalaya', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura', 'Sikkim'],
    typicalSoil: 'red loam / acidic alluvial',
    elevation: 'Hilly with high rainfall',
    climate: 'Humid sub-tropical',
  },
  'Lower Gangetic Plain': {
    states: ['West Bengal'],
    typicalSoil: 'alluvial',
    elevation: 'Lowland delta',
    climate: 'Moist sub-humid to humid',
  },
  'Middle Gangetic Plain': {
    states: ['Bihar', 'Uttar Pradesh'],
    typicalSoil: 'alluvial',
    elevation: 'Plains',
    climate: 'Sub-humid continental',
  },
  'Upper Gangetic Plain': {
    states: ['Uttar Pradesh', 'Uttarakhand'],
    typicalSoil: 'alluvial / sandy loam',
    elevation: 'Fertile northern plains',
    climate: 'Semi-arid to sub-humid',
  },
  'Trans-Gangetic Plain': {
    states: ['Punjab', 'Haryana', 'Delhi', 'Rajasthan'],
    typicalSoil: 'alluvial / sandy loam',
    elevation: 'Northern irrigated plains',
    climate: 'Semi-arid continental',
  },
  'Eastern Plateau and Hills': {
    states: ['Chhattisgarh', 'Jharkhand', 'Odisha'],
    typicalSoil: 'red and yellow / laterite',
    elevation: 'Plateau & undulating terrain',
    climate: 'Sub-humid tropical',
  },
  'Central Plateau and Hills': {
    states: ['Madhya Pradesh', 'Rajasthan', 'Uttar Pradesh'],
    typicalSoil: 'mixed red and black / black soil',
    elevation: 'Central plateau',
    climate: 'Semi-arid to sub-humid',
  },
  'Western Plateau and Hills': {
    states: ['Maharashtra', 'Madhya Pradesh', 'Rajasthan'],
    typicalSoil: 'black',
    elevation: 'Deccan plateau (volcanic trap)',
    climate: 'Semi-arid tropical',
  },
  'Southern Plateau and Hills': {
    states: ['Karnataka', 'Telangana', 'Andhra Pradesh', 'Tamil Nadu'],
    typicalSoil: 'red / black loam',
    elevation: 'Peninsular plateau',
    climate: 'Semi-arid tropical',
  },
  'East Coast Plains and Hills': {
    states: ['Tamil Nadu', 'Andhra Pradesh', 'Odisha'],
    typicalSoil: 'alluvial / coastal sand / red loam',
    elevation: 'Coastal plains',
    climate: 'Tropical wet and dry',
  },
  'West Coast Plains and Ghats': {
    states: ['Kerala', 'Goa', 'Karnataka', 'Maharashtra'],
    typicalSoil: 'laterite / coastal alluvial',
    elevation: 'Coastal & Western Ghats',
    climate: 'Humid tropical monsoon',
  },
  'Gujarat Plains and Hills': {
    states: ['Gujarat'],
    typicalSoil: 'black / alluvial / sandy loam',
    elevation: 'Western plains & peninsular',
    climate: 'Arid to semi-arid',
  },
  'Western Dry Region': {
    states: ['Rajasthan', 'Gujarat', 'Haryana'],
    typicalSoil: 'sandy loam / desert sand',
    elevation: 'Arid western plains',
    climate: 'Arid / desert hot',
  },
  'The Islands': {
    states: ['Andaman and Nicobar Islands', 'Lakshadweep'],
    typicalSoil: 'coastal alluvial / red loam',
    elevation: 'Insular / Coastal',
    climate: 'Equatorial humid',
  },
};

// State-to-AgroZone mapping
export const STATE_TO_ZONE = {
  'Maharashtra': 'Western Plateau and Hills',
  'Punjab': 'Trans-Gangetic Plain',
  'Haryana': 'Trans-Gangetic Plain',
  'Uttar Pradesh': 'Middle Gangetic Plain',
  'Madhya Pradesh': 'Central Plateau and Hills',
  'Karnataka': 'Southern Plateau and Hills',
  'Gujarat': 'Gujarat Plains and Hills',
  'Rajasthan': 'Western Dry Region',
  'Tamil Nadu': 'Southern Plateau and Hills',
  'Andhra Pradesh': 'Southern Plateau and Hills',
  'Telangana': 'Southern Plateau and Hills',
  'Bihar': 'Middle Gangetic Plain',
  'West Bengal': 'Lower Gangetic Plain',
  'Odisha': 'Eastern Plateau and Hills',
  'Chhattisgarh': 'Eastern Plateau and Hills',
  'Jharkhand': 'Eastern Plateau and Hills',
  'Kerala': 'West Coast Plains and Ghats',
  'Assam': 'Eastern Himalayan',
  'Himachal Pradesh': 'Western Himalayan',
  'Uttarakhand': 'Western Himalayan',
  'Jammu and Kashmir': 'Western Himalayan',
  'Goa': 'West Coast Plains and Ghats',
};

// Comprehensive Indian Crop Profiles Database
export const MASTER_CROPS = [
  {
    id: 'cotton',
    name: 'Cotton',
    hindiName: 'कपास (नरमा)',
    marathiName: 'कापूस',
    scientificName: 'Gossypium hirsutum',
    category: 'Cash Crop / Fiber',
    icon: '🌱',
    seasons: ['Kharif'],
    idealSoilTypes: ['black', 'alluvial', 'clayey'],
    tempRange: { min: 21, max: 35, optimal: '25°C – 32°C' },
    rainfallRange: { min: 500, max: 1000, description: '500 – 900 mm' },
    waterRequirement: 'Moderate',
    durationDays: '150 – 180 days',
    sowingWindow: 'May 15 – June 30',
    harvestWindow: 'November – January',
    expectedYield: '18 – 28 quintals/ha (7 – 11 q/acre)',
    profitability: 'Very High',
    primaryStates: ['Maharashtra', 'Gujarat', 'Telangana', 'Andhra Pradesh', 'Punjab', 'Haryana', 'Madhya Pradesh', 'Karnataka', 'Rajasthan'],
    recommendedVarieties: ['Bt Cotton (Bollgard II)', 'RCH-2', 'Ajeet-155', 'Bunny Bt', 'Ankur 651'],
    whySuitable: 'Thrives in warm sunny climates and deep black moisture-retentive soils (Regur). Long growing season aligns with post-monsoon dry ripening.',
    agronomyTips: 'Maintain 90x60 cm or 120x45 cm plant spacing. Monitor for pink bollworm during flowering. Avoid excessive nitrogen in early vegetative phase.',
    risksAndPrecautions: 'Susceptible to sucking pests (aphids, jassids, whitefly) in early 60 days. Waterlogging during early seedling stage causes root rot.',
  },
  {
    id: 'soybean',
    name: 'Soybean',
    hindiName: 'सोयाबीन',
    marathiName: 'सोयाबीन',
    scientificName: 'Glycine max',
    category: 'Oilseed / Pulse',
    icon: '🌿',
    seasons: ['Kharif'],
    idealSoilTypes: ['black', 'alluvial', 'red'],
    tempRange: { min: 20, max: 32, optimal: '24°C – 30°C' },
    rainfallRange: { min: 600, max: 950, description: '600 – 850 mm' },
    waterRequirement: 'Moderate',
    durationDays: '90 – 105 days',
    sowingWindow: 'June 20 – July 15 (after 75-100 mm rainfall)',
    harvestWindow: 'September 25 – October 25',
    expectedYield: '20 – 30 quintals/ha (8 – 12 q/acre)',
    profitability: 'High',
    primaryStates: ['Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Karnataka', 'Telangana', 'Chhattisgarh', 'Gujarat'],
    recommendedVarieties: ['JS 335', 'JS 9305', 'JS 9560', 'MACS 1407', 'NRC 37', 'Phule Sangam (KDS 726)'],
    whySuitable: 'Extremely well-adapted to rainfed black soils of Deccan and Malwa. Fixes atmospheric nitrogen, enriching soil for subsequent Rabi crops like Wheat or Chickpea.',
    agronomyTips: 'Seed treatment with Bradyrhizobium and PSB is essential. Sow at 45x5 cm spacing at a shallow depth of 3-4 cm for optimal emergence.',
    risksAndPrecautions: 'Sensitive to dry spells at pod-filling stage. Look out for yellow mosaic virus and girdle beetle during vegetative stage.',
  },
  {
    id: 'rice',
    name: 'Rice (Paddy)',
    hindiName: 'चावल (धान)',
    marathiName: 'भात / तांदूळ',
    scientificName: 'Oryza sativa',
    category: 'Cereal / Staple Food',
    icon: '🌾',
    seasons: ['Kharif', 'Summer', 'Whole Year'],
    idealSoilTypes: ['alluvial', 'clayey', 'red'],
    tempRange: { min: 22, max: 37, optimal: '25°C – 34°C' },
    rainfallRange: { min: 900, max: 2500, description: '1000 – 1800 mm' },
    waterRequirement: 'High',
    durationDays: '110 – 140 days',
    sowingWindow: 'June 1 – July 10 (Transplanting July)',
    harvestWindow: 'October – November',
    expectedYield: '35 – 55 quintals/ha (14 – 22 q/acre)',
    profitability: 'High',
    primaryStates: ['West Bengal', 'Uttar Pradesh', 'Punjab', 'Andhra Pradesh', 'Telangana', 'Bihar', 'Odisha', 'Chhattisgarh', 'Tamil Nadu', 'Haryana', 'Assam', 'Maharashtra', 'Kerala'],
    recommendedVarieties: ['Basmati 1121', 'Pusa Basmati 1509', 'IR 64', 'Swarna (MTU 7029)', 'Sambha Mahsuri (BPT 5204)', 'Karjat 3'],
    whySuitable: 'Ideal for river plains, deltaic deltas, and heavy clayey soils with high water retention and warm humid monsoon conditions.',
    agronomyTips: 'Puddle field properly before transplanting 20-25 day old seedlings. Adopt Alternate Wetting and Drying (AWD) to save 25% irrigation water.',
    risksAndPrecautions: 'Watch for blast, bacterial leaf blight (BLB), and stem borer. Ensure balanced potassium fertilization to prevent lodging.',
  },
  {
    id: 'wheat',
    name: 'Wheat',
    hindiName: 'गेहूं',
    marathiName: 'गहू',
    scientificName: 'Triticum aestivum',
    category: 'Cereal / Staple Food',
    icon: '🌾',
    seasons: ['Rabi'],
    idealSoilTypes: ['alluvial', 'black', 'clayey'],
    tempRange: { min: 10, max: 25, optimal: '15°C – 22°C' },
    rainfallRange: { min: 350, max: 650, description: '300 – 500 mm (Irrigated)' },
    waterRequirement: 'Moderate',
    durationDays: '115 – 135 days',
    sowingWindow: 'November 1 – November 25',
    harvestWindow: 'March 15 – April 20',
    expectedYield: '40 – 60 quintals/ha (16 – 25 q/acre)',
    profitability: 'High',
    primaryStates: ['Uttar Pradesh', 'Punjab', 'Madhya Pradesh', 'Haryana', 'Rajasthan', 'Bihar', 'Gujarat', 'Maharashtra', 'Uttarakhand'],
    recommendedVarieties: ['HD 2967', 'HD 3086', 'PBW 550', 'GW 322', 'Lok 1', 'DBW 187 (Karan Vandana)', 'Sharbati'],
    whySuitable: 'Thrives in cool winter temperatures with sunny days during grain filling. Highly responsive to fertile alluvial and black soils.',
    agronomyTips: 'Sow at 20-22 cm row spacing with seed drill. Critical irrigations: Crown Root Initiation (CRI at 21 days), Tillering, Booting, and Milking.',
    risksAndPrecautions: 'Terminal heat stress in late March/April reduces grain weight; strictly avoid delayed sowing past December 5.',
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane',
    hindiName: 'गन्ना',
    marathiName: 'ऊस',
    scientificName: 'Saccharum officinarum',
    category: 'Commercial / Cash Crop',
    icon: '🎋',
    seasons: ['Whole Year', 'Kharif', 'Rabi'],
    idealSoilTypes: ['black', 'alluvial', 'clayey'],
    tempRange: { min: 20, max: 38, optimal: '26°C – 35°C' },
    rainfallRange: { min: 1100, max: 2200, description: '1200 – 1800 mm' },
    waterRequirement: 'Very High',
    durationDays: '300 – 360 days (10–12 months)',
    sowingWindow: 'October–November (Pre-seasonal) or Jan–Feb (Suru)',
    harvestWindow: 'December – March (Next Year)',
    expectedYield: '80 – 140 tonnes/ha (35 – 55 tonnes/acre)',
    profitability: 'Very High',
    primaryStates: ['Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Andhra Pradesh', 'Bihar', 'Haryana', 'Punjab'],
    recommendedVarieties: ['Co 0238 (Karan 4)', 'Co 86032 (Nira)', 'CoM 0265 (Phule 265)', 'Co 0118', 'CoLk 94184'],
    whySuitable: 'Yields exceptional biomass and sugar recovery in frost-free tropical and sub-tropical regions with perennial irrigation access.',
    agronomyTips: 'Use healthy two-bud setts. Drip fertigation increases cane yield by 30% and cuts water use by 40%. Earthing-up at 90 days prevents lodging.',
    risksAndPrecautions: 'Top borer, early shoot borer, and red rot can cause heavy loss. Crop demands continuous irrigation and secure sugar mill agreement.',
  },
  {
    id: 'chickpea',
    name: 'Chickpea (Chana / Bengal Gram)',
    hindiName: 'चना (छोला)',
    marathiName: 'हरभरा / चणा',
    scientificName: 'Cicer arietinum',
    category: 'Pulse / Protein Crop',
    icon: '🌱',
    seasons: ['Rabi'],
    idealSoilTypes: ['black', 'alluvial', 'sandy loam'],
    tempRange: { min: 12, max: 28, optimal: '18°C – 24°C' },
    rainfallRange: { min: 300, max: 600, description: '300 – 500 mm' },
    waterRequirement: 'Low',
    durationDays: '95 – 115 days',
    sowingWindow: 'October 15 – November 15',
    harvestWindow: 'February – March',
    expectedYield: '18 – 26 quintals/ha (7 – 11 q/acre)',
    profitability: 'High',
    primaryStates: ['Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Karnataka', 'Uttar Pradesh', 'Andhra Pradesh', 'Gujarat'],
    recommendedVarieties: ['JG 11', 'JAKI 9218', 'Vijay (Phule G-81-1-1)', 'Digvijay', 'Pusa 362', 'Kabuli KAK 2'],
    whySuitable: 'Deep taproot system thrives on residual moisture in black and sandy loam soils. Drought hardy and requires only 1-2 protective irrigations.',
    agronomyTips: 'Do not irrigate at full bloom stage (leads to flower drop). Nipping (plucking terminal shoots at 30-35 days) triggers bushy branching and higher pods.',
    risksAndPrecautions: 'Fusarium wilt and pod borer (Helicoverpa armigera) are key threats. Use pheromone traps and neem spray early.',
  },
  {
    id: 'maize',
    name: 'Maize (Corn)',
    hindiName: 'मक्का',
    marathiName: 'मका',
    scientificName: 'Zea mays',
    category: 'Cereal / Fodder / Industrial',
    icon: '🌽',
    seasons: ['Kharif', 'Rabi', 'Summer'],
    idealSoilTypes: ['alluvial', 'red', 'sandy loam', 'black'],
    tempRange: { min: 18, max: 35, optimal: '22°C – 30°C' },
    rainfallRange: { min: 500, max: 900, description: '550 – 800 mm' },
    waterRequirement: 'Moderate',
    durationDays: '85 – 110 days',
    sowingWindow: 'June 15 – July 15 (Kharif) or Oct 15 – Nov 15 (Rabi)',
    harvestWindow: 'October (Kharif) / March (Rabi)',
    expectedYield: '45 – 70 quintals/ha (18 – 28 q/acre)',
    profitability: 'High',
    primaryStates: ['Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Bihar', 'Rajasthan', 'Telangana', 'Andhra Pradesh', 'Uttar Pradesh', 'Tamil Nadu'],
    recommendedVarieties: ['Pioneer 3396', 'NK 6240', 'DKC 9108', 'DHM 117', 'Ganga 11', 'HQPM 1 (Quality Protein)'],
    whySuitable: 'C4 plant with rapid photosynthetic biomass conversion. Versatile across soils, high livestock feed and starch factory demand.',
    agronomyTips: 'Sow at 60x20 cm. Apply nitrogen in 3 split doses: at sowing, knee-high stage (30 DAS), and tasseling (50 DAS).',
    risksAndPrecautions: 'Fall Armyworm (Spodoptera frugiperda) attacks whorls early; spray Emamectin benzoate or install pheromone traps.',
  },
  {
    id: 'groundnut',
    name: 'Groundnut (Peanut)',
    hindiName: 'मूंगफली',
    marathiName: 'भुईमूग',
    scientificName: 'Arachis hypogaea',
    category: 'Oilseed / Cash Crop',
    icon: '🥜',
    seasons: ['Kharif', 'Summer'],
    idealSoilTypes: ['sandy loam', 'red', 'alluvial'],
    tempRange: { min: 22, max: 33, optimal: '25°C – 30°C' },
    rainfallRange: { min: 450, max: 750, description: '500 – 700 mm' },
    waterRequirement: 'Low to Moderate',
    durationDays: '105 – 120 days',
    sowingWindow: 'June 15 – July 10 (Kharif) or Jan 15 – Feb 15 (Summer)',
    harvestWindow: 'October – November / May',
    expectedYield: '20 – 32 quintals/ha (8 – 13 q/acre)',
    profitability: 'High',
    primaryStates: ['Gujarat', 'Rajasthan', 'Tamil Nadu', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Madhya Pradesh'],
    recommendedVarieties: ['TG 37A', 'GG 20 (Gujarat Groundnut)', 'Kadiri 6', 'JL 24 (Phule Pragati)', 'TAG 24', 'Dharani'],
    whySuitable: 'Light friable sandy-loam soils allow effortless gynophore (peg) penetration and pod development without compacting.',
    agronomyTips: 'Apply Gypsum (400-500 kg/ha) at 35-40 days during flowering/pegging for robust calcium shell formation and bold kernels.',
    risksAndPrecautions: 'Tikka disease (leaf spot) and collar rot; treat seeds with Trichoderma viride or Carbendazim before sowing.',
  },
  {
    id: 'onion',
    name: 'Onion',
    hindiName: 'प्याज',
    marathiName: 'कांदा',
    scientificName: 'Allium cepa',
    category: 'Vegetable / High Value Cash Crop',
    icon: '🧅',
    seasons: ['Rabi', 'Kharif', 'Late Kharif'],
    idealSoilTypes: ['sandy loam', 'black', 'alluvial'],
    tempRange: { min: 13, max: 30, optimal: '16°C – 25°C' },
    rainfallRange: { min: 350, max: 650, description: '350 – 550 mm' },
    waterRequirement: 'Moderate',
    durationDays: '110 – 130 days (from transplanting)',
    sowingWindow: 'October – November (Nursery) → Dec Transplant (Rabi)',
    harvestWindow: 'April – May (Rabi crop has best shelf life)',
    expectedYield: '220 – 350 quintals/ha (90 – 140 q/acre)',
    profitability: 'Very High',
    primaryStates: ['Maharashtra', 'Madhya Pradesh', 'Karnataka', 'Gujarat', 'Rajasthan', 'Bihar', 'Andhra Pradesh', 'Haryana'],
    recommendedVarieties: ['Bhima Super', 'Bhima Shakti', 'Bhima Red', 'AgriFound Light Red', 'N-53 (Kharif)', 'Phule Samarth'],
    whySuitable: 'Maharashtra (Nashik/Pune/Ahmednagar) and Malwa plateau possess ideal day-length, mild winters, and well-draining soils for bulb curing.',
    agronomyTips: 'Raised bed transplanting with micro-sprinklers prevents bulb rot. Stop irrigation 10-14 days prior to harvest for firm scale curing.',
    risksAndPrecautions: 'Thrips and Purple blotch attack foliage in warm dry spells; spray Mancozeb + systemic insecticide.',
  },
  {
    id: 'potato',
    name: 'Potato',
    hindiName: 'आलू',
    marathiName: 'बटाटा',
    scientificName: 'Solanum tuberosum',
    category: 'Vegetable / Tuber Crop',
    icon: '🥔',
    seasons: ['Rabi'],
    idealSoilTypes: ['alluvial', 'sandy loam'],
    tempRange: { min: 12, max: 24, optimal: '15°C – 20°C (Night 14°C)' },
    rainfallRange: { min: 300, max: 550, description: '300 – 500 mm (Irrigated)' },
    waterRequirement: 'Moderate',
    durationDays: '80 – 105 days',
    sowingWindow: 'October 15 – November 10',
    harvestWindow: 'January 15 – February 25',
    expectedYield: '250 – 400 quintals/ha (100 – 160 q/acre)',
    profitability: 'High',
    primaryStates: ['Uttar Pradesh', 'West Bengal', 'Bihar', 'Gujarat', 'Madhya Pradesh', 'Punjab', 'Assam', 'Maharashtra'],
    recommendedVarieties: ['Kufri Jyoti', 'Kufri Pukhraj', 'Kufri Bahar', 'Kufri Chipsona (Processing)', 'Kufri Surya (Heat Tolerant)'],
    whySuitable: 'Cool night temperatures in Indo-Gangetic and Gujarat plains accelerate tuberization. Sandy-loam river soils allow easy tuber swelling.',
    agronomyTips: 'Use certified disease-free sprouted tubers (30-40g). Earthing up at 30 days protects developing tubers from sun greening.',
    risksAndPrecautions: 'Late Blight (Phytophthora infestans) can wipe out fields in cloudy humid cold spells; apply preventative Cymoxanil/Mancozeb.',
  },
  {
    id: 'mustard',
    name: 'Mustard (Sarson / Rai)',
    hindiName: 'सरसों / राई',
    marathiName: 'मोहरी',
    scientificName: 'Brassica juncea',
    category: 'Oilseed',
    icon: '🌼',
    seasons: ['Rabi'],
    idealSoilTypes: ['alluvial', 'sandy loam', 'clayey'],
    tempRange: { min: 10, max: 25, optimal: '15°C – 20°C' },
    rainfallRange: { min: 250, max: 450, description: '250 – 400 mm' },
    waterRequirement: 'Low',
    durationDays: '105 – 125 days',
    sowingWindow: 'October 1 – October 25',
    harvestWindow: 'February 15 – March 15',
    expectedYield: '18 – 26 quintals/ha (7 – 11 q/acre)',
    profitability: 'High',
    primaryStates: ['Rajasthan', 'Madhya Pradesh', 'Haryana', 'Uttar Pradesh', 'West Bengal', 'Gujarat', 'Punjab', 'Bihar'],
    recommendedVarieties: ['Pusa Bold', 'Giriraj (DRMRIJ 31)', 'RH 749', 'Kranti', 'Pusa Mustard 28', 'Varuna (T 59)'],
    whySuitable: 'Exceptionally drought-resilient Rabi oilseed. Performs splendidly on light sandy-loam and alluvial soils with modest irrigation.',
    agronomyTips: 'Thinning at 15-20 DAS to maintain 10-12 cm intra-row spacing is mandatory for full side-branching siliqua pod load.',
    risksAndPrecautions: 'Aphid infestation (Lipaphis erysimi) during cloudy humid weather in January; spray Dimethoate or Imidacloprid.',
  },
  {
    id: 'bajra',
    name: 'Pearl Millet (Bajra)',
    hindiName: 'बाजरा',
    marathiName: 'बाजरी',
    scientificName: 'Pennisetum glaucum',
    category: 'Nutri-Cereal / Millet',
    icon: '🌾',
    seasons: ['Kharif', 'Summer'],
    idealSoilTypes: ['sandy loam', 'red', 'black'],
    tempRange: { min: 24, max: 40, optimal: '28°C – 36°C' },
    rainfallRange: { min: 250, max: 600, description: '300 – 500 mm' },
    waterRequirement: 'Very Low (Drought Hardy)',
    durationDays: '75 – 90 days',
    sowingWindow: 'June 20 – July 20',
    harvestWindow: 'September 15 – October 15',
    expectedYield: '20 – 35 quintals/ha (8 – 14 q/acre)',
    profitability: 'Moderate to High',
    primaryStates: ['Rajasthan', 'Uttar Pradesh', 'Gujarat', 'Haryana', 'Maharashtra', 'Madhya Pradesh', 'Karnataka', 'Tamil Nadu'],
    recommendedVarieties: ['HHB 67 Improved (early 65d)', 'Pioneer 86M88', 'Proagro 9444', 'Shraddha', 'Saburi', 'GHB 558'],
    whySuitable: 'Super crop for arid and semi-arid zones. Survives blistering 40°C heat and intermittent drought spells where other crops wither.',
    agronomyTips: 'Requires minimal fertilizer. One light hoeing at 20-25 days keeps soil aerated and weed-free.',
    risksAndPrecautions: 'Downy mildew and ergot; always procure certified hybrid seed treated with Apron (metalaxyl).',
  },
  {
    id: 'turmeric',
    name: 'Turmeric (Haldi)',
    hindiName: 'हल्दी',
    marathiName: 'हळद',
    scientificName: 'Curcuma longa',
    category: 'Spice / Cash Crop',
    icon: '🫚',
    seasons: ['Whole Year', 'Kharif'],
    idealSoilTypes: ['red', 'sandy loam', 'black'],
    tempRange: { min: 20, max: 35, optimal: '25°C – 32°C' },
    rainfallRange: { min: 900, max: 1800, description: '1000 – 1500 mm' },
    waterRequirement: 'High',
    durationDays: '210 – 270 days (7 – 9 months)',
    sowingWindow: 'May 15 – June 25',
    harvestWindow: 'January – March',
    expectedYield: '220 – 300 quintals/ha fresh rhizome (25–35 q/ha cured)',
    profitability: 'Very High',
    primaryStates: ['Telangana', 'Maharashtra', 'Tamil Nadu', 'Andhra Pradesh', 'Karnataka', 'Odisha', 'Kerala'],
    recommendedVarieties: ['Salem', 'Prathibha', 'IISR Alleppey Supreme', 'Phule Swarna', 'Waigaon', 'Tekurpeta'],
    whySuitable: 'Thrives in warm humid tropical climate with well-drained friable loam. Maharashtra (Sangli/Hingoli) and Telangana are global hubs.',
    agronomyTips: 'Plant mother/finger rhizomes on raised beds (ridge and furrow) with organic mulch. Drip irrigation prevents rhizome rot.',
    risksAndPrecautions: 'Rhizome rot (Pythium) during waterlogged conditions; ensure perfect drainage and drench with Trichoderma or metalaxyl.',
  },
  {
    id: 'tomato',
    name: 'Tomato',
    hindiName: 'टमाटर',
    marathiName: 'टोमॅटो',
    scientificName: 'Solanum lycopersicum',
    category: 'Vegetable / Horticulture',
    icon: '🍅',
    seasons: ['Kharif', 'Rabi', 'Summer'],
    idealSoilTypes: ['red', 'alluvial', 'black', 'sandy loam'],
    tempRange: { min: 15, max: 32, optimal: '20°C – 28°C' },
    rainfallRange: { min: 400, max: 800, description: '450 – 650 mm' },
    waterRequirement: 'Moderate',
    durationDays: '110 – 140 days',
    sowingWindow: 'June–July (Kharif) / Oct–Nov (Rabi) / Jan–Feb (Summer)',
    harvestWindow: 'Continuous picking for 40–60 days',
    expectedYield: '350 – 550 quintals/ha (140 – 220 q/acre)',
    profitability: 'Very High',
    primaryStates: ['Andhra Pradesh', 'Madhya Pradesh', 'Karnataka', 'Gujarat', 'Odisha', 'West Bengal', 'Maharashtra', 'Bihar', 'Haryana'],
    recommendedVarieties: ['Abhinav (Syngenta)', 'Saaho (Syngenta)', 'Arka Rakshak (Triple disease resistant)', 'Arka Samrat', 'Pusa Ruby'],
    whySuitable: 'High-margin cash vegetable that produces abundant continuous flushes in sunny, moderate climates with staking and drip.',
    agronomyTips: 'Staking with bamboo poles/trellis increases yield by 40% and keeps fruit off wet soil, preventing rot.',
    risksAndPrecautions: 'Tomato Leaf Curl Virus (ToLCV) transmitted by whiteflies; Early/Late blight during humid rain periods.',
  },
  {
    id: 'banana',
    name: 'Banana',
    hindiName: 'केला',
    marathiName: 'केळी',
    scientificName: 'Musa acuminata',
    category: 'Fruit / Commercial Plantation',
    icon: '🍌',
    seasons: ['Whole Year'],
    idealSoilTypes: ['alluvial', 'black', 'clayey'],
    tempRange: { min: 20, max: 38, optimal: '25°C – 32°C' },
    rainfallRange: { min: 1200, max: 2200, description: '1200 – 1800 mm' },
    waterRequirement: 'High',
    durationDays: '330 – 365 days (11 – 12 months)',
    sowingWindow: 'June – July (Monsoon) or October – November',
    harvestWindow: '10–12 months after planting',
    expectedYield: '50 – 75 tonnes/ha (20 – 30 tonnes/acre)',
    profitability: 'Very High',
    primaryStates: ['Andhra Pradesh', 'Maharashtra', 'Gujarat', 'Tamil Nadu', 'Karnataka', 'Uttar Pradesh', 'Kerala', 'Bihar', 'Madhya Pradesh'],
    recommendedVarieties: ['Grand Naine (G9 Tissue Culture)', 'Robusta', 'Dwarf Cavendish', 'Nendran (Kerala)', 'Poovan'],
    whySuitable: 'Jalgaon (Maharashtra), Burhanpur (MP), and Andhra river belts are world renowned for G9 banana under drip irrigation and fertigation.',
    agronomyTips: 'Tissue culture plantlets with 1.8x1.8m spacing. Desuckering (removing side suckers) directs all energy to main bunch development.',
    risksAndPrecautions: 'Sigatoka leaf spot, Panama wilt, and strong windstorms causing lodging. Provide bamboo propping when bunch weights reach 25-35 kg.',
  },
];

// ── Region Evaluator & Recommendation Algorithm ───────────────────────────────

/**
 * Score and rank suitable crops for a given Indian region and conditions.
 */
export const calculateRegionalRecommendations = ({
  state = 'Maharashtra',
  district = '',
  soilType = 'black',
  season = 'All',
  weatherData = null,
  irrigation = 'irrigated',
}) => {
  const normState = state.trim();
  const zoneName = STATE_TO_ZONE[normState] || 'Western Plateau and Hills';
  const agroZone = AGRO_CLIMATIC_ZONES[zoneName] || AGRO_CLIMATIC_ZONES['Western Plateau and Hills'];

  // Current weather indicators
  const currentTemp = weatherData?.current?.temperature ?? 28;
  const currentHumidity = weatherData?.current?.humidity ?? 60;
  const annualRainfall = weatherData?.annualRainfallMm ?? 850;

  const scoredCrops = MASTER_CROPS.map((crop) => {
    let score = 50; // base score
    const matchReasons = [];
    const cautionNotes = [];

    // 1. State / Regional Primary Alignment (+25 points)
    const isStateMatch = crop.primaryStates.some(
      (s) => s.toLowerCase() === normState.toLowerCase()
    );
    if (isStateMatch) {
      score += 24;
      matchReasons.push(`Major commercial crop widely cultivated in ${normState}`);
    } else {
      score += 8;
    }

    // 2. Soil Suitability (+15 points)
    const normalizedSoil = (soilType || 'alluvial').toLowerCase();
    const isSoilMatch = crop.idealSoilTypes.some((s) => normalizedSoil.includes(s));
    if (isSoilMatch) {
      score += 15;
      matchReasons.push(`Perfect compatibility with ${soilType} soil for optimal root aeration`);
    } else {
      score += 4;
      cautionNotes.push(`Requires soil conditioning or organic manure for best results in ${soilType} soil`);
    }

    // 3. Season Match (+12 points)
    if (season === 'All' || crop.seasons.includes('Whole Year') || crop.seasons.includes(season)) {
      score += 12;
      matchReasons.push(`Naturally suited for ${season === 'All' ? crop.seasons.join('/') : season} cultivation cycle`);
    } else {
      score -= 10;
      cautionNotes.push(`Current primary window is ${crop.seasons.join('/')}; out-of-season planting requires controlled irrigation`);
    }

    // 4. Temperature Tolerance Match (+10 points)
    if (currentTemp >= crop.tempRange.min && currentTemp <= crop.tempRange.max) {
      score += 10;
      matchReasons.push(`Current temperature (${currentTemp}°C) is within ideal range (${crop.tempRange.optimal})`);
    } else {
      score += 2;
    }

    // 5. Rainfall & Irrigation Alignment (+10 points)
    if (irrigation === 'drip/sprinkler' || irrigation === 'irrigated') {
      score += 9;
      matchReasons.push(`Supported by reliable irrigation (${irrigation})`);
    } else if (irrigation === 'rainfed') {
      if (annualRainfall >= crop.rainfallRange.min && annualRainfall <= crop.rainfallRange.max * 1.5) {
        score += 8;
        matchReasons.push(`Rainfall estimate (${annualRainfall} mm) matches rainfed growth requirement`);
      } else if (crop.waterRequirement === 'Very Low (Drought Hardy)' || crop.waterRequirement === 'Low') {
        score += 10;
        matchReasons.push('Highly drought tolerant and excellent for dryland/rainfed farming');
      } else if (crop.waterRequirement === 'High' || crop.waterRequirement === 'Very High') {
        score -= 12;
        cautionNotes.push('High water requirement; rainfed cultivation risky without supplemental irrigation');
      }
    }

    // Normalize final score between 55% and 98%
    const finalScore = Math.min(98, Math.max(55, Math.round(score)));

    let suitabilityTier = 'Moderately Recommended';
    if (finalScore >= 88) suitabilityTier = 'Highly Recommended';
    else if (finalScore >= 75) suitabilityTier = 'Recommended';

    return {
      ...crop,
      suitabilityScore: finalScore,
      suitabilityTier,
      matchReasons,
      cautionNotes,
    };
  });

  // Sort descending by suitability score
  scoredCrops.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  return {
    regionInfo: {
      state: normState,
      district: district || 'Central District',
      agroClimaticZone: zoneName,
      typicalSoil: agroZone.typicalSoil,
      elevation: agroZone.elevation,
      climate: agroZone.climate,
      evaluatedConditions: {
        soilType,
        season,
        irrigation,
        currentTemperature: currentTemp,
        currentHumidity,
        annualRainfallMm: annualRainfall,
      },
    },
    recommendations: scoredCrops,
  };
};

// ── AI Powered Regional Agronomy Advisory (Groq / Gemini) ─────────────────────

export const getAIRegionalCropAdvisory = async ({
  latitude,
  longitude,
  state = 'Maharashtra',
  district = '',
  soilType = 'black',
  season = 'Kharif',
  irrigation = 'irrigated',
  weatherData = null,
  language = 'en',
  userApiKey = null,
}) => {
  const client = createClient(userApiKey);

  const langMap = {
    en: 'English',
    hi: 'Hindi (हिंदी)',
    mr: 'Marathi (मराठी)',
  };
  const langName = langMap[language] || 'English';

  const prompt = `You are a senior ICAR Agronomist and Regional Agricultural Scientist.
Provide expert crop and plant recommendations for this exact farm location in India:

Location Details:
- Coordinates: Latitude ${latitude}, Longitude ${longitude}
- State: ${state}
- District / Taluka: ${district || 'Regional farming belt'}
- Soil Type: ${soilType}
- Target Sowing Season: ${season}
- Irrigation Source: ${irrigation}
- Current Weather: Temp ${weatherData?.current?.temperature ?? 28}°C, Humidity ${weatherData?.current?.humidity ?? 60}%, Rain Estimate ${weatherData?.annualRainfallMm ?? 850} mm

Task:
Analyze this location's specific soil chemistry, agro-climatic zone, water table, and market proximity.
Recommend the top 5 most profitable and suitable crops/plants for a farmer to grow in this exact region.

Return ONLY a valid JSON object matching this structure:
{
  "regionalSummary": {
    "agroZone": "Name of Agro-Climatic Zone in ${langName}",
    "soilAnalysis": "Brief 1-2 sentence description of soil suitability in ${langName}",
    "climateVerdict": "Summary of regional weather suitability in ${langName}"
  },
  "topCrops": [
    {
      "name": "Crop Name (English and ${langName})",
      "suitabilityScore": 95,
      "category": "Cash Crop / Cereal / Pulse / Horticulture",
      "sowingWindow": "Best dates to sow in ${langName}",
      "harvestWindow": "Harvest timeframe in ${langName}",
      "expectedYield": "e.g. 25-30 quintals/ha in ${langName}",
      "profitability": "High / Very High",
      "recommendedVarieties": ["Variety 1", "Variety 2"],
      "whySuitable": "Detailed explanation of why this crop will thrive in this specific district and soil in ${langName}",
      "keyAgronomyTip": "Actionable seed treatment, spacing or fertilizer advice in ${langName}",
      "riskMitigation": "Key pest or climate risk and how to counter it in ${langName}"
    }
  ],
  "expertAdvisory": {
    "cropRotationTip": "Recommended subsequent crop for soil health in ${langName}",
    "waterManagement": "Irrigation optimization advice for this region in ${langName}",
    "marketAdvantage": "Nearby market or APMC mandi potential in ${langName}"
  }
}

Use realistic numbers. Keep language clear, practical, and in ${langName}.`;

  try {
    const response = await callWithFallback(client, {
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 2800,
    });

    const parsed = normalizeAndParseJSON(response.choices[0].message.content);
    return { success: true, data: parsed, isAI: true };
  } catch (err) {
    console.warn('[AI Crop Advisory] Falling back to Master Agronomic DB:', err.message);
    const fallback = calculateRegionalRecommendations({
      state,
      district,
      soilType,
      season,
      weatherData,
      irrigation,
    });
    return { success: true, data: fallback, isAI: false, error: err.message };
  }
};
