import { predictYieldService, fetchOpenMeteoWeather } from './cropYield.service.js';
import { STATE_TO_ZONE, AGRO_CLIMATIC_ZONES } from './cropRecommendation.service.js';

// ── Unit Conversions ──────────────────────────────────────────────────────────
export const normalizeToAcres = (value, unit = 'acres') => {
  const v = parseFloat(value) || 1;
  const u = (unit || 'acres').toLowerCase();
  switch (u) {
    case 'hectares':
    case 'hectare':
    case 'ha':
      return v * 2.47105;
    case 'guntha':
    case 'gunthas':
      return v * 0.025; // 40 guntha = 1 acre
    case 'bigha':
    case 'bighas':
      return v * 0.625; // standard average in North/Central India (~1.6 bigha/acre)
    case 'acres':
    case 'acre':
    default:
      return v;
  }
};

export const normalizeToHectares = (value, unit = 'acres') => {
  const acres = normalizeToAcres(value, unit);
  return acres * 0.404686;
};

// ── Master Agronomic Database for Indian Crops ───────────────────────────────
export const AGRONOMIC_CROPS_DB = {
  Rice: {
    id: 'Rice',
    displayName: 'Rice (Paddy / धान / भात)',
    scientificName: 'Oryza sativa',
    category: 'Cereal / Staple Food',
    localNames: { hindi: 'चावल (धान)', marathi: 'भात / तांदूळ' },
    seasons: ['Kharif', 'Summer', 'Whole Year'],
    durationDays: 125,
    durationRange: '110 – 140 days',
    waterRequirement: 'High (1000 – 1600 mm)',
    suitableSoils: ['alluvial', 'clayey', 'red'],
    optimalPh: '5.5 – 7.0',
    tempRange: { min: 20, max: 38, optimal: '24°C – 32°C' },
    primaryStates: ['West Bengal', 'Uttar Pradesh', 'Punjab', 'Andhra Pradesh', 'Telangana', 'Bihar', 'Odisha', 'Chhattisgarh', 'Tamil Nadu', 'Haryana', 'Maharashtra', 'Assam'],
    yieldPerAcre: { minQuintals: 16, maxQuintals: 26, meanQuintals: 21 },
    yieldPerHectare: { minTonnes: 4.0, maxTonnes: 6.5, meanTonnes: 5.2 },
    seedRatePerAcreKg: 15, // for transplanting (30-40 kg for direct seeding)
    spacing: '20 cm × 15 cm (hill spacing)',
    sowingDepth: '2 – 3 cm',
    recommendedVarieties: ['IR-64', 'Basmati 1121', 'Pusa Basmati 1509', 'MTU 7029 (Swarna)', 'BPT 5204 (Samba Mahsuri)', 'Karjat-3'],
    recommendedSowingWindow: 'Nursery: May 25 – June 20; Transplanting: June 25 – July 25',
    seedTreatment: [
      'Treat seeds with Carbendazim 50% WP @ 2g per kg seed in 1 liter water for 24 hours to prevent seed-borne blast and brown spot.',
      'Inoculate sprouted seeds with Azospirillum and Phosphobacteria (PSB) biofertilizer culture @ 600g per acre seed before nursery sowing.',
    ],
    landPrepSteps: [
      'Summer deep ploughing to expose weed rhizomes and insect pupae to sun heat.',
      'Wet puddling: 2-3 passes of rotavator or cultivator in standing water (5-7 cm) to create an impermeable soil pan and fine mud.',
      'Level the field evenly using a wooden plank or laser land leveler for uniform water stagnation.',
    ],
    // Recommended nutrients (kg/acre)
    nutrientRequirementPerAcre: { n: 48, p: 24, k: 20 },
    fertilizerSchedule: [
      { stage: 'Basal (At Final Puddling)', product: 'DAP (50 kg) + MOP (35 kg) + Zinc Sulphate (10 kg)', timing: 'Day 0', method: 'Broadcast and incorporate into mud before transplanting' },
      { stage: 'Early Tillering (21-25 DAT)', product: 'Urea (45 kg)', timing: 'Day 21 – 25', method: 'Top-dressing in 2-3 cm standing water' },
      { stage: 'Panicle Initiation (45-50 DAT)', product: 'Urea (40 kg)', timing: 'Day 45 – 50', method: 'Top-dressing after weeding; drain excess water before application' },
    ],
    organicManure: 'Apply 4 – 5 tonnes of well-rotted FYM or compost per acre during dry summer ploughing. Green manuring with Dhaincha (Sesbania) incorporated at 45 days adds 25 kg N/acre.',
    irrigationSchedule: [
      { stageName: 'Transplanting to Root Establishment', daysAfterSowing: 1, timingDescription: '0 – 7 days after transplanting', waterNeed: 'Shallow standing water (2 – 3 cm)', instructions: 'Maintain shallow water to establish root hold and avoid seedling submergence.' },
      { stageName: 'Tillering Phase', daysAfterSowing: 20, timingDescription: '20 – 40 DAT', waterNeed: 'Shallow submergence (3 – 5 cm)', instructions: 'Alternate Wetting and Drying (AWD) can be practiced to save 20-25% water.' },
      { stageName: 'Panicle Initiation to Flowering', daysAfterSowing: 50, timingDescription: '50 – 75 DAT', waterNeed: 'Critical stage: Continuous 5 cm water', instructions: 'Never allow water stress during boot-leaf to flowering stage; causes high spikelet sterility.' },
      { stageName: 'Grain Filling & Dough Stage', daysAfterSowing: 80, timingDescription: '80 – 100 DAT', waterNeed: 'Intermittent shallow watering', instructions: 'Drain water completely 10 – 12 days before anticipated harvest for uniform ripening.' },
    ],
    weedManagement: [
      'Apply Pre-emergence herbicide Pretilachlor 50% EC @ 600 ml/acre or Pyrazosulfuron-ethyl 10% WP @ 80 g/acre within 3-5 days after transplanting in shallow standing water.',
      'Perform one hand weeding or mechanical cono-weeder operation at 25-30 days to aerate root zone.',
    ],
    ipmPractices: [
      { pest: 'Yellow Stem Borer', symptoms: 'Dead hearts in vegetative stage; White heads (empty white panicles) at maturity.', organicRemedy: 'Install pheromone traps @ 5/acre; release Trichogramma japonicum egg parasitoids @ 40,000/acre.', chemicalRemedy: 'Cartap Hydrochloride 4G @ 7.5 kg/acre or Chlorantraniliprole 18.5% SC @ 60 ml in 200L water.' },
      { pest: 'Blast & Brown Spot Fungus', symptoms: 'Spindle-shaped lesions with grey center on leaves; neck rot at panicle base.', organicRemedy: 'Foliar spray of Pseudomonas fluorescens @ 1 kg/acre in 200L water.', chemicalRemedy: 'Tricyclazole 75% WP @ 120 g/acre or Azoxystrobin + Difenoconazole @ 200 ml/acre.' },
      { pest: 'Brown Planthopper (BPH)', symptoms: 'Hopper burn (circular patches of dried brown drying plants) in dense canopies.', organicRemedy: 'Alternate wetting and drying; avoid excessive urea; plant alleyways every 2 meters for aeration.', chemicalRemedy: 'Pymetrozine 50% WDG @ 120 g/acre or Dinotefuran 20% SG @ 80 g/acre directed at plant base.' },
    ],
    harvestingAndPostHarvest: {
      maturitySigns: ['85-90% of panicle grains turn golden yellow', 'Grain moisture drops to around 20-22%', 'Lower stems begin to dry out'],
      harvestMethods: ['Manual harvest using serrated sickles 5-10 cm above ground, or Combine Harvester.'],
      dryingAndStorage: ['Thresh within 2-3 days of harvest', 'Sun-dry grains on clean tarpaulin to 12-14% moisture content before bagging', 'Store in dry hermetic or polythene-lined jute bags away from ground on wooden pallets.'],
      marketPrepTips: ['Clean and winnow to remove chaff and unfilled grains', 'Segregate paddy by variety to fetch premium APMC mandi rate.'],
    },
    costEstimatesPerAcre: {
      seedsAndTreatment: 1400,
      landPrepAndPuddling: 3800,
      fertilizersAndManure: 3600,
      laborAndTransplanting: 6500,
      irrigationAndFuel: 2500,
      cropProtection: 1800,
      harvestAndThreshing: 4200,
      transportAndMarketing: 1200,
      totalCost: 25000,
    },
    assumedMarketPricePerQuintal: 2350, // MSP / Market average for common/grade A
    priceSource: 'Government of India MSP (2024-2025 Kharif season benchmark)',
    majorRisks: ['Terminal dry spells during grain filling', 'Pest outbreaks (BPH/Stem Borer)', 'Untimely rains during harvest drying'],
  },

  Wheat: {
    id: 'Wheat',
    displayName: 'Wheat (गेहूं / गहू)',
    scientificName: 'Triticum aestivum',
    category: 'Cereal / Staple Food',
    localNames: { hindi: 'गेहूं', marathi: 'गहू' },
    seasons: ['Rabi'],
    durationDays: 120,
    durationRange: '110 – 135 days',
    waterRequirement: 'Moderate (350 – 500 mm)',
    suitableSoils: ['alluvial', 'black', 'clayey'],
    optimalPh: '6.0 – 7.8',
    tempRange: { min: 10, max: 28, optimal: '15°C – 24°C' },
    primaryStates: ['Uttar Pradesh', 'Punjab', 'Madhya Pradesh', 'Haryana', 'Rajasthan', 'Bihar', 'Gujarat', 'Maharashtra', 'Uttarakhand'],
    yieldPerAcre: { minQuintals: 16, maxQuintals: 26, meanQuintals: 20 },
    yieldPerHectare: { minTonnes: 4.0, maxTonnes: 6.4, meanTonnes: 5.0 },
    seedRatePerAcreKg: 40,
    spacing: '20 cm – 22.5 cm row spacing (continuous in row)',
    sowingDepth: '4 – 5 cm (moist soil zone)',
    recommendedVarieties: ['HD 2967', 'HD 3086 (Pusa Gautami)', 'PBW 550', 'GW 322', 'DBW 187 (Karan Vandana)', 'Lok-1 (Central Zone)'],
    recommendedSowingWindow: 'November 1 – November 25 (Late sowing up to Dec 10 with HD 3059)',
    seedTreatment: [
      'Treat seed with Carboxin 37.5% + Thiram 37.5% DS @ 2.5 g/kg seed to control Loose Smut and Flag Smut.',
      'Seed inoculation with Azotobacter and PSB culture @ 10g each per kg seed to fix atmospheric N and solubilize soil phosphate.',
    ],
    landPrepSteps: [
      '1 deep disc ploughing followed by 2 cross-harrowing and rotavator passes to produce a firm, pulverised, weed-free seedbed.',
      'Planking is essential immediately after harrowing to conserve moisture and avoid hollow pockets.',
      'Zero-till seed drill can be adopted directly into rice stubble to save ₹2,500/acre in land prep.',
    ],
    nutrientRequirementPerAcre: { n: 50, p: 25, k: 18 },
    fertilizerSchedule: [
      { stage: 'Basal (At Sowing)', product: 'DAP (55 kg) + MOP (30 kg) + Urea (20 kg)', timing: 'Day 0', method: 'Drill 3-4 cm below seed using seed-cum-fertilizer drill' },
      { stage: '1st Top Dressing (At 1st Irrigation / CRI)', product: 'Urea (45 kg)', timing: 'Day 21 – 25', method: 'Broadcast before or after light CRI irrigation' },
      { stage: '2nd Top Dressing (At Jointing / Booting)', product: 'Urea (35 kg)', timing: 'Day 45 – 50', method: 'Broadcast in moist soil; avoid application on windy afternoons' },
    ],
    organicManure: 'Apply 3 – 4 tonnes of FYM per acre 3 weeks prior to sowing. Incorporating compost increases water holding capacity in alluvial soils.',
    irrigationSchedule: [
      { stageName: 'Crown Root Initiation (CRI) - MOST CRITICAL', daysAfterSowing: 21, timingDescription: '21 – 25 DAS', waterNeed: '5 – 6 cm light irrigation', instructions: 'Missing this irrigation reduces tillering by up to 30%. Must irrigate gently.' },
      { stageName: 'Tillering Stage', daysAfterSowing: 42, timingDescription: '40 – 45 DAS', waterNeed: 'Light irrigation', instructions: 'Promotes side tillers and vigorous vegetative canopy.' },
      { stageName: 'Late Jointing Stage', daysAfterSowing: 62, timingDescription: '60 – 65 DAS', waterNeed: 'Moderate irrigation', instructions: 'Supports rapid stem elongation and ear emergence.' },
      { stageName: 'Flowering Stage', daysAfterSowing: 82, timingDescription: '80 – 85 DAS', waterNeed: 'Moderate irrigation', instructions: 'Avoid heavy flood watering on windy days to prevent lodging.' },
      { stageName: 'Milking & Grain Filling', daysAfterSowing: 100, timingDescription: '95 – 102 DAS', waterNeed: 'Light irrigation', instructions: 'Crucial to prevent shriveled grain under March heat waves.' },
    ],
    weedManagement: [
      'Apply Clodinafop-propargyl 15% WP @ 160 g/acre + Metsulfuron-methyl 20% WP @ 8 g/acre at 30-35 DAS in 150L water for broadleaf and Phalaris minor (Gullidanda) control.',
      'Always spray when soil has adequate moisture; use flat-fan nozzle.',
    ],
    ipmPractices: [
      { pest: 'Yellow / Brown Rust (Puccinia)', symptoms: 'Yellow-orange pustules in linear rows on leaves; yellow powdery dust on fingers when touched.', organicRemedy: 'Grow resistant varieties like DBW 187 or HD 3086; foliar spray of Trichoderma @ 5g/L.', chemicalRemedy: 'Propiconazole 25% EC @ 200 ml/acre in 200L water as soon as initial pustules are spotted.' },
      { pest: 'Aphids (Mahun)', symptoms: 'Colonies sucking sap from tender earheads and flag leaf; honey-dew excretion leading to sooty mold.', organicRemedy: 'Neem oil 1500 ppm @ 1 liter/acre or spray water jet on sunny mornings.', chemicalRemedy: 'Thiamethoxam 25% WG @ 40 g/acre or Dimethoate 30% EC @ 300 ml/acre.' },
    ],
    harvestingAndPostHarvest: {
      maturitySigns: ['Spikes and grain turn golden brown and brittle', 'Grain cannot be easily dented with fingernail (moisture < 15%)', 'Straw turns dry and yellowish-white'],
      harvestMethods: ['Reaper-binder or Combine Harvester with straw management system.'],
      dryingAndStorage: ['Dry grain in sun to 10-12% moisture', 'Mix 10g celphos / aluminum phosphide tablets per quintal in airtight metal bins, or store with dried neem leaves.'],
      marketPrepTips: ['Remove broken grains and weed seeds to qualify for FAQ (Fair Average Quality) grade MSP procurement.'],
    },
    costEstimatesPerAcre: {
      seedsAndTreatment: 1600,
      landPrepAndPuddling: 3000,
      fertilizersAndManure: 3200,
      laborAndTransplanting: 2800,
      irrigationAndFuel: 2400,
      cropProtection: 1500,
      harvestAndThreshing: 3500,
      transportAndMarketing: 1000,
      totalCost: 19000,
    },
    assumedMarketPricePerQuintal: 2425, // Recent MSP
    priceSource: 'Government of India MSP for Wheat (Rabi 2024-25 season)',
    majorRisks: ['Terminal heat waves in March (>35°C during grain fill)', 'Sudden hailstorms/lodging', 'Phalaris minor weed resistance'],
  },

  Cotton: {
    id: 'Cotton',
    displayName: 'Cotton (कपास / कापूस)',
    scientificName: 'Gossypium hirsutum',
    category: 'Commercial / Cash Crop',
    localNames: { hindi: 'कपास (नरमा)', marathi: 'कापूस' },
    seasons: ['Kharif'],
    durationDays: 165,
    durationRange: '150 – 180 days',
    waterRequirement: 'Moderate (600 – 900 mm)',
    suitableSoils: ['black', 'alluvial', 'clayey'],
    optimalPh: '6.5 – 8.0',
    tempRange: { min: 21, max: 37, optimal: '25°C – 34°C' },
    primaryStates: ['Maharashtra', 'Gujarat', 'Telangana', 'Andhra Pradesh', 'Punjab', 'Haryana', 'Madhya Pradesh', 'Karnataka', 'Rajasthan'],
    yieldPerAcre: { minQuintals: 7, maxQuintals: 13, meanQuintals: 10 },
    yieldPerHectare: { minTonnes: 1.7, maxTonnes: 3.2, meanTonnes: 2.4 },
    seedRatePerAcreKg: 1.8, // Hybrid / Bt packets (typically 2 packets @ 450g each + non-Bt refuge)
    spacing: '90 cm – 120 cm row-to-row × 45 cm – 60 cm plant-to-plant',
    sowingDepth: '4 – 5 cm',
    recommendedVarieties: ['Bt Cotton BG-II (Bollgard II)', 'RCH-2', 'Ajeet 155', 'Bunny Bt', 'Ankur 651', 'Bhakti'],
    recommendedSowingWindow: 'May 15 – June 10 (Irrigated); June 15 – July 5 (Rainfed with 75-100mm monsoon arrival)',
    seedTreatment: [
      'Commercial Bt packets are pre-treated with Imidacloprid/Thiram. If untreated, treat seeds with Imidacloprid 70% WS @ 5g/kg seed for 40-day sucking pest protection.',
    ],
    landPrepSteps: [
      'Deep summer ploughing (25-30 cm) followed by 2 harrowing passes to eradicate deep perennial weeds.',
      'Formation of ridges and furrows (90 or 120 cm) or broad bed furrows (BBF) to prevent waterlogging during monsoon downpours.',
    ],
    nutrientRequirementPerAcre: { n: 45, p: 22, k: 22 },
    fertilizerSchedule: [
      { stage: 'Basal (At Sowing)', product: 'DAP (48 kg) + MOP (35 kg) + Urea (15 kg)', timing: 'Day 0', method: 'Band placement 5 cm to side and below seed' },
      { stage: 'Square Formation (40-45 DAS)', product: 'Urea (35 kg) + Micronutrient spray (19:19:19 @ 1 kg)', timing: 'Day 40 – 45', method: 'Ring placement around plants followed by light earthing-up' },
      { stage: 'Peak Flowering to Boll Dev (70-75 DAS)', product: 'Urea (30 kg) + 00:52:34 foliar spray @ 1 kg/acre', timing: 'Day 70 – 75', method: 'Band placement in moist soil; foliar spray prevents square drop' },
    ],
    organicManure: 'Apply 5 tonnes FYM or 1.5 tonnes vermicompost per acre. Enhances water conservation in rainfed black soils.',
    irrigationSchedule: [
      { stageName: 'Early Vegetative', daysAfterSowing: 25, timingDescription: '20 – 30 DAS', waterNeed: 'Light irrigation (if rain fails)', instructions: 'Encourages deep taproot penetration; avoid overwatering.' },
      { stageName: 'Square Formation', daysAfterSowing: 50, timingDescription: '45 – 55 DAS', waterNeed: 'Moderate moisture', instructions: 'Critical: moisture stress causes flower bud (square) drop.' },
      { stageName: 'Peak Flowering & Boll Development', daysAfterSowing: 80, timingDescription: '75 – 95 DAS', waterNeed: 'Crucial irrigation stage', instructions: 'Maintain adequate moisture; water stress reduces boll size and lint quality.' },
      { stageName: 'Boll Bursting & Maturation', daysAfterSowing: 125, timingDescription: '120 – 140 DAS', waterNeed: 'Dry conditions preferred', instructions: 'Cease irrigation when 20-30% bolls open to facilitate dry, clean picking.' },
    ],
    weedManagement: [
      'Pre-emergence herbicide Pendimethalin 38.7% CS @ 700 ml/acre within 48 hours of sowing on moist soil.',
      'Interculture with bullock/tractor drawn hoe at 30, 45, and 60 DAS followed by hand weeding along plant rows.',
    ],
    ipmPractices: [
      { pest: 'Pink Bollworm (Pectinophora gossypiella)', symptoms: 'Rosetted flowers; bore holes in developing bolls plugged with excreta; stained lint.', organicRemedy: 'Install yellow funnel pheromone traps @ 8/acre; release Trichogrammatoidea bactrae @ 60,000/acre at weekly intervals.', chemicalRemedy: 'Profenofos 50% EC @ 400 ml/acre or Emamectin Benzoate 5% SG @ 90 g/acre during peak moth flights.' },
      { pest: 'Sucking Pests (Jassids, Aphids, Whitefly)', symptoms: 'Leaf curling, yellowing of margins, hopper burn, sticky honeydew attracting sooty mold.', organicRemedy: 'Install yellow sticky traps @ 10/acre; spray 5% Neem Seed Kernel Extract (NSKE).', chemicalRemedy: 'Flonicamid 50% WG @ 80 g/acre or Diafenthiuron 50% WP @ 240 g/acre in 200L water.' },
    ],
    harvestingAndPostHarvest: {
      maturitySigns: ['Bolls burst open fully exposing clean, fluffy white seed cotton (Kapas)'],
      harvestMethods: ['Pick seed cotton manually in 3-4 pickings during dry morning hours after dew has dried.'],
      dryingAndStorage: ['Dry picked cotton on clean cement floor or tarpaulin (never directly on soil)', 'Ensure moisture is below 8% to prevent yellowing or heat buildup in storage.'],
      marketPrepTips: ['Keep trash, leaf bracts, and stained bolls separate for Grade-1 market rate.'],
    },
    costEstimatesPerAcre: {
      seedsAndTreatment: 1900,
      landPrepAndPuddling: 3500,
      fertilizersAndManure: 3800,
      laborAndTransplanting: 7500, // picking is labor intensive
      irrigationAndFuel: 2000,
      cropProtection: 3800,
      harvestAndThreshing: 3500,
      transportAndMarketing: 1200,
      totalCost: 27200,
    },
    assumedMarketPricePerQuintal: 7200, // Typical market/MSP for medium/long staple
    priceSource: 'Government of India MSP for Cotton (Kharif 2024-25 season)',
    majorRisks: ['Pink bollworm infestation in late stage', 'Excessive rainfall causing boll rot', 'High labor shortage during picking season'],
  },

  Soybean: {
    id: 'Soybean',
    displayName: 'Soybean (सोयाबीन)',
    scientificName: 'Glycine max',
    category: 'Oilseed / Legume',
    localNames: { hindi: 'सोयाबीन', marathi: 'सोयाबीन' },
    seasons: ['Kharif'],
    durationDays: 100,
    durationRange: '90 – 110 days',
    waterRequirement: 'Moderate (550 – 750 mm)',
    suitableSoils: ['black', 'alluvial', 'red'],
    optimalPh: '6.0 – 7.5',
    tempRange: { min: 20, max: 34, optimal: '24°C – 30°C' },
    primaryStates: ['Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Karnataka', 'Telangana', 'Chhattisgarh', 'Gujarat'],
    yieldPerAcre: { minQuintals: 7, maxQuintals: 13, meanQuintals: 10 },
    yieldPerHectare: { minTonnes: 1.8, maxTonnes: 3.2, meanTonnes: 2.5 },
    seedRatePerAcreKg: 30,
    spacing: '45 cm row spacing × 5 cm plant-to-plant',
    sowingDepth: '3 – 4 cm (never deeper than 4 cm; causes germination failure)',
    recommendedVarieties: ['JS 335', 'JS 9305', 'JS 9560', 'MACS 1407', 'NRC 37', 'Phule Sangam (KDS 726)'],
    recommendedSowingWindow: 'June 20 – July 15 (after receipt of 75-100 mm monsoon rain)',
    seedTreatment: [
      'Fungicide: Carboxin + Thiram @ 2g/kg or Trichoderma viride @ 5g/kg seed.',
      'Biofertilizer: Inoculate with Bradyrhizobium japonicum culture @ 500g and PSB @ 500g per 30 kg seed. Enhances atmospheric N fixation.',
    ],
    landPrepSteps: [
      '1 deep ploughing followed by 2 harrowing passes to make soil loose and crumbly.',
      'Adopt Broad Bed Furrow (BBF) or Ridge and Furrow system for drain-cum-moisture conservation in black soils.',
    ],
    nutrientRequirementPerAcre: { n: 12, p: 24, k: 16 }, // Low N needed as it fixes own nitrogen
    fertilizerSchedule: [
      { stage: 'Basal (At Sowing)', product: 'DAP (50 kg) + MOP (25 kg) + Sulphur Bentonite (10 kg)', timing: 'Day 0', method: 'Drill along row at sowing; avoid direct contact with inoculated seed' },
      { stage: 'Flowering Stage (35-40 DAS)', product: 'Foliar spray of 19:19:19 @ 1 kg/acre in 150L water', timing: 'Day 35 – 40', method: 'Foliar spray during early morning or evening' },
    ],
    organicManure: 'Apply 3 tonnes well-rotted FYM/acre during field preparation.',
    irrigationSchedule: [
      { stageName: 'Germination to Vegetative', daysAfterSowing: 0, timingDescription: '0 – 30 DAS', waterNeed: 'Rainfed (Normal monsoon sufficient)', instructions: 'Ensure good surface drainage; waterlogging for >48h damages root nodules.' },
      { stageName: 'Flowering Stage (CRITICAL)', daysAfterSowing: 40, timingDescription: '35 – 45 DAS', waterNeed: 'Protective irrigation if rain dry spell', instructions: 'Moisture stress at flowering drops flowers and cuts yield by 40%.' },
      { stageName: 'Pod Filling Stage (CRITICAL)', daysAfterSowing: 65, timingDescription: '60 – 75 DAS', waterNeed: 'Protective irrigation if rain ceases', instructions: 'Essential for bold grain weight; irrigate if soil shows cracks.' },
    ],
    weedManagement: [
      'Pre-emergence: Diclosulam 84% WDG @ 12.4 g/acre within 48h of sowing; OR',
      'Early Post-emergence: Imazethapyr 10% SL @ 400 ml/acre at 15-20 DAS when weeds are 2-4 leaf stage.',
    ],
    ipmPractices: [
      { pest: 'Girdle Beetle (Oberia brevis)', symptoms: 'Girdling rings on stem or petiole causing terminal shoot drying and withering.', organicRemedy: 'Pluck and destroy dried girdled shoots; install light traps.', chemicalRemedy: 'Thiamethoxam 12.6% + Lambda-cyhalothrin 9.5% ZC @ 60 ml/acre in 150L water.' },
      { pest: 'Spodoptera Litura (Tobacco Caterpillar) & Semilooper', symptoms: 'Skeletonized leaves, larvae defoliating tender leaves and bore into young pods.', organicRemedy: 'Pheromone traps @ 4/acre; spray Bacillus thuringiensis (Bt) @ 400g/acre.', chemicalRemedy: 'Emamectin Benzoate 5% SG @ 80 g/acre or Chlorantraniliprole 18.5% SC @ 50 ml/acre.' },
    ],
    harvestingAndPostHarvest: {
      maturitySigns: ['Leaves turn yellow, drop down naturally', 'Pods turn brown and rattle when shaken (moisture ~14%)'],
      harvestMethods: ['Harvest promptly with sickle at ground level, or grain combine harvester.'],
      dryingAndStorage: ['Do not thresh with excessively high cylinder speed (>400 rpm) to prevent seed coat splitting', 'Sun dry to 9-10% moisture before bagging.'],
      marketPrepTips: ['Clean and grade seed; split seeds significantly discount APMC rate.'],
    },
    costEstimatesPerAcre: {
      seedsAndTreatment: 2400,
      landPrepAndPuddling: 2600,
      fertilizersAndManure: 2500,
      laborAndTransplanting: 3200,
      irrigationAndFuel: 1200,
      cropProtection: 1800,
      harvestAndThreshing: 3200,
      transportAndMarketing: 900,
      totalCost: 17800,
    },
    assumedMarketPricePerQuintal: 4892, // MSP benchmark
    priceSource: 'Government of India MSP for Soybean (Kharif 2024-25 season)',
    majorRisks: ['Excessive rainfall during harvesting (causes grain discolouration/sprouting)', 'Dry spell during pod development', 'Girdle beetle and yellow mosaic virus'],
  },

  Maize: {
    id: 'Maize',
    displayName: 'Maize (Corn / मक्का / मका)',
    scientificName: 'Zea mays',
    category: 'Cereal / Feed & Food',
    localNames: { hindi: 'मक्का', marathi: 'मका' },
    seasons: ['Kharif', 'Rabi', 'Summer'],
    durationDays: 105,
    durationRange: '95 – 115 days',
    waterRequirement: 'Moderate (500 – 750 mm)',
    suitableSoils: ['alluvial', 'red', 'sandy loam', 'black'],
    optimalPh: '6.0 – 7.5',
    tempRange: { min: 18, max: 36, optimal: '22°C – 32°C' },
    primaryStates: ['Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Bihar', 'Rajasthan', 'Telangana', 'Andhra Pradesh', 'Uttar Pradesh'],
    yieldPerAcre: { minQuintals: 20, maxQuintals: 32, meanQuintals: 26 },
    yieldPerHectare: { minTonnes: 5.0, maxTonnes: 8.0, meanTonnes: 6.5 },
    seedRatePerAcreKg: 8,
    spacing: '60 cm row-to-row × 20 cm plant-to-plant',
    sowingDepth: '3 – 5 cm',
    recommendedVarieties: ['Pioneer 3396', 'NK 6240', 'DKC 9108', 'DHM 117', 'HQPM 1 (Protein rich)', 'Ganga 11'],
    recommendedSowingWindow: 'Kharif: June 15 – July 15; Rabi: October 15 – November 15',
    seedTreatment: [
      'Treat seed with Thiamethoxam 30% FS @ 4 ml/kg seed for Fall Armyworm protection in early 20 days.',
      'Treat with Carbendazim + Mancozeb @ 2.5g/kg seed to prevent seed rot and seedling blight.',
    ],
    landPrepSteps: [
      'Deep ploughing followed by 2 harrowing passes to create a deep, pulverized seedbed free of clods.',
      'Make ridges and furrows at 60 cm for sowing on ridges to avoid water stagnation at seedling stage.',
    ],
    nutrientRequirementPerAcre: { n: 48, p: 24, k: 20 },
    fertilizerSchedule: [
      { stage: 'Basal (At Sowing)', product: 'DAP (52 kg) + MOP (33 kg) + Zinc Sulphate (10 kg)', timing: 'Day 0', method: 'Placement 5 cm away from seed row' },
      { stage: 'Knee-High Stage (30-35 DAS)', product: 'Urea (40 kg)', timing: 'Day 30 – 35', method: 'Side-dressing followed by earthing up' },
      { stage: 'Tasseling & Silking Stage (50-55 DAS)', product: 'Urea (35 kg)', timing: 'Day 50 – 55', method: 'Broadcast in moist soil during afternoon' },
    ],
    organicManure: 'Apply 4 tonnes of FYM per acre before last harrowing.',
    irrigationSchedule: [
      { stageName: 'Early Vegetative', daysAfterSowing: 20, timingDescription: '15 – 25 DAS', waterNeed: 'Light irrigation', instructions: 'Drain any accumulated water; young maize is very sensitive to waterlogging.' },
      { stageName: 'Tasseling & Silking (CRITICAL)', daysAfterSowing: 50, timingDescription: '45 – 55 DAS', waterNeed: 'High moisture needed', instructions: 'Moisture stress during pollen shed causes poor cob seed set.' },
      { stageName: 'Grain Filling (Dough Stage)', daysAfterSowing: 75, timingDescription: '70 – 80 DAS', waterNeed: 'Moderate irrigation', instructions: 'Essential for complete kernel filling up to cob tip.' },
    ],
    weedManagement: [
      'Pre-emergence herbicide Atrazine 50% WP @ 600 g/acre in 150L water within 48h of sowing.',
      'One intercultivation and earthing up at 30-35 DAS controls late weeds and prevents plant lodging.',
    ],
    ipmPractices: [
      { pest: 'Fall Armyworm (Spodoptera frugiperda)', symptoms: 'Pin holes in whorl leaves, extensive window pane feeding, sawdust-like fecal matter in plant whorl.', organicRemedy: 'Apply sand + wood ash (9:1) mixture in central whorls; spray Bacillus thuringiensis @ 400g/acre.', chemicalRemedy: 'Emamectin Benzoate 5% SG @ 80g/acre or Chlorantraniliprole 18.5% SC @ 60ml/acre directed into leaf whorls.' },
    ],
    harvestingAndPostHarvest: {
      maturitySigns: ['Sheath of the cob turns dry, papery, and pale brownish', 'Black layer forms at base of grain where it attaches to cob (physiological maturity)'],
      harvestMethods: ['Pluck mature cobs manually or harvest with combine harvester.'],
      dryingAndStorage: ['De-husk cobs and sun dry for 4-5 days to 12% grain moisture before mechanical shelling.'],
      marketPrepTips: ['Shell clean kernels free from cob dust; high demand from poultry feed mills and starch units.'],
    },
    costEstimatesPerAcre: {
      seedsAndTreatment: 1800,
      landPrepAndPuddling: 2600,
      fertilizersAndManure: 3600,
      laborAndTransplanting: 2800,
      irrigationAndFuel: 2000,
      cropProtection: 1600,
      harvestAndThreshing: 3000,
      transportAndMarketing: 1000,
      totalCost: 18400,
    },
    assumedMarketPricePerQuintal: 2225, // MSP
    priceSource: 'Government of India MSP for Maize (Kharif 2024-25 season)',
    majorRisks: ['Fall Armyworm damage during first 35 days', 'Waterlogging in heavy black soils', 'Moisture stress at silking stage'],
  },

  Chickpea: {
    id: 'Chickpea',
    displayName: 'Chickpea (Chana / Gram / चना / हरभरा)',
    scientificName: 'Cicer arietinum',
    category: 'Pulse / Protein Food',
    localNames: { hindi: 'चना (छोला)', marathi: 'हरभरा / चणा' },
    seasons: ['Rabi'],
    durationDays: 105,
    durationRange: '95 – 115 days',
    waterRequirement: 'Low (250 – 400 mm)',
    suitableSoils: ['black', 'alluvial', 'sandy loam'],
    optimalPh: '6.0 – 8.0',
    tempRange: { min: 10, max: 28, optimal: '16°C – 24°C' },
    primaryStates: ['Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Karnataka', 'Uttar Pradesh', 'Andhra Pradesh', 'Gujarat'],
    yieldPerAcre: { minQuintals: 7, maxQuintals: 12, meanQuintals: 9 },
    yieldPerHectare: { minTonnes: 1.7, maxTonnes: 3.0, meanTonnes: 2.2 },
    seedRatePerAcreKg: 30, // Desi varieties (35-40 kg for bold Kabuli)
    spacing: '30 cm row-to-row × 10 cm plant-to-plant',
    sowingDepth: '5 – 7 cm (sow deep to catch residual moisture in black soil)',
    recommendedVarieties: ['JG 11', 'JAKI 9218', 'Vijay (Phule G-81-1-1)', 'Digvijay', 'Pusa 362', 'MNK-1 (Kabuli)'],
    recommendedSowingWindow: 'October 15 – November 15',
    seedTreatment: [
      'Seed treatment with Carbendazim + Mancozeb @ 2g/kg seed or Trichoderma @ 5g/kg for Fusarium wilt control.',
      'Biofertilizer: Inoculate with Rhizobium (Cicer specific) + PSB culture @ 500g each per 30 kg seed.',
    ],
    landPrepSteps: [
      'One medium ploughing followed by single cross-harrowing. Rough cloddy seedbed is preferred over fine pulverised soil to prevent soil compaction and facilitate root aeration.',
    ],
    nutrientRequirementPerAcre: { n: 10, p: 20, k: 10 },
    fertilizerSchedule: [
      { stage: 'Basal (At Sowing)', product: 'DAP (44 kg) + MOP (17 kg) + Sulphur (8 kg)', timing: 'Day 0', method: 'Drill 3-5 cm below seed' },
      { stage: 'Pre-flowering Stage (40-45 DAS)', product: 'Foliar spray of 2% Urea or 19:19:19 @ 1 kg/acre', timing: 'Day 40 – 45', method: 'Foliar spray boosts branching and pod numbers' },
    ],
    organicManure: 'Apply 2-3 tonnes compost/FYM per acre.',
    irrigationSchedule: [
      { stageName: 'Pre-sowing (Rauni)', daysAfterSowing: -3, timingDescription: '3 days before sowing', waterNeed: 'Pre-sowing soaking', instructions: 'Ensure adequate sub-soil moisture for uniform germination.' },
      { stageName: 'Branching Stage', daysAfterSowing: 35, timingDescription: '30 – 35 DAS', waterNeed: 'Light irrigation', instructions: 'Nipping (plucking top shoots) at 30 days promotes multiple branches.' },
      { stageName: 'Pod Formation Stage', daysAfterSowing: 65, timingDescription: '60 – 70 DAS', waterNeed: 'Light irrigation (if needed)', instructions: 'CRITICAL: NEVER irrigate during full flowering stage (leads to flower drop & vegetative overgrowth).' },
    ],
    weedManagement: [
      'Pre-emergence Pendimethalin 30% EC @ 1 liter/acre within 48h of sowing.',
      'One hand weeding at 25-30 days before crop canopy closes.',
    ],
    ipmPractices: [
      { pest: 'Gram Pod Borer (Helicoverpa armigera)', symptoms: 'Circular holes bored into developing green pods with half body of caterpillar feeding inside.', organicRemedy: 'Install pheromone traps @ 5/acre; plant marigold as trap crop; spray HaNPV @ 200 LE/acre.', chemicalRemedy: 'Emamectin Benzoate 5% SG @ 80 g/acre or Indoxacarb 14.5% SC @ 200 ml/acre in 150L water.' },
      { pest: 'Fusarium Wilt', symptoms: 'Drooping and yellowing of upper leaves; internal dark xylem vascular browning in root cross-section.', organicRemedy: 'Deep summer ploughing; use wilt-resistant varieties like JAKI 9218 or Vijay; seed treat with Trichoderma.', chemicalRemedy: 'Seed treatment only; no effective curative chemical spray exists once infected.' },
    ],
    harvestingAndPostHarvest: {
      maturitySigns: ['Plants turn straw yellow, pods rattle with dry seeds inside, leaves dry and fall off'],
      harvestMethods: ['Pull or cut plants in early morning to avoid pod shattering.'],
      dryingAndStorage: ['Dry harvested plants in sun for 3-4 days on threshing floor before tractor or machine threshing.', 'Store seeds at 9-10% moisture in moisture-proof bags.'],
      marketPrepTips: ['Grade seeds to remove shriveled grains; bold chana fetches premium at APMC.'],
    },
    costEstimatesPerAcre: {
      seedsAndTreatment: 2200,
      landPrepAndPuddling: 2000,
      fertilizersAndManure: 2200,
      laborAndTransplanting: 2500,
      irrigationAndFuel: 1000,
      cropProtection: 1500,
      harvestAndThreshing: 2500,
      transportAndMarketing: 800,
      totalCost: 14700,
    },
    assumedMarketPricePerQuintal: 5440, // MSP benchmark
    priceSource: 'Government of India MSP for Gram (Rabi 2024-25 season)',
    majorRisks: ['Gram pod borer at green pod stage', 'Excess moisture causing root rot / wilt', 'Early unseasonal rain or frost at flowering'],
  },

  Sugarcane: {
    id: 'Sugarcane',
    displayName: 'Sugarcane (गन्ना / ऊस)',
    scientificName: 'Saccharum officinarum',
    category: 'Commercial / Perennial Cash Crop',
    localNames: { hindi: 'गन्ना', marathi: 'ऊस' },
    seasons: ['Whole Year', 'Kharif', 'Rabi'],
    durationDays: 330,
    durationRange: '300 – 360 days (10–12 months)',
    waterRequirement: 'Very High (1500 – 2200 mm)',
    suitableSoils: ['black', 'alluvial', 'clayey'],
    optimalPh: '6.5 – 7.8',
    tempRange: { min: 20, max: 38, optimal: '26°C – 35°C' },
    primaryStates: ['Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Andhra Pradesh', 'Bihar', 'Haryana', 'Punjab'],
    yieldPerAcre: { minQuintals: 300, maxQuintals: 550, meanQuintals: 420 }, // 30-55 tonnes/acre
    yieldPerHectare: { minTonnes: 75, maxTonnes: 135, meanTonnes: 105 },
    seedRatePerAcreKg: 2500, // typically 25,000 to 30,000 two-bud setts per acre
    spacing: '120 cm – 150 cm furrow spacing (wider spacing ideal for drip)',
    sowingDepth: '5 – 7 cm covered with loose soil',
    recommendedVarieties: ['Co 0238 (Karan 4)', 'Co 86032 (Nira)', 'CoM 0265 (Phule 265)', 'Co 0118', 'CoLk 94184'],
    recommendedSowingWindow: 'Suru: Jan–Feb; Adsali (Maharashtra): July–Aug; Pre-seasonal: Oct–Nov',
    seedTreatment: [
      'Dip setts in Carbendazim @ 100g + Chlorpyrifos 20% EC @ 250 ml in 100 liters water for 10-15 minutes.',
      'Sett treatment with Acetobacter diazotrophicus and PSB biofertilizers @ 1 kg each per acre.',
    ],
    landPrepSteps: [
      'Deep subsoiling/chiseling followed by 2 mould-board ploughing passes to break hardpan.',
      'Make deep furrows (25-30 cm deep) at 1.2 to 1.5m row spacing using a ridge plough.',
    ],
    nutrientRequirementPerAcre: { n: 100, p: 35, k: 45 },
    fertilizerSchedule: [
      { stage: 'Basal (At Planting)', product: 'DAP (75 kg) + MOP (40 kg) + Urea (30 kg) + Micronutrients (10 kg)', timing: 'Day 0', method: 'Apply along furrows and mix lightly with soil before sett placement' },
      { stage: 'First Tillering (45 DAP)', product: 'Urea (60 kg)', timing: 'Day 45', method: 'Band placement followed by light weeding' },
      { stage: 'Grand Growth / Earthing Up (110-120 DAP)', product: 'Urea (80 kg) + MOP (35 kg)', timing: 'Day 110 – 120', method: 'Apply followed by heavy earthing up (converting furrows to ridges)' },
    ],
    organicManure: 'Apply 10 tonnes FYM or 3 tonnes pressmud compost per acre during primary tillage.',
    irrigationSchedule: [
      { stageName: 'Germination Phase', daysAfterSowing: 1, timingDescription: '0 – 35 DAP', waterNeed: 'Every 7-8 days', instructions: 'Maintain adequate moisture for quick sett bud sprouting.' },
      { stageName: 'Tillering Phase', daysAfterSowing: 45, timingDescription: '36 – 100 DAP', waterNeed: 'Every 10-12 days', instructions: 'Encourages millable cane tillers.' },
      { stageName: 'Grand Growth Phase', daysAfterSowing: 120, timingDescription: '101 – 270 DAP', waterNeed: 'Peak water requirement', instructions: 'Drip fertigation saves 40% water and boosts cane diameter by 20%.' },
      { stageName: 'Maturity & Ripening', daysAfterSowing: 290, timingDescription: '271 – 330 DAP', waterNeed: 'Reduced watering (every 18-20 days)', instructions: 'Stop irrigation 15-20 days before harvest to increase brix juice sucrose recovery.' },
    ],
    weedManagement: [
      'Pre-emergence: Atrazine 50% WP @ 1 kg/acre within 3 days of planting.',
      'Trash mulching (spread dry cane leaves in alternate furrows at 45 days) prevents weeds, cuts evaporation by 30%, and adds organic matter.',
    ],
    ipmPractices: [
      { pest: 'Early Shoot Borer (Chilo infuscatellus)', symptoms: 'Dead hearts in shoots aged 1 to 3 months; foul odor when pulled out.', organicRemedy: 'Soil application of Metarhizium anisopliae; install pheromone traps @ 10/acre.', chemicalRemedy: 'Fipronil 0.3% G @ 10 kg/acre in furrows or spray Chlorantraniliprole @ 150 ml/acre at 30 days.' },
      { pest: 'Red Rot (Colletotrichum falcatum)', symptoms: 'Third or fourth leaf drying up; longitudinal split of cane shows red lesions with white transverse bands.', organicRemedy: 'Use certified disease-free setts; hot water sett treatment (52°C for 30 mins).', chemicalRemedy: 'No post-infection curative chemical spray; rogue out diseased clumps and burn.' },
    ],
    harvestingAndPostHarvest: {
      maturitySigns: ['Cane leaves turn yellow-brown and brittle', 'Brix hydrometer reading reaches 18-20% sucrose in juice', 'Metallic ring sound when tapped'],
      harvestMethods: ['Harvest at ground level using sharp cane billhook knife (lowest internodes have highest sugar concentration).'],
      dryingAndStorage: ['Deliver to sugar factory / crush within 24-48 hours; sugar inverts into glucose rapidly after 48 hours.'],
      marketPrepTips: ['Tie in uniform bundles; coordinate delivery schedule with local cooperative sugar mill.'],
    },
    costEstimatesPerAcre: {
      seedsAndTreatment: 6500,
      landPrepAndPuddling: 4500,
      fertilizersAndManure: 8500,
      laborAndTransplanting: 9000,
      irrigationAndFuel: 6000,
      cropProtection: 2500,
      harvestAndThreshing: 7500,
      transportAndMarketing: 3500,
      totalCost: 48000,
    },
    assumedMarketPricePerQuintal: 340, // Fair and Remunerative Price (FRP) ₹340/quintal (₹3,400/tonne)
    priceSource: 'Government of India FRP for Sugarcane (Sugar Season 2024-25)',
    majorRisks: ['Water scarcity during summer grand growth', 'Sugar mill payment delays', 'Early shoot borer and red rot'],
  },

  Groundnut: {
    id: 'Groundnut',
    displayName: 'Groundnut (Peanut / मूंगफली / भुईमूग)',
    scientificName: 'Arachis hypogaea',
    category: 'Oilseed / Cash Crop',
    localNames: { hindi: 'मूंगफली', marathi: 'भुईमूग' },
    seasons: ['Kharif', 'Summer'],
    durationDays: 110,
    durationRange: '100 – 120 days',
    waterRequirement: 'Low to Moderate (450 – 650 mm)',
    suitableSoils: ['sandy loam', 'red', 'alluvial'],
    optimalPh: '6.0 – 7.5',
    tempRange: { min: 20, max: 34, optimal: '25°C – 30°C' },
    primaryStates: ['Gujarat', 'Rajasthan', 'Tamil Nadu', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Madhya Pradesh'],
    yieldPerAcre: { minQuintals: 8, maxQuintals: 14, meanQuintals: 11 },
    yieldPerHectare: { minTonnes: 2.0, maxTonnes: 3.5, meanTonnes: 2.7 },
    seedRatePerAcreKg: 45, // Kernels (pods ~65 kg)
    spacing: '30 cm row-to-row × 10 cm plant-to-plant',
    sowingDepth: '5 cm in moist friable soil',
    recommendedVarieties: ['TG 37A', 'GG 20 (Gujarat Groundnut)', 'Kadiri 6', 'JL 24 (Phule Pragati)', 'TAG 24', 'Dharani'],
    recommendedSowingWindow: 'Kharif: June 15 – July 15; Summer: January 15 – February 15',
    seedTreatment: [
      'Treat kernels with Mancozeb @ 3g/kg seed to prevent collar rot and seed rot.',
      'Inoculate with Rhizobium culture (Arachis specific) @ 500g and PSB @ 500g per 40 kg seed.',
    ],
    landPrepSteps: [
      'Plough once followed by 2 harrowings to achieve a light, crumbly, friable seedbed that facilitates peg entry into the soil.',
    ],
    nutrientRequirementPerAcre: { n: 10, p: 20, k: 15 },
    fertilizerSchedule: [
      { stage: 'Basal (At Sowing)', product: 'DAP (44 kg) + MOP (25 kg) + Zinc Sulphate (8 kg)', timing: 'Day 0', method: 'Band placement 4 cm away from seed row' },
      { stage: 'Pegging Stage (40-45 DAS) - CRITICAL', product: 'Gypsum (200 kg/acre)', timing: 'Day 40 – 45', method: 'Apply Gypsum along plant base and work into top 3 cm soil. Calcium is essential for hard pod shells and bold kernels.' },
    ],
    organicManure: 'Apply 3 tonnes FYM/acre during field preparation.',
    irrigationSchedule: [
      { stageName: 'Flowering Stage', daysAfterSowing: 25, timingDescription: '25 – 30 DAS', waterNeed: 'Light irrigation', instructions: 'Promotes synchronous flower flush.' },
      { stageName: 'Pegging Stage (CRITICAL)', daysAfterSowing: 45, timingDescription: '40 – 50 DAS', waterNeed: 'Moderate moisture', instructions: 'Top 5 cm soil must remain moist and soft so aerial pegs can easily pierce soil.' },
      { stageName: 'Pod Development Stage', daysAfterSowing: 70, timingDescription: '65 – 80 DAS', waterNeed: 'Adequate moisture', instructions: 'Crucial for pod filling; avoid waterlogging.' },
    ],
    weedManagement: [
      'Pre-emergence Pendimethalin 30% EC @ 1 liter/acre within 48h of sowing.',
      'Stop all mechanical hoeing/intercultivation after 40-45 days to avoid breaking fragile penetrating pegs!',
    ],
    ipmPractices: [
      { pest: 'Tikka Disease (Cercospora Leaf Spot)', symptoms: 'Circular dark brown spots with yellow halo on leaves leading to premature leaf shedding.', organicRemedy: 'Foliar spray of 5% Neem oil; resistant varieties.', chemicalRemedy: 'Mancozeb 75% WP @ 400g + Carbendazim 50% WP @ 100g in 150L water/acre.' },
      { pest: 'White Grub (Holotrichia consanguinea)', symptoms: 'Plants wither in patches; roots severed 5-10 cm beneath surface.', organicRemedy: 'Deep summer ploughing to expose pupae to birds; light traps for adult beetles.', chemicalRemedy: 'Seed treatment with Chlorpyrifos 20% EC @ 10 ml/kg seed or soil drenching with Chlorpyrifos @ 1 L/acre.' },
    ],
    harvestingAndPostHarvest: {
      maturitySigns: ['Leaves turn yellow and shed; inside of pod shell turns blackish-brown when opened'],
      harvestMethods: ['Pull out plants manually or with groundnut digger-shaker.'],
      dryingAndStorage: ['Invert plants in field for 2-3 days so pods face upwards in sun to dry quickly.', 'Separate pods and dry to <8% moisture to prevent Aspergillus aflatoxin contamination.'],
      marketPrepTips: ['Remove mud and immature pops; clean bold pods fetch top oil-mill price.'],
    },
    costEstimatesPerAcre: {
      seedsAndTreatment: 3800,
      landPrepAndPuddling: 2400,
      fertilizersAndManure: 3200,
      laborAndTransplanting: 3500,
      irrigationAndFuel: 1800,
      cropProtection: 1600,
      harvestAndThreshing: 3500,
      transportAndMarketing: 1000,
      totalCost: 20800,
    },
    assumedMarketPricePerQuintal: 6783, // MSP benchmark
    priceSource: 'Government of India MSP for Groundnut (Kharif 2024-25 season)',
    majorRisks: ['Soil hardening at pegging preventing pod entry', 'White grub root damage in sandy soils', 'Aflatoxin contamination if stored wet'],
  },

  Mustard: {
    id: 'Mustard',
    displayName: 'Mustard (Sarson / Rai / सरसों / मोहरी)',
    scientificName: 'Brassica juncea',
    category: 'Oilseed',
    localNames: { hindi: 'सरसों / राई', marathi: 'मोहरी' },
    seasons: ['Rabi'],
    durationDays: 115,
    durationRange: '105 – 125 days',
    waterRequirement: 'Low (250 – 400 mm)',
    suitableSoils: ['alluvial', 'sandy loam', 'clayey'],
    optimalPh: '6.0 – 7.8',
    tempRange: { min: 10, max: 26, optimal: '15°C – 22°C' },
    primaryStates: ['Rajasthan', 'Madhya Pradesh', 'Haryana', 'Uttar Pradesh', 'West Bengal', 'Gujarat', 'Punjab', 'Bihar'],
    yieldPerAcre: { minQuintals: 7, maxQuintals: 12, meanQuintals: 9 },
    yieldPerHectare: { minTonnes: 1.7, maxTonnes: 3.0, meanTonnes: 2.2 },
    seedRatePerAcreKg: 2,
    spacing: '30 cm – 45 cm row spacing × 10 cm – 12 cm plant spacing (after thinning)',
    sowingDepth: '2 – 3 cm (shallow in moist soil)',
    recommendedVarieties: ['Pusa Bold', 'Giriraj (DRMRIJ 31)', 'RH 749', 'Kranti', 'Pusa Mustard 28', 'Varuna (T 59)'],
    recommendedSowingWindow: 'October 1 – October 25 (Ideal; avoids aphid attacks in spring)',
    seedTreatment: [
      'Treat seed with Thiamethoxam 70% WS @ 4g/kg seed for early aphid protection.',
      'Treat with Metalaxyl 35% WS @ 6g/kg seed to prevent White Rust.',
    ],
    landPrepSteps: [
      'Plough once followed by 2 harrowings and planking to conserve moisture in sandy-loam soils.',
    ],
    nutrientRequirementPerAcre: { n: 32, p: 16, k: 12 },
    fertilizerSchedule: [
      { stage: 'Basal (At Sowing)', product: 'DAP (35 kg) + MOP (20 kg) + Sulphur Bentonite (12 kg)', timing: 'Day 0', method: 'Drill at sowing. Sulphur increases seed oil percentage by 2-3%.' },
      { stage: 'First Irrigation (30-35 DAS)', product: 'Urea (40 kg)', timing: 'Day 30 – 35', method: 'Broadcast before first irrigation followed by thinning' },
    ],
    organicManure: 'Apply 3 tonnes FYM/acre during primary tillage.',
    irrigationSchedule: [
      { stageName: 'Branching / Rosette Stage', daysAfterSowing: 30, timingDescription: '28 – 35 DAS', waterNeed: 'Light irrigation', instructions: 'Critical irrigation stage; perform thinning immediately before.' },
      { stageName: 'Pod Formation (Siliqua)', daysAfterSowing: 65, timingDescription: '60 – 70 DAS', waterNeed: 'Light irrigation', instructions: 'Assists pod development and seed filling; avoid watering on windy days.' },
    ],
    weedManagement: [
      'Pre-emergence Pendimethalin 30% EC @ 1 liter/acre within 48h of sowing.',
      'Mandatory Thinning at 15-20 DAS to maintain 10-12 cm between plants; overcrowding reduces yield by 50%!',
    ],
    ipmPractices: [
      { pest: 'Mustard Aphid (Lipaphis erysimi)', symptoms: 'Huge green-yellow colonies sucking sap from flowers and young pods, causing drying and stunted growth.', organicRemedy: 'Sow early (before Oct 15) to escape aphid attack; install yellow sticky cards @ 10/acre.', chemicalRemedy: 'Dimethoate 30% EC @ 250 ml/acre or Imidacloprid 17.8% SL @ 50 ml/acre in 150L water.' },
      { pest: 'White Rust (Albugo candida)', symptoms: 'White pustules on lower leaf surface and stag-head malformation of flower heads.', organicRemedy: 'Crop rotation; grow resistant varieties like Giriraj.', chemicalRemedy: 'Mancozeb 75% WP @ 400g/acre or Metalaxyl 8% + Mancozeb 64% WP @ 300g/acre.' },
    ],
    harvestingAndPostHarvest: {
      maturitySigns: ['75% of pods (siliquae) turn golden yellow and seeds inside turn brown/black'],
      harvestMethods: ['Cut plants with sickle in morning hours when pods have dew moisture to avoid pod shattering.'],
      dryingAndStorage: ['Stack sheaves in field for 4-5 days to sun dry before threshing.', 'Store dry seeds at <8% moisture.'],
      marketPrepTips: ['Clean and winnow to remove sand and plant debris to get premium oil-mill prices.'],
    },
    costEstimatesPerAcre: {
      seedsAndTreatment: 600,
      landPrepAndPuddling: 2200,
      fertilizersAndManure: 2600,
      laborAndTransplanting: 2400,
      irrigationAndFuel: 1200,
      cropProtection: 1400,
      harvestAndThreshing: 2500,
      transportAndMarketing: 800,
      totalCost: 13700,
    },
    assumedMarketPricePerQuintal: 5950, // MSP benchmark
    priceSource: 'Government of India MSP for Mustard (Rabi 2024-25 season)',
    majorRisks: ['Aphid infestation during cloudy/humid January', 'White rust epidemic', 'Frost injury in north-western plains in late December'],
  },

  Potato: {
    id: 'Potato',
    displayName: 'Potato (आलू / बटाटा)',
    scientificName: 'Solanum tuberosum',
    category: 'Vegetable / Tuber Food',
    localNames: { hindi: 'आलू', marathi: 'बटाटा' },
    seasons: ['Rabi'],
    durationDays: 95,
    durationRange: '80 – 105 days',
    waterRequirement: 'Moderate (350 – 550 mm)',
    suitableSoils: ['alluvial', 'sandy loam'],
    optimalPh: '5.2 – 6.8',
    tempRange: { min: 12, max: 26, optimal: '16°C – 22°C (Nights 14°C – 18°C)' },
    primaryStates: ['Uttar Pradesh', 'West Bengal', 'Bihar', 'Gujarat', 'Madhya Pradesh', 'Punjab', 'Assam', 'Maharashtra'],
    yieldPerAcre: { minQuintals: 90, maxQuintals: 160, meanQuintals: 125 },
    yieldPerHectare: { minTonnes: 22, maxTonnes: 40, meanTonnes: 31 },
    seedRatePerAcreKg: 1000, // typically 10-12 quintals seed tubers per acre (30-40g size)
    spacing: '60 cm ridge-to-ridge × 20 cm tuber-to-tuber',
    sowingDepth: '5 – 7 cm on ridges',
    recommendedVarieties: ['Kufri Pukhraj (Early)', 'Kufri Jyoti', 'Kufri Bahar', 'Kufri Chipsona 1 (Chips)', 'Kufri Surya (Heat tolerant)'],
    recommendedSowingWindow: 'October 15 – November 10',
    seedTreatment: [
      'Dip sprouted tubers in Mancozeb @ 2.5g/L water for 10 minutes to protect against seed-borne early blight and black scurf.',
      'Allow cut tubers to suberize for 24 hours in shaded airy place before planting.',
    ],
    landPrepSteps: [
      'Deep ploughing followed by 3-4 thorough rotavator passes to create fine, loose, friable soil bed free of clods.',
      'Make ridges and furrows at 60 cm spacing using potato ridge maker.',
    ],
    nutrientRequirementPerAcre: { n: 60, p: 35, k: 45 },
    fertilizerSchedule: [
      { stage: 'Basal (At Planting)', product: 'DAP (75 kg) + MOP (60 kg) + Urea (35 kg)', timing: 'Day 0', method: 'Apply in furrow bands 5 cm away from seed tubers' },
      { stage: 'Earthing Up (30-35 DAP)', product: 'Urea (50 kg)', timing: 'Day 30 – 35', method: 'Apply along ridges immediately before earthing up' },
    ],
    organicManure: 'Apply 8 tonnes FYM/acre 1 month prior to planting.',
    irrigationSchedule: [
      { stageName: 'Pre-emergence to Stolon Formation', daysAfterSowing: 10, timingDescription: 'Every 7 – 8 days', waterNeed: 'Light furrow irrigation', instructions: 'Water should reach only 2/3rd height of ridges; never submerge top ridge.' },
      { stageName: 'Tuber Initiation & Bulking (CRITICAL)', daysAfterSowing: 35, timingDescription: '35 – 75 DAP', waterNeed: 'Every 6 – 8 days', instructions: 'Even moisture is vital; dry spells followed by heavy irrigation causes tuber cracking and knobby shape.' },
      { stageName: 'Maturity (Dehaulming phase)', daysAfterSowing: 80, timingDescription: '80 – 90 DAP', waterNeed: 'Stop watering 10-12 days before harvest', instructions: 'Withhold water to allow skin hardening (curing) before lifting.' },
    ],
    weedManagement: [
      'Pre-emergence Metribuzin 70% WP @ 200 g/acre within 3 days of planting.',
      'Earthing up at 30-35 days buries emerging weeds and covers developing tubers from sun exposure (which causes toxic greening).',
    ],
    ipmPractices: [
      { pest: 'Late Blight (Phytophthora infestans)', symptoms: 'Water-soaked irregular lesions on leaf tips turning black-brown with white cottony mold under high humidity.', organicRemedy: 'Foliar spray of Trichoderma; grow resistant varieties like Kufri Chipsona.', chemicalRemedy: 'Prophylactic spray of Mancozeb @ 600g/acre; at initial symptoms spray Cymoxanil + Mancozeb @ 600g/acre or Dimethomorph @ 400g/acre.' },
    ],
    harvestingAndPostHarvest: {
      maturitySigns: ['Dehaulming (cutting green foliage at base) done 10 days before harvest to firm up tuber skin'],
      harvestMethods: ['Dig with potato digger or hand spade; avoid bruising skin.'],
      dryingAndStorage: ['Cure dug tubers in shaded heaps for 7-10 days to heal skin abrasions before grading', 'Store in ventilated cool dark room or cold storage at 4-7°C.'],
      marketPrepTips: ['Grade by size: Large (table/chips), Medium (seed), Small (processing); clean off soil.'],
    },
    costEstimatesPerAcre: {
      seedsAndTreatment: 14000, // seed tubers are significant investment
      landPrepAndPuddling: 3500,
      fertilizersAndManure: 5500,
      laborAndTransplanting: 5500,
      irrigationAndFuel: 3000,
      cropProtection: 2500,
      harvestAndThreshing: 5000,
      transportAndMarketing: 2500,
      totalCost: 41500,
    },
    assumedMarketPricePerQuintal: 950, // Typical average farm-gate harvest price
    priceSource: 'Average Mandi Harvest Price Benchmark (Agmarknet / NHB)',
    majorRisks: ['Late Blight outbreak in humid foggy weather', 'Post-harvest price crash due to gluts', 'High initial seed tuber cost'],
  },

  Onion: {
    id: 'Onion',
    displayName: 'Onion (प्याज / कांदा)',
    scientificName: 'Allium cepa',
    category: 'Vegetable / High Value Cash Crop',
    localNames: { hindi: 'प्याज', marathi: 'कांदा' },
    seasons: ['Rabi', 'Kharif', 'Summer'],
    durationDays: 125,
    durationRange: '115 – 135 days (from transplanting)',
    waterRequirement: 'Moderate (350 – 550 mm)',
    suitableSoils: ['sandy loam', 'black', 'alluvial'],
    optimalPh: '6.0 – 7.5',
    tempRange: { min: 13, max: 30, optimal: '18°C – 26°C' },
    primaryStates: ['Maharashtra', 'Madhya Pradesh', 'Karnataka', 'Gujarat', 'Rajasthan', 'Bihar', 'Andhra Pradesh', 'Haryana'],
    yieldPerAcre: { minQuintals: 90, maxQuintals: 150, meanQuintals: 120 },
    yieldPerHectare: { minTonnes: 22, maxTonnes: 37, meanTonnes: 30 },
    seedRatePerAcreKg: 4, // Nursery seeds (or ~40,000 seedlings)
    spacing: '15 cm row-to-row × 10 cm plant-to-plant',
    sowingDepth: '1 – 2 cm (transplant 40-45 day old seedlings)',
    recommendedVarieties: ['Bhima Super', 'Bhima Shakti', 'Bhima Red', 'Agrifound Light Red', 'N-53 (Kharif)', 'Phule Samarth'],
    recommendedSowingWindow: 'Rabi Nursery: Oct–Nov → Transplant Dec; Kharif Nursery: May–June → Transplant July',
    seedTreatment: [
      'Treat seed with Thiram @ 2.5g/kg seed in nursery.',
      'Dip seedling roots in Carbendazim 0.1% solution for 15 minutes prior to field transplanting.',
    ],
    landPrepSteps: [
      'Plough deep and prepare raised beds (120 cm wide, 15 cm high) with micro-sprinklers or drip lines. Raised beds prevent waterlogging and bulb rotting.',
    ],
    nutrientRequirementPerAcre: { n: 40, p: 20, k: 30 },
    fertilizerSchedule: [
      { stage: 'Basal (At Transplanting)', product: 'DAP (45 kg) + MOP (40 kg) + Sulphur (12 kg)', timing: 'Day 0', method: 'Broadcast and incorporate into raised beds' },
      { stage: 'Vegetative Growth (30 DAT)', product: 'Urea (35 kg)', timing: 'Day 30', method: 'Top dress in moist soil' },
      { stage: 'Bulb Initiation (45-50 DAT)', product: 'Urea (30 kg) + 00:00:50 (Potassium Sulphate @ 1 kg/acre spray)', timing: 'Day 45 – 50', method: 'Top dress; stop all nitrogen 60 days after transplanting to avoid thick necks!' },
    ],
    organicManure: 'Apply 6 tonnes FYM/acre 3 weeks before bed formation.',
    irrigationSchedule: [
      { stageName: 'Transplanting to Establishment', daysAfterSowing: 1, timingDescription: '0 – 15 DAT', waterNeed: 'Every 3 – 4 days', instructions: 'Light frequent watering with micro-sprinklers.' },
      { stageName: 'Bulb Development', daysAfterSowing: 45, timingDescription: '45 – 90 DAT', waterNeed: 'Every 6 – 8 days', instructions: 'Even moisture prevents double bulbs and split scales.' },
      { stageName: 'Maturity Curing', daysAfterSowing: 110, timingDescription: '110 – 125 DAT', waterNeed: 'Stop watering 12-15 days prior to harvest', instructions: 'Crucial for outer dry scale curing and long shelf life.' },
    ],
    weedManagement: [
      'Pre-transplant: Oxyfluorfen 23.5% EC @ 150 ml/acre 3 days before transplanting.',
      'One hand weeding at 35-40 days.',
    ],
    ipmPractices: [
      { pest: 'Onion Thrips (Thrips tabaci)', symptoms: 'Silvery white patches and curled crinkled leaves; rasping and sucking sap in leaf sheaths.', organicRemedy: 'Blue sticky traps @ 10/acre; spray 5% Neem seed kernel extract.', chemicalRemedy: 'Fipronil 5% SC @ 250 ml/acre or Spinetoram 11.7% SC @ 150 ml/acre in 150L water.' },
      { pest: 'Purple Blotch (Alternaria porri)', symptoms: 'Purplish-brown sunken lesions on leaves, causing foliage to collapse prematurely.', organicRemedy: 'Spray Mancozeb @ 500g/acre proactively with wetting agent (sticker).', chemicalRemedy: 'Difenoconazole 25% EC @ 120 ml/acre or Tebuconazole @ 200 ml/acre.' },
    ],
    harvestingAndPostHarvest: {
      maturitySigns: ['50% of the plant tops naturally fall over (neck fall)'],
      harvestMethods: ['Pull out bulbs by hand in dry weather; leave with tops in windrows for 3-5 days in field for curing.'],
      dryingAndStorage: ['Cut foliage leaving 2-3 cm neck attached', 'Cure in shaded ventilated sheds for 10-15 days before packing in mesh bags for storage up to 5-6 months.'],
      marketPrepTips: ['Grade by diameter (40-60mm medium size has highest retail demand).'],
    },
    costEstimatesPerAcre: {
      seedsAndTreatment: 2800,
      landPrepAndPuddling: 3500,
      fertilizersAndManure: 4500,
      laborAndTransplanting: 7000, // transplanting & sorting labor
      irrigationAndFuel: 2500,
      cropProtection: 2200,
      harvestAndThreshing: 4500,
      transportAndMarketing: 2000,
      totalCost: 29000,
    },
    assumedMarketPricePerQuintal: 1650, // Average benchmark modal mandi price
    priceSource: 'Nashik / Lasalgaon APMC Historical Benchmark',
    majorRisks: ['Thrips outbreak during dry spells', 'Sudden post-harvest price volatility', 'Rotting in storage under humid conditions'],
  },
};

// ── Crop Suitability Assessment Engine ───────────────────────────────────────

export const assessCropSuitability = ({
  cropId,
  state = 'Maharashtra',
  district = '',
  soilType = 'unknown',
  season = 'Kharif',
  irrigation = 'irrigated',
  areaInAcres = 2,
  budget = 0,
  weatherData = null,
  preference = 'balanced',
  soilTest = null,
}) => {
  const crop = AGRONOMIC_CROPS_DB[cropId] || AGRONOMIC_CROPS_DB['Soybean'];
  const normState = (state || 'Maharashtra').trim();
  const zoneName = STATE_TO_ZONE[normState] || 'Western Plateau and Hills';

  let score = 55;
  const reasons = [];
  const cautions = [];
  const alternatives = [];

  // 1. State / Regional Fit (+20)
  const isStateMatch = crop.primaryStates.some((s) => s.toLowerCase() === normState.toLowerCase());
  if (isStateMatch) {
    score += 20;
    reasons.push(`${crop.id} is a major proven crop in ${normState} with established local mandis and seed networks.`);
  } else {
    score += 5;
    cautions.push(`${crop.id} is less commonly grown in ${normState}; verify local seed availability and processing facilities.`);
  }

  // 2. Seasonal Suitability (+15)
  if (crop.seasons.includes('Whole Year') || crop.seasons.includes(season)) {
    score += 15;
    reasons.push(`Target season (${season}) perfectly matches the optimal sowing window for ${crop.id}.`);
  } else {
    score -= 15;
    cautions.push(`${crop.id} is typically a ${crop.seasons.join('/')} crop; planting in ${season} poses significant climatic and yield risks.`);
  }

  // 3. Soil Compatibility (+15)
  const normSoil = (soilType || 'unknown').toLowerCase();
  if (normSoil === 'unknown') {
    score += 6;
    cautions.push(`Soil type was specified as 'Unknown'. Standard regional soil profile (${AGRO_CLIMATIC_ZONES[zoneName]?.typicalSoil || 'black/alluvial'}) assumed.`);
  } else if (crop.suitableSoils.some((s) => normSoil.includes(s))) {
    score += 15;
    reasons.push(`${soilType.charAt(0).toUpperCase() + soilType.slice(1)} soil provides ideal root aeration, pH, and drainage for ${crop.id}.`);
  } else {
    score -= 8;
    cautions.push(`${crop.id} prefers ${crop.suitableSoils.join('/')} soil. Cultivation in ${soilType} requires heavy organic amendment.`);
  }

  // 4. Irrigation & Water Match (+15)
  if (irrigation === 'drip/sprinkler' || irrigation === 'irrigated') {
    score += 15;
    reasons.push(`Reliable irrigation (${irrigation}) ensures critical growth stages will not suffer moisture stress.`);
  } else if (irrigation === 'rainfed') {
    if (crop.waterRequirement.toLowerCase().includes('low')) {
      score += 15;
      reasons.push(`${crop.id} is naturally drought-hardy and thrives under rainfed dryland conditions.`);
    } else if (crop.waterRequirement.toLowerCase().includes('high') || crop.waterRequirement.toLowerCase().includes('very high')) {
      score -= 20;
      cautions.push(`${crop.id} requires ${crop.waterRequirement} water. Attempting rainfed cultivation carries extreme drought risk.`);
    } else {
      score += 5;
      cautions.push(`Rainfed cultivation depends heavily on normal monsoon timing and distribution.`);
    }
  }

  // 5. Budget Check (+10)
  const totalCostEstimate = crop.costEstimatesPerAcre.totalCost * areaInAcres;
  if (budget && budget > 0) {
    if (budget >= totalCostEstimate) {
      score += 10;
      reasons.push(`Budget of ₹${budget.toLocaleString()} is sufficient to cover the estimated input expenses (₹${totalCostEstimate.toLocaleString()}).`);
    } else if (budget >= totalCostEstimate * 0.75) {
      score += 4;
      cautions.push(`Estimated expenditure (₹${totalCostEstimate.toLocaleString()}) slightly exceeds budget (₹${budget.toLocaleString()}). Consider optimizing fertilizer or labor costs.`);
    } else {
      score -= 10;
      cautions.push(`Estimated cultivation cost (₹${totalCostEstimate.toLocaleString()}) substantially exceeds available budget (₹${budget.toLocaleString()}).`);
    }
  } else {
    score += 8; // no budget constraint specified
  }

  // 6. Preference Alignment (+5)
  if (preference === 'low_investment' && totalCostEstimate / areaInAcres <= 18000) {
    score += 5;
    reasons.push(`Matches your preference for lower initial cash investment.`);
  } else if (preference === 'short_duration' && crop.durationDays <= 110) {
    score += 5;
    reasons.push(`Matches your preference for a short duration crop (${crop.durationDays} days), freeing land quickly.`);
  } else if (preference === 'low_water' && crop.waterRequirement.toLowerCase().includes('low')) {
    score += 5;
    reasons.push(`Matches your preference for low water consumption.`);
  }

  // Determine Tier
  const finalScore = Math.max(35, Math.min(98, Math.round(score)));
  let tier = 'Moderately Suitable';
  let isSuitable = true;

  if (finalScore >= 85) {
    tier = 'Highly Suitable';
  } else if (finalScore >= 70) {
    tier = 'Suitable';
  } else {
    tier = 'Risky / Low Compatibility';
    isSuitable = false;
  }

  // Identify alternatives if score is moderate or low
  if (finalScore < 75) {
    Object.values(AGRONOMIC_CROPS_DB).forEach((other) => {
      if (other.id !== crop.id && other.seasons.includes(season)) {
        if (irrigation === 'rainfed' && other.waterRequirement.toLowerCase().includes('low')) {
          alternatives.push(other.displayName);
        } else if (isStateMatch && other.primaryStates.includes(normState)) {
          alternatives.push(other.displayName);
        }
      }
    });
  }

  return {
    score: finalScore,
    tier,
    isSuitable,
    reasons,
    cautions,
    alternatives: [...new Set(alternatives)].slice(0, 3),
  };
};

// ── Auto-Recommendation Engine (Option B) ────────────────────────────────────

export const recommendTopCrops = ({
  state = 'Maharashtra',
  district = '',
  soilType = 'unknown',
  season = 'Kharif',
  irrigation = 'irrigated',
  areaInAcres = 2,
  budget = 0,
  preference = 'balanced',
  weatherData = null,
  soilTest = null,
}) => {
  const scored = Object.keys(AGRONOMIC_CROPS_DB).map((cropId) => {
    const crop = AGRONOMIC_CROPS_DB[cropId];
    const assessment = assessCropSuitability({
      cropId,
      state,
      district,
      soilType,
      season,
      irrigation,
      areaInAcres,
      budget,
      weatherData,
      preference,
      soilTest,
    });

    const totalCostForArea = crop.costEstimatesPerAcre.totalCost * areaInAcres;
    const meanYield = crop.yieldPerAcre.meanQuintals * areaInAcres;
    const estRevenue = meanYield * crop.assumedMarketPricePerQuintal;
    const estNetReturn = estRevenue - totalCostForArea;

    return {
      cropId: crop.id,
      name: crop.id,
      displayName: crop.displayName,
      localNames: crop.localNames,
      category: crop.category,
      suitabilityScore: assessment.score,
      suitabilityTier: assessment.tier,
      reasons: assessment.reasons,
      cautions: assessment.cautions,
      durationDays: crop.durationDays,
      durationRange: crop.durationRange,
      waterRequirement: crop.waterRequirement,
      approxInvestment: totalCostForArea,
      expectedYieldPerAcre: `${crop.yieldPerAcre.minQuintals} – ${crop.yieldPerAcre.maxQuintals} Quintals`,
      expectedYieldTotal: `${(crop.yieldPerAcre.minQuintals * areaInAcres).toFixed(1)} – ${(crop.yieldPerAcre.maxQuintals * areaInAcres).toFixed(1)} Quintals`,
      expectedNetReturn: Math.round(estNetReturn),
      majorRisks: crop.majorRisks,
    };
  });

  // Sort descending by suitability score
  scored.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  return scored.slice(0, 5);
};

// ── Complete End-to-End Farming Plan Generator ───────────────────────────────

export const generateCompleteFarmingPlan = async ({
  cropId = 'Soybean',
  cropVariety = '',
  sowingDate = new Date(),
  area = 2,
  areaUnit = 'acres',
  state = 'Maharashtra',
  district = '',
  latitude = null,
  longitude = null,
  soilType = 'black',
  irrigation = 'irrigated',
  budget = 0,
  preference = 'balanced',
  soilTest = null,
  weatherContext = null,
}) => {
  const crop = AGRONOMIC_CROPS_DB[cropId] || AGRONOMIC_CROPS_DB['Soybean'];
  const areaInAcres = normalizeToAcres(area, areaUnit);
  const areaInHectares = normalizeToHectares(area, areaUnit);
  const startDate = new Date(sowingDate || Date.now());

  // 1. Fetch live weather if lat/lon provided
  let weather = weatherContext;
  if (!weather && latitude && longitude) {
    try {
      weather = await fetchOpenMeteoWeather(latitude, longitude);
    } catch {}
  }

  // 2. Assess Suitability
  const seasonDetermined = crop.seasons.includes('Kharif') ? 'Kharif' : crop.seasons[0];
  const suitability = assessCropSuitability({
    cropId: crop.id,
    state,
    district,
    soilType,
    season: seasonDetermined,
    irrigation,
    areaInAcres,
    budget,
    weatherData: weather,
    preference,
    soilTest,
  });

  // 3. Seed Calculation
  const totalSeedKg = Math.round(crop.seedRatePerAcreKg * areaInAcres * 10) / 10;

  // 4. Fertilizer Plan & Commercial Products Conversion
  // Soil test adjustments
  let nAdj = 1.0;
  let pAdj = 1.0;
  let kAdj = 1.0;
  const soilAdjustments = [];

  if (soilTest && soilTest.tested) {
    if (soilTest.nitrogen === 'low') { nAdj = 1.25; soilAdjustments.push('Soil nitrogen is LOW (+25% N applied)'); }
    if (soilTest.nitrogen === 'high') { nAdj = 0.75; soilAdjustments.push('Soil nitrogen is HIGH (-25% N reduced)'); }
    if (soilTest.phosphorus === 'low') { pAdj = 1.25; soilAdjustments.push('Soil phosphorus is LOW (+25% P applied)'); }
    if (soilTest.phosphorus === 'high') { pAdj = 0.75; soilAdjustments.push('Soil phosphorus is HIGH (-25% P reduced)'); }
    if (soilTest.potassium === 'low') { kAdj = 1.20; soilAdjustments.push('Soil potassium is LOW (+20% K applied)'); }
    if (soilTest.potassium === 'high') { kAdj = 0.80; soilAdjustments.push('Soil potassium is HIGH (-20% K reduced)'); }
    if (soilTest.ph && soilTest.ph < 6.0) { soilAdjustments.push(`Soil is acidic (pH ${soilTest.ph}). Apply 250 kg Agricultural Lime/acre.`); }
    if (soilTest.ph && soilTest.ph > 8.0) { soilAdjustments.push(`Soil is alkaline (pH ${soilTest.ph}). Apply 300 kg Gypsum/acre.`); }
  } else {
    soilAdjustments.push('No soil test provided: Standard state agricultural university recommended dosage applied.');
  }

  const recN = crop.nutrientRequirementPerAcre.n * nAdj * areaInAcres;
  const recP = crop.nutrientRequirementPerAcre.p * pAdj * areaInAcres;
  const recK = crop.nutrientRequirementPerAcre.k * kAdj * areaInAcres;

  // Commercial product formulas:
  // DAP supplies 18% N and 46% P₂O₅
  const dapNeededKg = Math.round(recP / 0.46);
  const nFromDap = dapNeededKg * 0.18;
  const remN = Math.max(0, recN - nFromDap);
  const ureaNeededKg = Math.round(remN / 0.46);
  // MOP supplies 60% K₂O
  const mopNeededKg = Math.round(recK / 0.60);

  const commercialProducts = [
    {
      name: 'DAP (Di-Ammonium Phosphate 18:46:0)',
      quantityKg: dapNeededKg,
      bags: Math.ceil(dapNeededKg / 50),
      timing: 'Basal Dose (Day 0 at sowing)',
      stage: 'Basal',
      method: 'Drill 3-5 cm below and to the side of seeds',
      estimatedCost: Math.round(dapNeededKg * 27), // ₹1,350 per 50kg bag ~ ₹27/kg subsidized
    },
    {
      name: 'Urea (46% Nitrogen)',
      quantityKg: ureaNeededKg,
      bags: Math.ceil(ureaNeededKg / 45), // standard 45kg bag
      timing: 'Split into 2-3 top dressings (e.g. 21 DAS & 45 DAS)',
      stage: 'Vegetative & Tillering/Branching',
      method: 'Top dress in moist soil; avoid waterlogged or windy conditions',
      estimatedCost: Math.round(ureaNeededKg * 6), // ₹268 per 45kg bag ~ ₹6/kg subsidized
    },
    {
      name: 'MOP (Muriate of Potash 0:0:60)',
      quantityKg: mopNeededKg,
      bags: Math.ceil(mopNeededKg / 50),
      timing: 'Basal / Pre-flowering stage',
      stage: 'Basal / Early stage',
      method: 'Soil incorporation with basal or early interculture',
      estimatedCost: Math.round(mopNeededKg * 34), // ₹1,700 per 50kg bag ~ ₹34/kg
    },
  ];

  const totalFertCost = commercialProducts.reduce((acc, p) => acc + p.estimatedCost, 0);

  // 5. Budget & Profitability Calculations
  const expList = [
    { category: 'Seeds & Treatment', name: `Certified ${crop.id} Seed (${totalSeedKg} kg) + Seed Treatment`, estimatedCost: Math.round(crop.costEstimatesPerAcre.seedsAndTreatment * areaInAcres), costPerAcre: crop.costEstimatesPerAcre.seedsAndTreatment, notes: 'Includes biofertilizer & fungicide treatment' },
    { category: 'Land Preparation', name: 'Ploughing, Harrowing, Rotavator & Planking', estimatedCost: Math.round(crop.costEstimatesPerAcre.landPrepAndPuddling * areaInAcres), costPerAcre: crop.costEstimatesPerAcre.landPrepAndPuddling, notes: 'Machinery diesel & tractor operator cost' },
    { category: 'Fertilizers & Manure', name: 'Chemical Fertilizers (Urea, DAP, MOP) + Farmyard Manure', estimatedCost: Math.round(crop.costEstimatesPerAcre.fertilizersAndManure * areaInAcres), costPerAcre: crop.costEstimatesPerAcre.fertilizersAndManure, notes: 'Balanced NPK + organic compost' },
    { category: 'Labor & Sowing', name: 'Sowing/Transplanting, Interculture & Weeding Labor', estimatedCost: Math.round(crop.costEstimatesPerAcre.laborAndTransplanting * areaInAcres), costPerAcre: crop.costEstimatesPerAcre.laborAndTransplanting, notes: 'Field operations & manual weeding' },
    { category: 'Irrigation & Energy', name: 'Canal charges / Borewell electricity & diesel pumping', estimatedCost: Math.round(crop.costEstimatesPerAcre.irrigationAndFuel * areaInAcres), costPerAcre: crop.costEstimatesPerAcre.irrigationAndFuel, notes: 'Seasonal water management expenses' },
    { category: 'Crop Protection', name: 'Herbicides, Bio-pesticides & IPM sprays', estimatedCost: Math.round(crop.costEstimatesPerAcre.cropProtection * areaInAcres), costPerAcre: crop.costEstimatesPerAcre.cropProtection, notes: 'Pest traps, neem spray, selective chemical control' },
    { category: 'Harvest & Post-Harvest', name: 'Reaping, Threshing, Winnowing, Cleaning & Bags', estimatedCost: Math.round(crop.costEstimatesPerAcre.harvestAndThreshing * areaInAcres), costPerAcre: crop.costEstimatesPerAcre.harvestAndThreshing, notes: 'Machine combine / manual cutting & threshing' },
    { category: 'Transport & Mandi', name: 'Local transport & APMC market cess/handling', estimatedCost: Math.round(crop.costEstimatesPerAcre.transportAndMarketing * areaInAcres), costPerAcre: crop.costEstimatesPerAcre.transportAndMarketing, notes: 'Trolley hire to nearest mandi' },
  ];

  const totalCost = expList.reduce((acc, e) => acc + e.estimatedCost, 0);
  const costPerAcre = Math.round(totalCost / areaInAcres);
  const costPerHectare = Math.round(totalCost / areaInHectares);

  const minProd = Math.round(crop.yieldPerAcre.minQuintals * areaInAcres * 10) / 10;
  const maxProd = Math.round(crop.yieldPerAcre.maxQuintals * areaInAcres * 10) / 10;
  const meanProd = Math.round(crop.yieldPerAcre.meanQuintals * areaInAcres * 10) / 10;

  const assumedPrice = crop.assumedMarketPricePerQuintal;
  const grossRev = Math.round(meanProd * assumedPrice);
  const netRet = grossRev - totalCost;
  const breakEvenPrice = Math.round(totalCost / meanProd);

  // Scenarios
  const scenarios = {
    low: {
      yield: Math.round(crop.yieldPerAcre.minQuintals * 10) / 10,
      production: minProd,
      revenue: Math.round(minProd * (assumedPrice * 0.95)),
      netReturn: Math.round(minProd * (assumedPrice * 0.95)) - totalCost,
      description: 'Adverse weather dry spell or modest pest attack (Lower yield & slightly reduced mandi price)',
    },
    moderate: {
      yield: Math.round(crop.yieldPerAcre.meanQuintals * 10) / 10,
      production: meanProd,
      revenue: grossRev,
      netReturn: netRet,
      description: 'Normal seasonal rainfall and timely agronomic package of practices',
    },
    favorable: {
      yield: Math.round(crop.yieldPerAcre.maxQuintals * 10) / 10,
      production: maxProd,
      revenue: Math.round(maxProd * (assumedPrice * 1.05)),
      netReturn: Math.round(maxProd * (assumedPrice * 1.05)) - totalCost,
      description: 'Optimal weather distribution, fertile soil, high-yielding seed & rigorous IPM',
    },
  };

  // 6. Generate Calendar Tasks
  const calendarTasks = [];
  const addDays = (d, days) => {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy;
  };

  // Pre-sowing
  calendarTasks.push({
    taskId: 'task-prep-1',
    stage: 'Land Preparation',
    daysAfterSowing: -10,
    scheduledDate: addDays(startDate, -10),
    title: 'Summer Deep Ploughing & FYM Incorporation',
    category: 'Land Prep',
    priority: 'high',
    instructions: `Deep plough the ${area} ${areaUnit} field to expose weeds and pests. Spread 3-5 tonnes of compost/FYM per acre evenly.`,
    completed: false,
  });

  calendarTasks.push({
    taskId: 'task-prep-2',
    stage: 'Seed Procurement & Treatment',
    daysAfterSowing: -2,
    scheduledDate: addDays(startDate, -2),
    title: `Procure ${totalSeedKg} kg Certified Seed & Perform Seed Treatment`,
    category: 'Seeds',
    priority: 'critical',
    instructions: crop.seedTreatment.join(' Then: '),
    completed: false,
  });

  // Sowing day
  calendarTasks.push({
    taskId: 'task-sow-1',
    stage: 'Sowing & Basal Fertilizer',
    daysAfterSowing: 0,
    scheduledDate: addDays(startDate, 0),
    title: `Sowing & Basal Fertilizer Application (${commercialProducts[0].name})`,
    category: 'Sowing',
    priority: 'critical',
    instructions: `Sow at ${crop.spacing} spacing at ${crop.sowingDepth} depth. Drill ${commercialProducts[0].quantityKg} kg of ${commercialProducts[0].name} in furrows.`,
    completed: false,
  });

  // Weed management
  calendarTasks.push({
    taskId: 'task-weed-1',
    stage: 'Weed Control',
    daysAfterSowing: 2,
    scheduledDate: addDays(startDate, 2),
    title: 'Pre-Emergence Herbicide Spray',
    category: 'Weeding',
    priority: 'medium',
    instructions: crop.weedManagement[0] || 'Apply recommended pre-emergence herbicide on moist soil.',
    completed: false,
  });

  // Irrigations and top dressings
  crop.irrigationSchedule.forEach((irr, idx) => {
    calendarTasks.push({
      taskId: `task-irr-${idx + 1}`,
      stage: irr.stageName,
      daysAfterSowing: irr.daysAfterSowing,
      scheduledDate: addDays(startDate, irr.daysAfterSowing),
      title: `Irrigation: ${irr.stageName}`,
      category: 'Irrigation',
      priority: irr.stageName.includes('CRITICAL') ? 'critical' : 'medium',
      instructions: irr.instructions,
      completed: false,
    });
  });

  // Crop inspection & pest check
  calendarTasks.push({
    taskId: 'task-ipm-1',
    stage: 'Vegetative Pest Scouting',
    daysAfterSowing: 30,
    scheduledDate: addDays(startDate, 30),
    title: 'Crop Inspection & Scouting for Pests/Diseases',
    category: 'Crop Protection',
    priority: 'high',
    instructions: `Inspect underside of leaves and growing whorls across ${area} ${areaUnit} field. Watch for ${crop.ipmPractices[0]?.pest || 'pests'}.`,
    completed: false,
  });

  // Harvest task
  calendarTasks.push({
    taskId: 'task-harvest-1',
    stage: 'Harvesting',
    daysAfterSowing: crop.durationDays,
    scheduledDate: addDays(startDate, crop.durationDays),
    title: `Harvesting ${crop.id} at Maturity`,
    category: 'Harvest',
    priority: 'critical',
    instructions: `${crop.harvestingAndPostHarvest.maturitySigns.join('. ')}. Ensure dry weather before harvesting.`,
    completed: false,
  });

  // Post-harvest
  calendarTasks.push({
    taskId: 'task-post-1',
    stage: 'Post-Harvest & Storage',
    daysAfterSowing: crop.durationDays + 5,
    scheduledDate: addDays(startDate, crop.durationDays + 5),
    title: 'Sun Drying, Moisture Check & Bagging for Mandi',
    category: 'Post-Harvest',
    priority: 'high',
    instructions: crop.harvestingAndPostHarvest.dryingAndStorage.join('. '),
    completed: false,
  });

  // Sort calendar by scheduledDate
  calendarTasks.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

  // 7. Optional ML Yield Prediction Integration
  let mlPrediction = null;
  try {
    const mlResp = await predictYieldService({
      crop: crop.id,
      state,
      season: seasonDetermined,
      area: areaInAcres,
      areaUnit: 'acres',
      annualRainfall: weather?.annualRainfallMm,
      soilType: soilType === 'unknown' ? 'alluvial' : soilType,
      irrigation,
      latitude,
      longitude,
      weatherContext: weather?.current,
    });

    if (mlResp) {
      mlPrediction = {
        predictedYieldTonnesPerHa: mlResp.predicted_yield_tonnes_per_hectare || mlResp.predicted_yield || 0,
        predictedYieldQuintalsPerAcre: mlResp.predicted_yield_quintals_per_acre || 0,
        totalProductionQuintals: mlResp.total_production_quintals || 0,
        modelUsed: mlResp.model_name || 'Random Forest Crop Yield Regressor',
        confidenceScore: mlResp.confidence_score || 94,
      };
    }
  } catch (mlErr) {
    console.warn('[Farming Plan] ML prediction fallback to agronomic model:', mlErr.message);
  }

  return {
    cropName: crop.id,
    cropVariety: cropVariety || crop.recommendedVarieties[0],
    season: seasonDetermined,
    sowingDate: startDate,
    farmDetails: {
      location: {
        latitude,
        longitude,
        district,
        state,
        placeName: `${district ? district + ', ' : ''}${state}`,
      },
      area: {
        value: parseFloat(area),
        unit: areaUnit,
      },
      areaInAcres: Math.round(areaInAcres * 100) / 100,
      areaInHectares: Math.round(areaInHectares * 100) / 100,
      soilType,
      irrigationType: irrigation,
      budget: parseFloat(budget) || 0,
      preference,
      soilTest: soilTest || { tested: false },
    },
    suitabilityAssessment: suitability,
    cropOverview: {
      scientificName: crop.scientificName,
      localNames: crop.localNames,
      category: crop.category,
      durationDays: crop.durationDays,
      durationRange: crop.durationRange,
      waterRequirement: crop.waterRequirement,
      expectedYieldMin: crop.yieldPerAcre.minQuintals,
      expectedYieldMax: crop.yieldPerAcre.maxQuintals,
      expectedYieldMean: crop.yieldPerAcre.meanQuintals,
      yieldUnit: 'Quintals / Acre',
      majorRisks: crop.majorRisks,
      climateSuitability: `${crop.tempRange.optimal}, ${crop.waterRequirement}`,
    },
    landPrepAndSowing: {
      steps: crop.landPrepSteps,
      recommendedVarieties: crop.recommendedVarieties,
      seedRatePerAcre: `${crop.seedRatePerAcreKg} kg / acre`,
      totalSeedRequired: `${totalSeedKg} kg`,
      sowingMethod: `Line sowing / drilling at ${crop.spacing}`,
      spacing: crop.spacing,
      sowingDepth: crop.sowingDepth,
      recommendedWindow: crop.recommendedSowingWindow,
      seedTreatment: crop.seedTreatment,
    },
    fertilizerPlan: {
      nutrientRecommendation: {
        n: Math.round(recN),
        p: Math.round(recP),
        k: Math.round(recK),
        unit: `kg for ${areaInAcres.toFixed(1)} acres`,
      },
      commercialProducts,
      organicOptions: [crop.organicManure],
      soilTestAdjustments: soilAdjustments,
      totalEstimatedFertilizerCost: totalFertCost,
    },
    irrigationAndMaintenance: {
      waterRequirementTotalMm: crop.waterRequirement,
      irrigationSchedule: crop.irrigationSchedule,
      weedManagement: crop.weedManagement,
      ipmPractices: crop.ipmPractices,
      weatherPrecautions: [
        'Check 48-hour rainfall forecast before spraying insecticides or applying nitrogen top-dressing to prevent chemical wash-off.',
        'During prolonged cloudy or humid weather (>85% RH), conduct daily scouting for fungal leaf spots.',
        'If heat waves are forecast during flowering or grain fill, give light evening irrigation to reduce canopy temperature.',
      ],
    },
    harvestingAndPostHarvest: {
      expectedHarvestWindow: `${addDays(startDate, crop.durationDays - 5).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} – ${addDays(startDate, crop.durationDays + 10).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      maturitySigns: crop.harvestingAndPostHarvest.maturitySigns,
      harvestMethods: crop.harvestingAndPostHarvest.harvestMethods,
      dryingAndMoisture: crop.harvestingAndPostHarvest.dryingAndStorage[1] || 'Dry to safe moisture level before bagging',
      storageGuidance: crop.harvestingAndPostHarvest.dryingAndStorage,
      marketPrepTips: crop.harvestingAndPostHarvest.marketPrepTips,
    },
    budgetEstimates: {
      expenses: expList,
      totalCost,
      costPerAcre,
      costPerHectare,
      assumedMarketPricePerUnit: assumedPrice,
      priceUnit: '₹ / Quintal',
      expectedProductionMin: minProd,
      expectedProductionMax: maxProd,
      expectedProductionMean: meanProd,
      productionUnit: 'Quintals',
      grossRevenue: grossRev,
      netReturn: netRet,
      breakEvenPrice,
      scenarios,
    },
    calendarTasks,
    predictedYieldMl: mlPrediction,
  };
};
