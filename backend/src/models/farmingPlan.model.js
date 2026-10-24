import mongoose from 'mongoose';

const farmingPlanSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planTitle: {
      type: String,
      default: 'My Farming Plan',
    },
    cropName: {
      type: String,
      required: true,
      index: true,
    },
    cropVariety: {
      type: String,
      default: '',
    },
    season: {
      type: String,
      default: 'Kharif',
    },
    sowingDate: {
      type: Date,
      default: Date.now,
    },
    farmDetails: {
      location: {
        latitude: { type: Number },
        longitude: { type: Number },
        district: { type: String, default: '' },
        state: { type: String, default: '' },
        placeName: { type: String, default: '' },
      },
      area: {
        value: { type: Number, required: true },
        unit: {
          type: String,
          enum: ['acres', 'hectares', 'guntha', 'bigha'],
          default: 'acres',
        },
      },
      areaInAcres: { type: Number, required: true },
      areaInHectares: { type: Number, required: true },
      soilType: { type: String, default: 'unknown' },
      irrigationType: { type: String, default: 'irrigated' },
      budget: { type: Number, default: 0 },
      preference: {
        type: String,
        enum: ['balanced', 'low_investment', 'high_return', 'low_water', 'short_duration'],
        default: 'balanced',
      },
      soilTest: {
        tested: { type: Boolean, default: false },
        nitrogen: { type: String, enum: ['low', 'medium', 'high', ''], default: '' },
        phosphorus: { type: String, enum: ['low', 'medium', 'high', ''], default: '' },
        potassium: { type: String, enum: ['low', 'medium', 'high', ''], default: '' },
        ph: { type: Number, default: null },
      },
    },
    suitabilityAssessment: {
      score: { type: Number, default: 85 },
      tier: { type: String, default: 'Suitable' },
      isSuitable: { type: Boolean, default: true },
      reasons: [{ type: String }],
      cautions: [{ type: String }],
      alternatives: [{ type: String }],
    },
    cropOverview: {
      scientificName: String,
      localNames: {
        hindi: String,
        marathi: String,
      },
      category: String,
      durationDays: Number,
      durationRange: String,
      waterRequirement: String,
      expectedYieldMin: Number,
      expectedYieldMax: Number,
      expectedYieldMean: Number,
      yieldUnit: String,
      majorRisks: [{ type: String }],
      climateSuitability: String,
    },
    landPrepAndSowing: {
      steps: [{ type: String }],
      recommendedVarieties: [{ type: String }],
      seedRatePerAcre: String,
      totalSeedRequired: String,
      sowingMethod: String,
      spacing: String,
      sowingDepth: String,
      recommendedWindow: String,
      seedTreatment: [{ type: String }],
    },
    fertilizerPlan: {
      nutrientRecommendation: {
        n: Number,
        p: Number,
        k: Number,
        unit: String,
      },
      commercialProducts: [
        {
          name: String,
          quantityKg: Number,
          bags: Number,
          timing: String,
          stage: String,
          method: String,
          estimatedCost: Number,
        },
      ],
      organicOptions: [{ type: String }],
      soilTestAdjustments: [{ type: String }],
      totalEstimatedFertilizerCost: Number,
    },
    irrigationAndMaintenance: {
      waterRequirementTotalMm: String,
      irrigationSchedule: [
        {
          stageName: String,
          daysAfterSowing: Number,
          timingDescription: String,
          waterNeed: String,
          instructions: String,
        },
      ],
      weedManagement: [{ type: String }],
      ipmPractices: [
        {
          pest: String,
          symptoms: String,
          organicRemedy: String,
          chemicalRemedy: String,
        },
      ],
      weatherPrecautions: [{ type: String }],
    },
    harvestingAndPostHarvest: {
      expectedHarvestWindow: String,
      maturitySigns: [{ type: String }],
      harvestMethods: [{ type: String }],
      dryingAndMoisture: String,
      storageGuidance: [{ type: String }],
      marketPrepTips: [{ type: String }],
    },
    budgetEstimates: {
      expenses: [
        {
          category: String,
          name: String,
          estimatedCost: Number,
          costPerAcre: Number,
          notes: String,
        },
      ],
      totalCost: Number,
      costPerAcre: Number,
      costPerHectare: Number,
      assumedMarketPricePerUnit: Number,
      priceUnit: String,
      expectedProductionMin: Number,
      expectedProductionMax: Number,
      expectedProductionMean: Number,
      productionUnit: String,
      grossRevenue: Number,
      netReturn: Number,
      breakEvenPrice: Number,
      scenarios: {
        low: {
          yield: Number,
          production: Number,
          revenue: Number,
          netReturn: Number,
          description: String,
        },
        moderate: {
          yield: Number,
          production: Number,
          revenue: Number,
          netReturn: Number,
          description: String,
        },
        favorable: {
          yield: Number,
          production: Number,
          revenue: Number,
          netReturn: Number,
          description: String,
        },
      },
    },
    calendarTasks: [
      {
        taskId: String,
        stage: String,
        daysAfterSowing: Number,
        scheduledDate: Date,
        title: String,
        category: String,
        priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
        instructions: String,
        completed: { type: Boolean, default: false },
        completedAt: Date,
      },
    ],
    predictedYieldMl: {
      predictedYieldTonnesPerHa: Number,
      predictedYieldQuintalsPerAcre: Number,
      totalProductionQuintals: Number,
      modelUsed: String,
      confidenceScore: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

farmingPlanSchema.index({ farmer: 1, createdAt: -1 });

const FarmingPlan = mongoose.model('FarmingPlan', farmingPlanSchema);
export default FarmingPlan;
