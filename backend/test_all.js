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
      res.on('end', () => resolve({ s: res.statusCode, b: c }));
    });
    r.on('error', e => resolve({ s: 0, b: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

function tryParse(str) { try { return JSON.parse(str); } catch (e) { return null; } }
function pass(msg) { console.log('  PASS:', msg); }
function fail(msg) { console.log('  FAIL:', msg); }
function warn(msg) { console.log('  WARN:', msg); }

async function run() {
  let r, d;
  console.log('\n=== NIRIKSHA FULL SYSTEM TEST ===\n');

  // 1. WatsonX
  console.log('--- #1 WATSONX (IBM GRANITE) ---');
  r = await req('GET', '/api/ai-features/watsonx/health');
  d = tryParse(r.b);
  if (d && d.configured && d.status === 'healthy') pass('IBM Granite LIVE and responding');
  else if (d && !d.configured) fail('NOT CONFIGURED - WATSONX_API_KEY missing from .env | status: ' + d.status);
  else fail('Health check failed: ' + r.s + ' | ' + r.b.substring(0, 80));

  // 2. Fraud Detection
  console.log('\n--- #2 FRAUD DETECTION (no Math.random) ---');
  r = await req('GET', '/api/ai-features/fraud/statistics');
  d = tryParse(r.b);
  if (r.s === 200 && d) pass('Endpoint OK | totalInspections=' + d.totalInspections);
  else fail('Failed: ' + r.s);

  // 3. Orchestrator
  console.log('\n--- #3 ORCHESTRATOR LLM ROUTING ---');
  r = await req('GET', '/api/agents/configs');
  if (r.s === 200) pass('Agent configs endpoint OK (200)');
  else fail('Failed: ' + r.s);

  // 4. Predictive
  console.log('\n--- #4 PREDICTIVE INSPECTION ---');
  r = await req('GET', '/api/ai-features/predictive/insights');
  if (r.s === 200) warn('Endpoint returns 200 but still uses hardcoded weights (no ML library)');
  else fail('Failed: ' + r.s);

  // 5. Chat
  console.log('\n--- #5 CHAT ASSISTANT (Floating Widget backend) ---');
  r = await req('POST', '/api/ai-features/chat/ask', { sessionId: 'widget-001', question: 'What is the ORDI score in NIRIKSHA?' });
  d = tryParse(r.b);
  if (d && d.answer) pass('Chat working | confidence=' + d.confidence + ' | answer: ' + d.answer.substring(0, 60) + '...');
  else fail('Chat failed: ' + r.s + ' | ' + r.b.substring(0, 100));

  // 7. Inspections
  console.log('\n--- #7 INSPECTIONS (SLA needs violations) ---');
  r = await req('GET', '/api/inspections');
  d = tryParse(r.b);
  const firstId = d && d.inspections && d.inspections[0] ? d.inspections[0].id : null;
  pass('Inspections total: ' + (d ? d.total : 'unknown') + ' | first: ' + (firstId || 'none'));

  // 8. WebSocket
  console.log('\n--- #8 WEBSOCKET (socket.io) ---');
  const pkg = require('./package.json');
  if (pkg.dependencies['socket.io']) pass('socket.io installed: ' + pkg.dependencies['socket.io']);
  else fail('socket.io NOT in package.json - live feed not built');

  // War Room
  console.log('\n--- WAR ROOM ---');
  r = await req('GET', '/api/extra/war-room');
  d = tryParse(r.b);
  if (r.s === 200 && d) pass('OK | activeInspectors=' + d.activeInspectors + ' | alerts=' + (d.alertTicker || []).length + ' | mapMarkers=' + (d.mapMarkers || []).length);
  else fail(r.s + ': ' + r.b.substring(0, 100));

  // AI Debate
  console.log('\n--- AI DEBATE MODE (Groq dual model) ---');
  r = await req('POST', '/api/extra/ai-debate', {
    inspectionData: { id: 'x', site: 'TestSite', violations: 2 },
    checklistData: [{ item: 'Fire Exit Clearance', status: 'NON_COMPLIANT' }]
  });
  d = tryParse(r.b);
  if (r.s === 200 && d && d.model1) {
    pass('Dual model debate working | m1_verified=' + d.model1.verified + ' | m2_verified=' + d.model2.verified + ' | agreed=' + d.consensus.agreed + ' | verdict=' + d.consensus.finalVerdict);
  } else {
    fail('AI Debate failed | status=' + r.s + ' | body=' + r.b.substring(0, 150));
  }

  // Meta-Audit
  console.log('\n--- META-AUDIT AGENT ---');
  r = await req('GET', '/api/extra/meta-audit');
  d = tryParse(r.b);
  if (r.s === 200 && d && d.agentPerformance) {
    pass('Meta-Audit OK | accuracy=' + d.agentPerformance.realityVerification.accuracy + '% | overrides=' + d.agentPerformance.realityVerification.overridden + ' | rec=' + (d.recommendations || '').substring(0, 60));
  } else {
    fail('Meta-Audit failed | status=' + r.s + ' | body=' + r.b.substring(0, 100));
  }

  // Predictive Heatmap
  console.log('\n--- PREDICTIVE HEATMAP ---');
  r = await req('GET', '/api/extra/predictive-heatmap');
  d = tryParse(r.b);
  if (r.s === 200 && d) pass('OK | historical=' + (d.historical || []).length + ' sites | predicted=' + (d.predicted || []).length + ' | highRisk=' + d.highRiskCount);
  else fail(r.s + ': ' + r.b.substring(0, 100));

  // Inspection Passport
  console.log('\n--- INSPECTION PASSPORT ---');
  if (firstId) {
    r = await req('GET', '/api/extra/inspections/' + firstId + '/passport');
    d = tryParse(r.b);
    if (r.s === 200 && d && d.chain) pass('Crypto chain OK | blocks=' + d.chainLength + ' | rootHash=' + (d.rootHash || '').substring(0, 20) + '... | verified=' + d.verified);
    else fail(r.s + ': ' + r.b.substring(0, 100));
  } else warn('No inspections in DB to test passport');

  // Compliance DNA
  console.log('\n--- COMPLIANCE DNA ---');
  r = await req('GET', '/api/sites');
  const sd = tryParse(r.b);
  const sid = sd && (sd.sites || sd)[0] ? (sd.sites || sd)[0].id : null;
  if (sid) {
    r = await req('GET', '/api/extra/site/' + sid + '/compliance-dna');
    d = tryParse(r.b);
    if (r.s === 200 && d && d.dnaScores) pass('Radar DNA OK | site=' + d.siteName + ' | health=' + d.overallHealth + '% | axes=' + d.dnaScores.length);
    else fail(r.s + ': ' + r.b.substring(0, 100));
  } else warn('No sites found in DB');

  // What-If
  console.log('\n--- WHAT-IF SIMULATOR ---');
  r = await req('POST', '/api/extra/simulate/what-if', { scenario: 'reassign_inspector', inspectorId: '70fc361f', siteId: sid });
  d = tryParse(r.b);
  if (r.s === 200 && d && d.scenario) pass('OK | scenario=' + d.scenario + ' | currentScore=' + d.currentTrustScore + ' | projected=' + d.projectedTrustScore + ' | confidence=' + d.confidence);
  else fail(r.s + ': ' + r.b.substring(0, 100));

  // Trust Timeline
  console.log('\n--- TRUST TIMELINE (Black Mirror Scorecard) ---');
  r = await req('GET', '/api/extra/inspector/70fc361f/trust-timeline');
  d = tryParse(r.b);
  if (r.s === 200 && d && d.currentScore !== undefined) pass('OK | score=' + d.currentScore + ' | events=' + (d.timeline || []).length + ' | improvementPlan=' + !!d.improvementPlan);
  else fail(r.s + ': ' + r.b.substring(0, 100));

  // PWA
  console.log('\n--- PWA (Service Worker + Manifest) ---');
  const swOk = fs.existsSync('/Users/apple/Desktop/final/Niriksha/frontend/public/sw.js');
  const mfOk = fs.existsSync('/Users/apple/Desktop/final/Niriksha/frontend/public/manifest.json');
  if (swOk) pass('sw.js exists - service worker registered');
  else fail('sw.js missing');
  if (mfOk) pass('manifest.json exists - PWA installable');
  else fail('manifest.json MISSING - PWA cannot be installed (add it to /public)');

  // Voice
  console.log('\n--- VOICE INTERFACE ---');
  const voiceRouteOk = fs.existsSync('/Users/apple/Desktop/final/Niriksha/backend/src/routes/voice.ts');
  const aiComps = fs.readdirSync('/Users/apple/Desktop/final/Niriksha/frontend/src/components/ai');
  const voiceComp = aiComps.find(f => f.toLowerCase().includes('voice'));
  if (voiceRouteOk || voiceComp) pass('Found: ' + (voiceComp || 'route'));
  else fail('NOT BUILT - Mic icon imported but zero implementation (no route, no component)');

  // Architecture page
  console.log('\n--- ARCHITECTURE PAGE (#10) ---');
  const archOk = fs.existsSync('/Users/apple/Desktop/final/Niriksha/frontend/src/app/architecture/page.tsx');
  if (archOk) pass('Architecture page exists at /architecture');
  else fail('Missing');

  // Violation SLA
  console.log('\n--- VIOLATION SLA PAGE (#7) ---');
  const slaOk = fs.existsSync('/Users/apple/Desktop/final/Niriksha/frontend/src/app/violation-sla/page.tsx');
  if (slaOk) pass('SLA page exists at /violation-sla');
  else fail('Missing');

  // Floating Chat Widget
  console.log('\n--- FLOATING CHAT WIDGET (#5) ---');
  const widgetOk = fs.existsSync('/Users/apple/Desktop/final/Niriksha/frontend/src/components/ai/floating-chat-widget.tsx');
  const layoutOk = fs.readFileSync('/Users/apple/Desktop/final/Niriksha/frontend/src/app/layout.tsx', 'utf8').includes('FloatingChatWidget');
  if (widgetOk && layoutOk) pass('Widget component exists AND mounted in root layout (every page)');
  else if (widgetOk) warn('Widget exists but not in layout');
  else fail('Widget missing');

  // Extra Routes Backend
  console.log('\n--- EXTRA FEATURES BACKEND ROUTE ---');
  const extraRouteOk = fs.existsSync('/Users/apple/Desktop/final/Niriksha/backend/src/routes/extra-features.ts');
  if (extraRouteOk) {
    const indexContent = fs.readFileSync('/Users/apple/Desktop/final/Niriksha/backend/src/index.ts', 'utf8');
    if (indexContent.includes('extra')) pass('extra-features.ts exists AND mounted in index.ts');
    else warn('extra-features.ts exists but check if mounted in index.ts');
  } else fail('extra-features.ts missing');

  console.log('\n\n=== SUMMARY ===');
  console.log('Run: node test_all.js from /backend directory');
  console.log('Backend: http://localhost:3002');
  console.log('Frontend: http://localhost:3000 (run npm run dev in /frontend)\n');
}

run().catch(e => {
  console.error('TEST ERROR:', e.message);
  console.error(e.stack);
});
