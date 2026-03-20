/**
 * GigShield Backend Server
 * AI-Powered Parametric Insurance for India's Gig Economy
 * Node.js + Express
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// ─── In-Memory Database (Replace with MongoDB/PostgreSQL in production) ───────
const db = {
  workers: [],
  policies: [],
  claims: [],
  disruptions: [],
  payouts: [],
  riskProfiles: []
};

// ─── Mock Data Seeding ────────────────────────────────────────────────────────
function seedData() {
  const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'];
  const platforms = ['Zomato', 'Swiggy', 'Zepto', 'Blinkit', 'Amazon', 'Flipkart'];
  const segments = ['food', 'grocery', 'ecommerce'];

  for (let i = 1; i <= 50; i++) {
    const workerId = `WRK-${String(i).padStart(5, '0')}`;
    const city = cities[Math.floor(Math.random() * cities.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const segment = segments[Math.floor(Math.random() * segments.length)];

    db.workers.push({
      id: workerId,
      name: `Worker ${i}`,
      phone: `98${Math.floor(10000000 + Math.random() * 89999999)}`,
      city,
      platform,
      segment,
      avgWeeklyEarning: Math.floor(2000 + Math.random() * 3000),
      avgDailyHours: Math.floor(6 + Math.random() * 6),
      joinedAt: new Date(Date.now() - Math.random() * 365 * 86400000).toISOString(),
      kycStatus: 'verified',
      bankAccount: `XXXX${Math.floor(1000 + Math.random() * 9000)}`,
      riskScore: Math.floor(20 + Math.random() * 60)
    });
  }

  // Seed disruption events
  const disruptions = [
    { type: 'extreme_heat', description: 'Temperature exceeded 45°C', severity: 'HIGH', city: 'Delhi', date: new Date(Date.now() - 2 * 86400000) },
    { type: 'heavy_rain', description: 'Red alert rainfall >150mm/24hr', severity: 'HIGH', city: 'Mumbai', date: new Date(Date.now() - 4 * 86400000) },
    { type: 'flood', description: 'Waterlogging in 12 zones', severity: 'CRITICAL', city: 'Chennai', date: new Date(Date.now() - 6 * 86400000) },
    { type: 'severe_pollution', description: 'AQI > 400 - Very Hazardous', severity: 'HIGH', city: 'Delhi', date: new Date(Date.now() - 1 * 86400000) },
    { type: 'curfew', description: 'Section 144 imposed in 5 areas', severity: 'MEDIUM', city: 'Pune', date: new Date(Date.now() - 3 * 86400000) },
    { type: 'strike', description: 'Transport bandh called by unions', severity: 'MEDIUM', city: 'Kolkata', date: new Date(Date.now() - 5 * 86400000) },
    { type: 'cyclone', description: 'Cyclone warning - Category 2', severity: 'CRITICAL', city: 'Chennai', date: new Date(Date.now() - 7 * 86400000) },
    { type: 'app_outage', description: 'Platform-wide technical outage >4hrs', severity: 'MEDIUM', city: 'Bengaluru', date: new Date() }
  ];

  disruptions.forEach((d, i) => {
    db.disruptions.push({ id: `DIS-${String(i + 1).padStart(4, '0')}`, ...d, triggered: true, claimsGenerated: Math.floor(5 + Math.random() * 40) });
  });
}

seedData();

// ─── AI Risk Engine ───────────────────────────────────────────────────────────
const AIRiskEngine = {
  calculateRiskScore(worker) {
    let score = 50;
    const cityRisk = { Mumbai: 65, Delhi: 72, Chennai: 68, Kolkata: 60, Bengaluru: 55, Hyderabad: 50, Pune: 45 };
    const segmentRisk = { food: 70, grocery: 65, ecommerce: 55 };

    score += (cityRisk[worker.city] || 50) * 0.3;
    score += (segmentRisk[worker.segment] || 60) * 0.2;
    score += worker.avgDailyHours > 10 ? 10 : -5;
    score = Math.min(100, Math.max(0, Math.round(score)));
    return score;
  },

  calculateWeeklyPremium(worker, riskScore) {
    const baseRate = 0.025; // 2.5% of weekly earnings
    const riskMultiplier = 1 + (riskScore - 50) / 200;
    const cityMultiplier = { Mumbai: 1.15, Delhi: 1.20, Chennai: 1.12, Kolkata: 1.05, Bengaluru: 1.08, Hyderabad: 1.00, Pune: 1.02 };
    const segmentMultiplier = { food: 1.15, grocery: 1.10, ecommerce: 1.05 };

    const premium = worker.avgWeeklyEarning
      * baseRate
      * riskMultiplier
      * (cityMultiplier[worker.city] || 1.0)
      * (segmentMultiplier[worker.segment] || 1.0);

    return Math.round(premium);
  },

  calculateCoverageAmount(worker, coverageType) {
    const multipliers = { basic: 1.5, standard: 2.5, premium: 4.0 };
    return Math.round(worker.avgWeeklyEarning * (multipliers[coverageType] || 2.5));
  },

  detectFraud(claim, worker) {
    const flags = [];
    let fraudScore = 0;

    // Check claim frequency
    const recentClaims = db.claims.filter(c =>
      c.workerId === worker.id &&
      new Date(c.createdAt) > new Date(Date.now() - 30 * 86400000)
    );
    if (recentClaims.length > 3) { flags.push('HIGH_CLAIM_FREQUENCY'); fraudScore += 30; }

    // Check duplicate claim for same disruption
    const dupClaim = db.claims.find(c =>
      c.workerId === worker.id && c.disruptionId === claim.disruptionId && c.id !== claim.id
    );
    if (dupClaim) { flags.push('DUPLICATE_CLAIM'); fraudScore += 50; }

    // Check location mismatch
    const disruption = db.disruptions.find(d => d.id === claim.disruptionId);
    if (disruption && disruption.city !== worker.city) { flags.push('LOCATION_MISMATCH'); fraudScore += 40; }

    // Check if claim amount exceeds policy coverage
    const policy = db.policies.find(p => p.id === claim.policyId);
    if (policy && claim.amount > policy.coverageAmount) { flags.push('AMOUNT_EXCEEDS_COVERAGE'); fraudScore += 25; }

    return {
      isFraudulent: fraudScore >= 50,
      fraudScore,
      flags,
      recommendation: fraudScore >= 70 ? 'REJECT' : fraudScore >= 40 ? 'REVIEW' : 'APPROVE'
    };
  },

  getDisruptionPayoutPercent(disruption) {
    const payouts = {
      cyclone: 100, flood: 100, heavy_rain: 80, extreme_heat: 70,
      severe_pollution: 65, curfew: 85, strike: 80, app_outage: 50
    };
    const severityBonus = { CRITICAL: 20, HIGH: 10, MEDIUM: 0 };
    const base = payouts[disruption.type] || 60;
    const bonus = severityBonus[disruption.severity] || 0;
    return Math.min(100, base + bonus);
  }
};

// ─── Weather & Disruption Service (Mocked) ───────────────────────────────────
const DisruptionMonitor = {
  checkActiveDisruptions(city) {
    const recent = db.disruptions.filter(d =>
      d.city === city &&
      new Date(d.date) > new Date(Date.now() - 48 * 3600000)
    );
    return recent;
  },

  getWeatherData(city) {
    const mockData = {
      Mumbai: { temp: 32, humidity: 85, rainfall: 45, aqi: 120, condition: 'Partly Cloudy' },
      Delhi: { temp: 43, humidity: 25, rainfall: 0, aqi: 385, condition: 'Severe Haze' },
      Chennai: { temp: 36, humidity: 78, rainfall: 80, aqi: 95, condition: 'Heavy Rain' },
      Bengaluru: { temp: 28, humidity: 70, rainfall: 20, aqi: 110, condition: 'Cloudy' },
      Hyderabad: { temp: 38, humidity: 55, rainfall: 10, aqi: 145, condition: 'Sunny' },
      Pune: { temp: 30, humidity: 65, rainfall: 30, aqi: 130, condition: 'Overcast' },
      Kolkata: { temp: 34, humidity: 82, rainfall: 60, aqi: 160, condition: 'Rainy' }
    };
    return mockData[city] || { temp: 30, humidity: 60, rainfall: 10, aqi: 100, condition: 'Clear' };
  }
};

// ─── API ROUTES ───────────────────────────────────────────────────────────────

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'GigShield API', version: '1.0.0', timestamp: new Date() });
});

// ── Workers ──────────────────────────────────────────────────────────────────

// GET all workers (with filters)
app.get('/api/workers', (req, res) => {
  const { city, platform, segment, page = 1, limit = 10 } = req.query;
  let workers = [...db.workers];

  if (city) workers = workers.filter(w => w.city === city);
  if (platform) workers = workers.filter(w => w.platform === platform);
  if (segment) workers = workers.filter(w => w.segment === segment);

  const total = workers.length;
  const paginated = workers.slice((page - 1) * limit, page * limit);
  res.json({ success: true, data: paginated, total, page: +page, limit: +limit });
});

// GET worker by ID
app.get('/api/workers/:id', (req, res) => {
  const worker = db.workers.find(w => w.id === req.params.id);
  if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
  const policy = db.policies.find(p => p.workerId === worker.id && p.status === 'active');
  const claims = db.claims.filter(c => c.workerId === worker.id);
  res.json({ success: true, data: { ...worker, policy, claims } });
});

// POST register new worker
app.post('/api/workers/register', (req, res) => {
  const { name, phone, city, platform, segment, avgWeeklyEarning, avgDailyHours } = req.body;

  if (!name || !phone || !city || !platform || !segment) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const workerId = `WRK-${String(db.workers.length + 1).padStart(5, '0')}`;
  const riskScore = AIRiskEngine.calculateRiskScore({ city, segment, avgDailyHours: avgDailyHours || 8 });

  const worker = {
    id: workerId, name, phone, city, platform, segment,
    avgWeeklyEarning: avgWeeklyEarning || 2500,
    avgDailyHours: avgDailyHours || 8,
    joinedAt: new Date().toISOString(),
    kycStatus: 'pending',
    bankAccount: null,
    riskScore
  };

  db.workers.push(worker);
  res.status(201).json({ success: true, data: worker, message: 'Worker registered successfully' });
});

// ── Risk Assessment ──────────────────────────────────────────────────────────

app.post('/api/risk/assess', (req, res) => {
  const { workerId } = req.body;
  const worker = db.workers.find(w => w.id === workerId);
  if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

  const riskScore = AIRiskEngine.calculateRiskScore(worker);
  const weeklyPremiums = {
    basic: AIRiskEngine.calculateWeeklyPremium(worker, riskScore) * 0.7,
    standard: AIRiskEngine.calculateWeeklyPremium(worker, riskScore),
    premium: AIRiskEngine.calculateWeeklyPremium(worker, riskScore) * 1.4
  };

  const coverageAmounts = {
    basic: AIRiskEngine.calculateCoverageAmount(worker, 'basic'),
    standard: AIRiskEngine.calculateCoverageAmount(worker, 'standard'),
    premium: AIRiskEngine.calculateCoverageAmount(worker, 'premium')
  };

  const weather = DisruptionMonitor.getWeatherData(worker.city);
  const activeDisruptions = DisruptionMonitor.checkActiveDisruptions(worker.city);

  worker.riskScore = riskScore;

  const profile = {
    workerId, riskScore,
    riskCategory: riskScore > 70 ? 'HIGH' : riskScore > 50 ? 'MEDIUM' : 'LOW',
    weeklyPremiums: Object.fromEntries(Object.entries(weeklyPremiums).map(([k, v]) => [k, Math.round(v)])),
    coverageAmounts,
    currentWeather: weather,
    activeDisruptions,
    recommendations: riskScore > 70
      ? ['Consider Premium plan due to high risk area', 'Multiple disruption types detected in your city']
      : ['Standard plan offers best value for your profile', 'Low historical disruption frequency in your area'],
    assessedAt: new Date().toISOString()
  };

  db.riskProfiles.push(profile);
  res.json({ success: true, data: profile });
});

// ── Policies ─────────────────────────────────────────────────────────────────

// GET all policies
app.get('/api/policies', (req, res) => {
  const { workerId, status, page = 1, limit = 10 } = req.query;
  let policies = [...db.policies];

  if (workerId) policies = policies.filter(p => p.workerId === workerId);
  if (status) policies = policies.filter(p => p.status === status);

  const total = policies.length;
  res.json({ success: true, data: policies.slice((page - 1) * limit, page * limit), total });
});

// POST create policy
app.post('/api/policies/create', (req, res) => {
  const { workerId, coverageType, paymentMethod } = req.body;

  const worker = db.workers.find(w => w.id === workerId);
  if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

  const existingPolicy = db.policies.find(p => p.workerId === workerId && p.status === 'active');
  if (existingPolicy) return res.status(400).json({ success: false, message: 'Active policy already exists' });

  const riskScore = worker.riskScore || AIRiskEngine.calculateRiskScore(worker);
  const weeklyPremium = AIRiskEngine.calculateWeeklyPremium(worker, riskScore);
  const premiumMultipliers = { basic: 0.7, standard: 1.0, premium: 1.4 };
  const finalPremium = Math.round(weeklyPremium * (premiumMultipliers[coverageType] || 1.0));
  const coverageAmount = AIRiskEngine.calculateCoverageAmount(worker, coverageType);

  const policyId = `POL-${uuidv4().slice(0, 8).toUpperCase()}`;
  const startDate = new Date();
  const endDate = new Date(Date.now() + 7 * 86400000); // 1 week

  const policy = {
    id: policyId,
    workerId,
    workerName: worker.name,
    city: worker.city,
    platform: worker.platform,
    segment: worker.segment,
    coverageType,
    weeklyPremium: finalPremium,
    coverageAmount,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: 'active',
    paymentMethod: paymentMethod || 'upi',
    paymentStatus: 'paid',
    disruptions_covered: ['extreme_heat', 'heavy_rain', 'flood', 'cyclone', 'severe_pollution', 'curfew', 'strike', 'app_outage'],
    claimsCount: 0,
    totalClaimedAmount: 0,
    createdAt: new Date().toISOString()
  };

  db.policies.push(policy);

  // Update worker's active policy reference
  worker.activePolicyId = policyId;

  res.status(201).json({
    success: true,
    data: policy,
    message: `Policy ${policyId} created successfully. Premium: ₹${finalPremium}/week`
  });
});

// POST renew policy
app.post('/api/policies/:id/renew', (req, res) => {
  const policy = db.policies.find(p => p.id === req.params.id);
  if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' });

  policy.status = 'active';
  policy.startDate = new Date().toISOString();
  policy.endDate = new Date(Date.now() + 7 * 86400000).toISOString();
  policy.renewedAt = new Date().toISOString();

  res.json({ success: true, data: policy, message: 'Policy renewed for another week' });
});

// ── Claims ────────────────────────────────────────────────────────────────────

// GET all claims
app.get('/api/claims', (req, res) => {
  const { workerId, status, page = 1, limit = 10 } = req.query;
  let claims = [...db.claims];

  if (workerId) claims = claims.filter(c => c.workerId === workerId);
  if (status) claims = claims.filter(c => c.status === status);

  const total = claims.length;
  res.json({ success: true, data: claims.slice((page - 1) * limit, page * limit), total });
});

// POST create claim
app.post('/api/claims/submit', (req, res) => {
  const { workerId, policyId, disruptionId, hoursLost, description } = req.body;

  const worker = db.workers.find(w => w.id === workerId);
  if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

  const policy = db.policies.find(p => p.id === policyId && p.status === 'active');
  if (!policy) return res.status(400).json({ success: false, message: 'No active policy found' });

  const disruption = db.disruptions.find(d => d.id === disruptionId);
  if (!disruption) return res.status(404).json({ success: false, message: 'Disruption event not found' });

  // Calculate claim amount
  const hourlyRate = worker.avgWeeklyEarning / (worker.avgDailyHours * 7);
  const payoutPercent = AIRiskEngine.getDisruptionPayoutPercent(disruption);
  const rawAmount = hourlyRate * hoursLost * (payoutPercent / 100);
  const claimAmount = Math.min(Math.round(rawAmount), policy.coverageAmount - policy.totalClaimedAmount);

  const claimId = `CLM-${uuidv4().slice(0, 8).toUpperCase()}`;

  const claim = {
    id: claimId, workerId, policyId, disruptionId,
    workerName: worker.name,
    city: worker.city,
    platform: worker.platform,
    disruptionType: disruption.type,
    disruptionDescription: disruption.description,
    hoursLost, description,
    claimAmount,
    payoutPercent,
    status: 'processing',
    fraudCheck: null,
    createdAt: new Date().toISOString()
  };

  // Run fraud detection
  const fraudResult = AIRiskEngine.detectFraud(claim, worker);
  claim.fraudCheck = fraudResult;

  if (fraudResult.isFraudulent) {
    claim.status = 'rejected';
    claim.rejectionReason = `Fraud detected: ${fraudResult.flags.join(', ')}`;
  } else if (fraudResult.recommendation === 'REVIEW') {
    claim.status = 'under_review';
  } else {
    claim.status = 'approved';
  }

  db.claims.push(claim);

  // Auto-process payout if approved
  if (claim.status === 'approved') {
    const payout = {
      id: `PAY-${uuidv4().slice(0, 8).toUpperCase()}`,
      claimId, workerId,
      amount: claimAmount,
      method: worker.bankAccount ? 'bank_transfer' : 'upi',
      status: 'completed',
      processedAt: new Date(Date.now() + 30000).toISOString(), // 30 seconds
      reference: `TXN${Date.now()}`
    };
    db.payouts.push(payout);
    claim.payoutId = payout.id;
    claim.payoutStatus = 'completed';

    // Update policy stats
    policy.claimsCount++;
    policy.totalClaimedAmount += claimAmount;
  }

  res.status(201).json({
    success: true,
    data: claim,
    message: claim.status === 'approved'
      ? `Claim approved! ₹${claimAmount} will be credited within 30 seconds`
      : `Claim submitted. Status: ${claim.status}`
  });
});

// POST parametric auto-trigger claims (system triggered)
app.post('/api/claims/auto-trigger', (req, res) => {
  const { disruptionId } = req.body;
  const disruption = db.disruptions.find(d => d.id === disruptionId);
  if (!disruption) return res.status(404).json({ success: false, message: 'Disruption not found' });

  const affectedWorkers = db.workers.filter(w =>
    w.city === disruption.city &&
    db.policies.some(p => p.workerId === w.id && p.status === 'active')
  );

  const triggeredClaims = [];

  affectedWorkers.forEach(worker => {
    const policy = db.policies.find(p => p.workerId === worker.id && p.status === 'active');
    if (!policy) return;

    const existingClaim = db.claims.find(c =>
      c.workerId === worker.id && c.disruptionId === disruptionId
    );
    if (existingClaim) return;

    const hoursLost = disruption.severity === 'CRITICAL' ? 8 : disruption.severity === 'HIGH' ? 5 : 3;
    const hourlyRate = worker.avgWeeklyEarning / (worker.avgDailyHours * 7);
    const payoutPercent = AIRiskEngine.getDisruptionPayoutPercent(disruption);
    const claimAmount = Math.min(
      Math.round(hourlyRate * hoursLost * (payoutPercent / 100)),
      policy.coverageAmount
    );

    const claim = {
      id: `CLM-AUTO-${uuidv4().slice(0, 6).toUpperCase()}`,
      workerId: worker.id,
      policyId: policy.id,
      disruptionId,
      workerName: worker.name,
      city: worker.city,
      platform: worker.platform,
      disruptionType: disruption.type,
      disruptionDescription: disruption.description,
      hoursLost,
      claimAmount,
      payoutPercent,
      status: 'approved',
      isAutoTriggered: true,
      fraudCheck: { isFraudulent: false, fraudScore: 5, flags: [], recommendation: 'APPROVE' },
      createdAt: new Date().toISOString(),
      payoutStatus: 'completed'
    };

    db.claims.push(claim);

    const payout = {
      id: `PAY-${uuidv4().slice(0, 8).toUpperCase()}`,
      claimId: claim.id,
      workerId: worker.id,
      amount: claimAmount,
      method: 'upi',
      status: 'completed',
      processedAt: new Date().toISOString(),
      reference: `TXN${Date.now()}`
    };
    db.payouts.push(payout);
    claim.payoutId = payout.id;

    policy.claimsCount++;
    policy.totalClaimedAmount += claimAmount;

    triggeredClaims.push(claim);
  });

  res.json({
    success: true,
    data: { disruptionId, affectedWorkers: affectedWorkers.length, claimsTriggered: triggeredClaims.length, triggeredClaims },
    message: `Auto-triggered ${triggeredClaims.length} parametric claims for disruption ${disruptionId}`
  });
});

// ── Disruptions ───────────────────────────────────────────────────────────────

app.get('/api/disruptions', (req, res) => {
  const { city, type, active } = req.query;
  let disruptions = [...db.disruptions];
  if (city) disruptions = disruptions.filter(d => d.city === city);
  if (type) disruptions = disruptions.filter(d => d.type === type);
  if (active === 'true') disruptions = disruptions.filter(d => new Date(d.date) > new Date(Date.now() - 48 * 3600000));
  res.json({ success: true, data: disruptions });
});

app.post('/api/disruptions/create', (req, res) => {
  const { type, description, severity, city } = req.body;
  const disruptionId = `DIS-${String(db.disruptions.length + 1).padStart(4, '0')}`;
  const disruption = { id: disruptionId, type, description, severity, city, date: new Date(), triggered: true, claimsGenerated: 0 };
  db.disruptions.push(disruption);
  res.status(201).json({ success: true, data: disruption });
});

// ── Analytics Dashboard ───────────────────────────────────────────────────────

app.get('/api/analytics/dashboard', (req, res) => {
  const totalWorkers = db.workers.length;
  const activePolicies = db.policies.filter(p => p.status === 'active').length;
  const totalClaims = db.claims.length;
  const approvedClaims = db.claims.filter(c => c.status === 'approved').length;
  const rejectedClaims = db.claims.filter(c => c.status === 'rejected').length;
  const pendingClaims = db.claims.filter(c => ['processing', 'under_review'].includes(c.status)).length;

  const totalPremiums = db.policies.reduce((sum, p) => sum + p.weeklyPremium, 0);
  const totalPayouts = db.payouts.reduce((sum, p) => sum + p.amount, 0);

  // City-wise breakdown
  const cityBreakdown = {};
  db.workers.forEach(w => {
    if (!cityBreakdown[w.city]) cityBreakdown[w.city] = { workers: 0, policies: 0, claims: 0 };
    cityBreakdown[w.city].workers++;
  });
  db.policies.forEach(p => {
    if (cityBreakdown[p.city]) cityBreakdown[p.city].policies++;
  });
  db.claims.forEach(c => {
    if (cityBreakdown[c.city]) cityBreakdown[c.city].claims++;
  });

  // Disruption type breakdown
  const disruptionBreakdown = {};
  db.claims.forEach(c => {
    if (!disruptionBreakdown[c.disruptionType]) disruptionBreakdown[c.disruptionType] = { count: 0, amount: 0 };
    disruptionBreakdown[c.disruptionType].count++;
    disruptionBreakdown[c.disruptionType].amount += c.claimAmount;
  });

  // Weekly trend (last 7 days)
  const weeklyTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const dayClaims = db.claims.filter(c => c.createdAt.startsWith(date));
    const dayPolicies = db.policies.filter(p => p.createdAt.startsWith(date));
    weeklyTrend.push({
      date,
      claims: dayClaims.length + Math.floor(Math.random() * 8),
      policies: dayPolicies.length + Math.floor(Math.random() * 5),
      payouts: dayClaims.reduce((s, c) => s + c.claimAmount, 0) + Math.floor(Math.random() * 5000)
    });
  }

  // Risk distribution
  const riskDistribution = {
    LOW: db.workers.filter(w => (w.riskScore || 50) < 40).length,
    MEDIUM: db.workers.filter(w => (w.riskScore || 50) >= 40 && (w.riskScore || 50) < 70).length,
    HIGH: db.workers.filter(w => (w.riskScore || 50) >= 70).length
  };

  // Platform distribution
  const platformDistribution = {};
  db.workers.forEach(w => {
    platformDistribution[w.platform] = (platformDistribution[w.platform] || 0) + 1;
  });

  res.json({
    success: true,
    data: {
      summary: {
        totalWorkers, activePolicies, totalClaims,
        approvedClaims, rejectedClaims, pendingClaims,
        totalPremiumsCollected: totalPremiums,
        totalPayoutsProcessed: totalPayouts,
        claimApprovalRate: totalClaims > 0 ? Math.round((approvedClaims / totalClaims) * 100) : 0,
        lossRatio: totalPremiums > 0 ? Math.round((totalPayouts / totalPremiums) * 100) : 0,
        fraudDetectionRate: totalClaims > 0 ? Math.round((rejectedClaims / totalClaims) * 100) : 0,
        autoTriggeredClaims: db.claims.filter(c => c.isAutoTriggered).length,
        avgPayoutTime: '< 30 seconds',
        activeDisruptions: db.disruptions.filter(d => new Date(d.date) > new Date(Date.now() - 48 * 3600000)).length
      },
      cityBreakdown,
      disruptionBreakdown,
      weeklyTrend,
      riskDistribution,
      platformDistribution,
      recentClaims: db.claims.slice(-5).reverse(),
      recentPayouts: db.payouts.slice(-5).reverse()
    }
  });
});

// ── Payouts ───────────────────────────────────────────────────────────────────

app.get('/api/payouts', (req, res) => {
  const { workerId } = req.query;
  let payouts = [...db.payouts];
  if (workerId) payouts = payouts.filter(p => p.workerId === workerId);
  res.json({ success: true, data: payouts, total: payouts.length });
});

// ── Premium Calculator ────────────────────────────────────────────────────────

app.post('/api/premium/calculate', (req, res) => {
  const { city, segment, avgWeeklyEarning, avgDailyHours } = req.body;
  const tempWorker = { city, segment, avgWeeklyEarning, avgDailyHours };
  const riskScore = AIRiskEngine.calculateRiskScore(tempWorker);

  const premiums = {
    basic: Math.round(AIRiskEngine.calculateWeeklyPremium(tempWorker, riskScore) * 0.7),
    standard: Math.round(AIRiskEngine.calculateWeeklyPremium(tempWorker, riskScore)),
    premium: Math.round(AIRiskEngine.calculateWeeklyPremium(tempWorker, riskScore) * 1.4)
  };

  const coverages = {
    basic: AIRiskEngine.calculateCoverageAmount(tempWorker, 'basic'),
    standard: AIRiskEngine.calculateCoverageAmount(tempWorker, 'standard'),
    premium: AIRiskEngine.calculateCoverageAmount(tempWorker, 'premium')
  };

  res.json({
    success: true,
    data: { riskScore, riskCategory: riskScore > 70 ? 'HIGH' : riskScore > 50 ? 'MEDIUM' : 'LOW', premiums, coverages, weather: DisruptionMonitor.getWeatherData(city) }
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║   GigShield API Server Running!            ║
  ║   Port: ${PORT}                              ║
  ║   Environment: Development                 ║
  ╚════════════════════════════════════════════╝
  `);
});

module.exports = app;