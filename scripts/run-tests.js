const { calculateRiskExposure } = require('../src/lib/engines/risk-engine');
const { calculatePortfolioMetrics } = require('../src/lib/engines/portfolio-engine');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASSED: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    failed++;
  }
}

console.log('🧪 RUNNING KNOWLEDGE EXCHANGE AUTOMATED ENGINE TESTS...\n');

// TEST 1: RISK CALCULATION
console.log('[1] Testing Risk Calculation Engine...');
const lowRisk = { exposurePercentage: 0.10, winningReturn: 0.10, losingRate: 0.05 };
const highRisk = { exposurePercentage: 0.50, winningReturn: 0.50, losingRate: 0.35 };
const extremeRisk = { exposurePercentage: 0.75, winningReturn: 1.00, losingRate: 0.75 };

const lowExp = calculateRiskExposure(10000, lowRisk);
assert(lowExp.exposedCapital === 1000, 'LOW risk exposed capital on ₹10,000 should be ₹1,000');
assert(lowExp.potentialWin === 100, 'LOW risk potential win should be +₹100 (+10%)');
assert(lowExp.potentialLoss === 50, 'LOW risk potential loss should be -₹50 (-5%)');

const highExp = calculateRiskExposure(10000, highRisk);
assert(highExp.exposedCapital === 5000, 'HIGH risk exposed capital on ₹10,000 should be ₹5,000');
assert(highExp.potentialWin === 2500, 'HIGH risk potential win should be +₹2,500 (+50%)');
assert(highExp.potentialLoss === 1750, 'HIGH risk potential loss should be -₹1,750 (-35%)');

const extremeExp = calculateRiskExposure(10000, extremeRisk);
assert(extremeExp.exposedCapital === 7500, 'EXTREME risk exposed capital on ₹10,000 should be ₹7,500');
assert(extremeExp.potentialWin === 7500, 'EXTREME risk potential win should be +₹7,500 (+100%)');
assert(extremeExp.potentialLoss === 5625, 'EXTREME risk potential loss should be -₹5,625 (-75%)');

// TEST 2: PORTFOLIO METRICS
console.log('\n[2] Testing Portfolio Metrics Engine...');
const winMetrics = calculatePortfolioMetrics(10000, 12500, 2500, 0);
assert(winMetrics.netPnL === 2500, 'Net PnL should be +₹2,500');
assert(winMetrics.returnPercentage === 25, 'Return percentage should be +25%');

const lossMetrics = calculatePortfolioMetrics(10000, 8250, 0, 1750);
assert(lossMetrics.netPnL === -1750, 'Net PnL should be -₹1,750');
assert(lossMetrics.returnPercentage === -17.5, 'Return percentage should be -17.5%');

// SUMMARY
console.log(`\n========================================`);
console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
