// Read-only audit probes against the actual TypeScript engine and storage code.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(relative) {
  const filename = path.resolve(relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  new Function('require', 'module', 'exports', code)((name) => {
    if (!name.startsWith('$lib/')) return require(name);
    const target = path.resolve('src/lib', name.slice(5));
    return name.endsWith('.json') ? JSON.parse(fs.readFileSync(target, 'utf8')) : load(target + '.ts');
  }, module, module.exports);
  return module.exports;
}
const { estimatePGA, pgaToScore } = load('src/lib/engine/pga.ts');
const { calculateWindPressure, windToScore } = load('src/lib/engine/wind.ts');
const { calculateRisk } = load('src/lib/engine/risk.ts');
const { haversine } = load('src/lib/engine/haversine.ts');
const results = [];
for (const distance of [0, 0.001, 10]) {
  const pga = estimatePGA(7, distance, 'medium');
  const pressure = calculateWindPressure(250, 12, 'C');
  results.push({case: 'distance', distance, pga, pressure,
    earthquakeScore: pgaToScore(pga.pgaG), typhoonScore: windToScore(pressure),
    ...calculateRisk(pgaToScore(pga.pgaG), windToScore(pressure))});
}
results.push({case:'single extreme hazard', ...calculateRisk(100, 0)});
const { generateRecommendations } = load('src/lib/engine/recommendations.ts');
const sample = {site:{latitude:14.5995,longitude:120.9842,faultDistance:10,soilType:'medium'},building:{height:12,floors:3,length:20,width:15,material:'concrete',roofType:'gable',configuration:'regular'},hazard:{magnitude:7,windSpeed:250}};
results.push({case:'moderate result versus low-risk recommendation',...calculateRisk(30,30),recommendations:generateRecommendations(sample,30,30)});
const q = 0.613 * 1.04 * 0.85 * (250 / 3.6) ** 2;
results.push({case:'internal pressure sign comparison, same assumed q',positiveInternal:q*(0.85*0.8-0.18),negativeInternal:q*(0.85*0.8+0.18)});
for (const height of [150, 200, 500]) { try { results.push({case:'height', height, pressure:calculateWindPressure(250,height,'C')}); } catch(error) { results.push({case:'height',height,rejected:error.message}); } }
results.push({case:'wind speed scaling', ratio:calculateWindPressure(200,12,'C')/calculateWindPressure(100,12,'C')});
results.push({case:'distance sanity', samePoint:haversine(0,0,0,0), degreeAtEquator:haversine(0,0,0,1)});
global.localStorage = {getItem:()=>'{broken'};
try { load('src/lib/storage/localStorage.ts').getAssessments(); results.push({case:'corrupt storage',throws:false}); }
catch(error) { results.push({case:'corrupt storage',throws:true,error:error.message}); }
console.log(JSON.stringify(results,null,2));
