/**
 * Calculate solar energy output.
 * @param {number} irradiance - Solar irradiance in W/m^2
 * @param {number} area - Panel area in m^2
 * @param {number} efficiency - Panel efficiency (0-1)
 * @returns {number} Energy in kWh
 */
function calculateSolarEnergy(irradiance, area, efficiency) {
  return (irradiance * area * efficiency) / 1000;
}

/**
 * Calculate wind energy output using simplified power equation.
 * Assumes rotor radius ~2.82m (area = PI * 25 m^2).
 * @param {number} windSpeed - Wind speed in m/s
 * @returns {number} Energy in kWh
 */
function calculateWindEnergy(windSpeed) {
  const airDensity = 1.225; // kg/m^3
  const rotorArea = Math.PI * 25; // m^2
  return (0.5 * airDensity * rotorArea * Math.pow(windSpeed, 3)) / 1000;
}

/**
 * Calculate fairness score as the standard deviation of cut amounts.
 * Lower value means fairer distribution.
 * @param {Array} distributions - Array of distribution objects with cutAmount
 * @returns {number} Standard deviation of cut amounts
 */
function calculateFairnessScore(distributions) {
  if (!distributions || distributions.length === 0) return 0;

  const cuts = distributions.map((d) => d.cutAmount || 0);
  const mean = cuts.reduce((sum, c) => sum + c, 0) / cuts.length;
  const variance = cuts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / cuts.length;

  return Math.sqrt(variance);
}

/**
 * Generate realistic mock consumption based on time of day.
 * @param {number} hour - Hour of day (0-23)
 * @returns {number} Energy consumption in kWh
 */
function generateMockConsumption(hour) {
  // Base load: 0.5 kWh
  let base = 0.5;

  // Morning peak (6-9): cooking, getting ready
  if (hour >= 6 && hour <= 9) {
    base += 1.5 + Math.random() * 1.0;
  }
  // Midday low (10-16): most people at work
  else if (hour >= 10 && hour <= 16) {
    base += 0.5 + Math.random() * 0.5;
  }
  // Evening peak (17-22): heaviest usage
  else if (hour >= 17 && hour <= 22) {
    base += 2.5 + Math.random() * 1.5;
  }
  // Night (23-5): minimal usage
  else {
    base += 0.2 + Math.random() * 0.3;
  }

  return Math.round(base * 100) / 100;
}

/**
 * Generate realistic mock generation data based on time of day.
 * @param {number} hour - Hour of day (0-23)
 * @returns {{ solarEnergy: number, windEnergy: number, totalEnergy: number }}
 */
function generateMockGeneration(hour) {
  // Solar: follows bell curve peaking at noon
  let solarEnergy = 0;
  if (hour >= 6 && hour <= 18) {
    const peakHour = 12;
    const spread = 4;
    const factor = Math.exp(-Math.pow(hour - peakHour, 2) / (2 * spread * spread));
    solarEnergy = factor * 50 + Math.random() * 5; // Max ~50 kWh at noon
  }

  // Wind: somewhat random but tends to be stronger at night
  let windBase = 10 + Math.random() * 15;
  if (hour >= 22 || hour <= 5) {
    windBase += 5 + Math.random() * 10;
  }
  const windEnergy = Math.round(windBase * 100) / 100;

  solarEnergy = Math.round(solarEnergy * 100) / 100;
  const totalEnergy = Math.round((solarEnergy + windEnergy) * 100) / 100;

  return { solarEnergy, windEnergy, totalEnergy };
}

module.exports = {
  calculateSolarEnergy,
  calculateWindEnergy,
  calculateFairnessScore,
  generateMockConsumption,
  generateMockGeneration,
};
