const jwt = require('jsonwebtoken');
const http = require('http');
const fs = require('fs');

const token = jwt.sign(
  { id: '70fc361f', email: 'user1@niriksha.gov.in', role: 'INSPECTOR' },
  'niriksha-jwt-secret-key-2024',
  { expiresIn: '7d' }
);

function req(method, path, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3002, path, method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const r = http.request(opts, res => {
      let c = '';
      res.on('data', d => c += d);
      res.on('end', () => resolve({ s: res.statusCode, b: c.substring(0, 600) }));
    });
    r.on('error', e => resolve({ s: 0, b: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

function pass(msg) { console.log('  ✅ PASS:', msg); }
function fail(msg) { console.log('  ❌ FAIL:', msg); }
function warn(msg) { console.log('  ⚠️  WARN:', msg); }

async function run() {
  let r, d;
  console.log('\n========================================');
  console.log('  NIRIKSHA FULL SYSTEM TEST');
  console.log('========================================\n');

  // TEST 1: WatsonX
  console.log('--- #1 WATSONX (IBM GRANITE) ---');
  r = await req('GET', '/api/ai-features/watsonx/health');
  d = JSON.parse(r.b);
  if (d.configured && d.status === 'healthy') pass('WatsonX IBM Granite is LIVE');
  else if (!d.configured) fail('NOT CONFIGURED - WATSONX_API_KEY missing from .env | Status: ' + d.status);
  else fail('Configured but unhealthy: ' + d.status);

  // TEST 2: Fraud Detection (no Math.random)
  console.log('\n--- #2 FRAUD DETECTION (EXIF) ---');
  r = await req('GET', '/api/ai-features/fraud/statistics');
  if (r.s === 200) pass('Fraud endpoint responds');
  else fail('Fraud endpoint failed: ' + r.b);
  r = await req('POST', '/api/ai-features/fraud/comprehensive', { inspectionId: 'nonexistent-id' });
  if (r.b.includes('not found') || r.b.includes('found')) warn('Test with real inspectionId needed. Endpoint: ' + r.s);
  else fail('Unexpected: ' + r.b.substring(0,80));

  // TEST 3: Orchestrator LLM Routing
  console.log('\n--- #3 ORCHESTRATOR LLM ROUTING ---');
  r = await req('GET', '/api/agents/configs');
  d = JSON.parse(r.b);
  if (d.success && d.configs) {
    pass('Agent configs loaded: ' + Object.keys(d.configs).join(', '));
    warn('LLM routing in determineNextAgent() - calls watsonxService.decideNextAgent() but WatsonX not configured - falls back to deterministic');
  } else fail('Agent configs failed: ' + r.b.substring(0,100));

  // TEST 4: Predictive ML
  console.log('\n--- #4 PREDICTIVE INSPECTION ---');
  r = await req('GET', '/api/ai-features/predictive/insights');
  d = JSON.parse(r.b);
  if (d.averageFailureProbability !== undefined) warn('Predictive working but still uses hardcoded weights (no ML library added)');
  else fail('Predictive failed: ' + r.b.substring(0,80));

  // TEST 5: Chat (floating widget backend)
  console.log('\n--- #5 CHAT ASSISTANT (Floating Widget) ---');
  r = await req('POST', '/api/ai-features/chat/ask', { sessionId: 'widget-001', question: 'What is the ORDI score?' });
  d = JSON.parse(r.b);
  if (d.answer) pass('Chat working | Confidence: ' + d.confidence + ' | Answer: ' + d.answer.substring(0,60));
  else fail('Chat failed: ' + r.b.substring(0,100));

  // TEST 7: Violation SLA (frontend page exists, test violations endpoint)
  console.log('\n--- #7 VIOLATION SLA ---');
  r = await req('GET', '/api/inspections');
  d = JSON.parse(r.b);
  if (d.total !== undefined) pass('Inspections endpoint works | Total: ' + d.total);
  else fail('Inspections failed: ' + r.b.substring(0,80));

  // TEST 8: WebSocket
  console.log('\n--- #8 WEBSOCKET (Socket.io) ---');
  const pkg = require('/Users/apple/Desktop/final/Niriksha/backend/package.json');
  if (pkg.dependencies['socket.io']) pass('Socket.io installed: ' + pkg.dependencies['socket.io']);
  else fail('Socket.io NOT installed - websocket live feed not implemented');

  // TEST 10: Architecture page (frontend)
  console.log('\n--- #10 ARCHITECTURE PAGE ---');
  const archExists = fs.existsSync('/Users/apple/Desktop/final/Niriksha/frontend/src/app/architecture/page.tsx');
  if (archExists) pass('Architecture page exists at /architecture');
  else fail('Architecture page missing');

  // WAR ROOM
  console.log('\n--- EXTRAORDINARY: WAR ROOM ---');
  r = await req('GET', '/api/extra/war-room');
  d = JSON.parse(r.b);
  if (r.s === 200) pass('War Room data | Inspectors: ' + d.activeInspectors + ' | Alerts: ' + (d.alertTicker||[]).length);
  else fail('War Room failed: ' + r.b.substring(0,80));

  // AI DEBATE
  console.log('\n--- EXTRAORDINARY: AI DEBATE MODE ---');
  r = await req('POST', '/api/extra/ai-debate', {
    inspectionData: { id: 'x', site: 'Test Facility', violations: 2 },
    checklistData: [{ item: 'Fire Exit Clearance', status: 'NON_COMPLIANT' }]
  });
  if (r.s === 200) {
    d = JSON.parse(r.b);
    pass('AI Debate working | Model1: ' + (d.model1?.verified ? 'verified' : 'not-verified') + ' | Model2: ' + (d.model2?.verified ? 'verified' : 'not-verified') + ' | Agreed: ' + d.consensus?.agreed);
  } else fail('AI Debate failed | Status: ' + r.s + ' | Body: ' + r.b.substring(0,100));

  // META-AUDIT
  console.log('\n--- EXTRAORDINARY: META-AUDIT AGENT ---');
  r = await req('GET', '/api/extra/meta-audit');
  if (r.s === 200) {
    d = JSON.parse(r.b);
    pass('Meta-Audit | Accuracy: ' + d.agentPerformance?.realityVerification?.accuracy + '% | Rec: ' + (d.recommendations||'').substring(0,60));
  } else fail('Meta-Audit failed: ' + r.b.substring(0,80));

  // PREDICTIVE HEATMAP
  console.log('\n--- EXTRAORDINARY: PREDICTIVE HEATMAP ---');
  r = await req('GET', '/api/extra/predictive-heatmap');
  if (r.s === 200) {
    d = JSON.parse(r.b);
    pass('Heatmap | Historical: ' + (d.historical||[]).length + ' sites | Predicted: ' + (d.predicted||[]).length + ' sites | High risk: ' + d.highRiskCount);
  } else fail('Heatmap failed: ' + r.b.substring(0,80));

  // INSPECTION PASSPORT
  console.log('\n--- EXTRAORDINARY: INSPECTION PASSPORT ---');
  r = await req('GET', '/api/inspections?limit=1');
  const firstId = JSON.parse(r.b).inspections?.[0]?.id;
  if (firstId) {
    r = await req('GET', '/api/extra/inspections/' + firstId + '/passport');
    d = JSON.parse(r.b);
    if (d.chain) pass('Passport | Chain: ' + d.chainLength + ' blocks | Root hash: ' + (d.rootHash||'').substring(0,16) + '... | Verified: ' + d.verified);
    else fail('Passport failed: ' + r.b.substring(0,80));
  } else warn('No inspections in DB - passport untestable with real data');

  // COMPLIANCE DNA
  console.log('\n--- EXTRAORDINARY: COMPLIANCE DNA ---');
  r = await req('GET', '/api/sites?limit=1');
  const sitesRaw = JSON.parse(r.b);
  const sid = sitesRaw.sites?.[0]?.id || (Array.isArray(sitesRaw) ? sitesRaw[0]?.id : null);
  if (sid) {
    r = await req('GET', '/api/extra/site/' + sid + '/compliance-dna');
    d = JSON.parse(r.b);
    if (d.dnaScores) pass('DNA | Site: ' + d.siteName + ' | Health: ' + d.overallHealth + '% | Axes: ' + d.dnaScores.length);
    else fail('DNA failed: ' + r.b.substring(0,80));
  } else warn('No sites found: ' + JSON.stringify(sitesRaw).substring(0,80));

  // WHAT-IF
  console.log('\n--- EXTRAORDINARY: WHAT-IF SIMULATOR ---');
  r = await req('POST', '/api/extra/simulate/what-if', { scenario: 'reassign_inspector', inspectorId: '70fc361f', siteId: sid });
  d = JSON.parse(r.b);
  if (d.scenario) pass('What-If | Scenario: ' + d.scenario + ' | Current: ' + d.currentTrustScore + ' → Projected: ' + d.projectedTrustScore);
  else fail('What-If failed: ' + r.b.substring(0,80));

  // TRUST TIMELINE
  console.log('\n--- EXTRAORDINARY: TRUST TIMELINE ---');
  r = await req('GET', '/api/extra/inspector/70fc361f/trust-timeline');
  d = JSON.parse(r.b);
  if (d.currentScore !== undefined) pass('Trust Timeline | Score: ' + d.currentScore + ' | Events: ' + (d.timeline||[]).length + ' | Has plan: ' + !!d.improvementPlan);
  else fail('Trust Timeline failed: ' + r.b.substring(0,80));

  // PWA CHECK
  console.log('\n--- FEATURE: PWA OFFLINE ---');
  const swExists = fs.existsSync('/Users/apple/Desktop/final/Niriksha/frontend/public/sw.js');
  const manifestExists = fs.existsSync('/Users/apple/Desktop/final/Niriksha/frontend/public/manifest.json');
  if (swExists) pass('Service Worker exists (sw.js)');
  else fail('Service Worker missing');
  if (manifestExists) pass('manifest.json exists');
  else fail('manifest.json MISSING - PWA not installable');

  // VOICE
  console.log('\n--- FEATURE: VOICE INTERFACE ---');
  const voiceRoute = fs.existsSync('/Users/apple/Desktop/final/Niriksha/backend/src/routes/voice.ts');
  const hasVoiceComp = fs.readdirSync('/Users/apple/Desktop/final/Niriksha/frontend/src/components/ai').some(f => f.includes('voice'));
  if (voiceRoute || hasVoiceComp) pass('Voice implementation found');
  else fail('Voice NOT implemented - no route or component found');

  console.log('\n========================================');
  console.log('  TEST COMPLETE');
  console.log('========================================\n');
}

run().catch(e => {
  console.error('TEST SCRIPT ERROR:', e.message);
  console.error(e.stack);
});
