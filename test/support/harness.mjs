// Live bridge: repository .env -> isolated CLI process -> real Vansah API.
// HTTP interceptors observe responses; they never replace the transport or response.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

export const root = resolve(import.meta.dirname, '../..');
const require = createRequire(join(root, 'package/package.json'));
const dotenv = require('dotenv');
export const envFile = resolve(root, process.env.VANSAH_TEST_ENV_FILE || '.env');
const fileValues = dotenv.parse(readFileSync(envFile));
const relevant = key => key.startsWith('VANSAH_') || ['TOKEN', 'PROD_URL'].includes(key);
const settings = { ...fileValues, ...Object.fromEntries(Object.entries(process.env).filter(([key]) => relevant(key))) };
export const config = Object.freeze({
  url: settings.VANSAH_URL || settings.PROD_URL,
  token: settings.VANSAH_TOKEN || settings.TOKEN,
  project: settings.VANSAH_PROJECT_KEY,
  caseKey: settings.VANSAH_TEST_CASE_KEY,
  issue: settings.VANSAH_JIRA_ISSUE_KEY,
  folder: settings.VANSAH_FOLDER_PATH,
  stp: settings.VANSAH_STP_KEY,
  atp: settings.VANSAH_ATP_KEY,
  iteration: settings.VANSAH_ITERATION || '1',
  cucumberReport: settings.VANSAH_CUCUMBER_REPORT && resolve(root, settings.VANSAH_CUCUMBER_REPORT),
  testngReport: settings.VANSAH_TESTNG_REPORT && resolve(root, settings.VANSAH_TESTNG_REPORT),
});
const moduleURL = name => pathToFileURL(join(root, 'package', name)).href;
export const envModule = moduleURL('utility/env.js');
export function missing(...keys) {
  const absent = keys.filter(key => !config[key]);
  return absent.length ? `Missing .env settings for: ${absent.join(', ')}` : false;
}
function redact(text) {
  for (const secret of [config.token, settings.TOKEN].filter(Boolean)) text = text.split(secret).join('[REDACTED]');
  return text;
}
export function run({ args, code, env = {}, saved = '', local = '' } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'vansah-live-test-'));
  const home = join(dir, 'home');
  const capture = join(dir, 'responses.jsonl');
  mkdirSync(join(home, '.vansah-connect'), { recursive: true });
  writeFileSync(join(home, '.vansah-connect/.env'), saved, { mode: 0o600 });
  writeFileSync(join(dir, '.env'), local, { mode: 0o600 });
  const preload = join(dir, 'observe.mjs');
  writeFileSync(preload, `
    import { appendFileSync } from 'node:fs';
    import { createRequire } from 'node:module';
    const require = createRequire(${JSON.stringify(moduleURL('package.json'))});
    const {default: axios} = await import(require.resolve('axios/package.json').replace('package.json', 'index.js'));
    const record = response => appendFileSync(${JSON.stringify(capture)}, JSON.stringify({
      status: response?.status ?? null, data: response?.data ?? null,
      method: response?.config?.method,
      requestBody: response?.config?.headers?.['Content-Type'] === 'application/json' ? JSON.parse(response.config.data) : undefined
    }) + '\\n');
    axios.interceptors.response.use(response => { record(response); return response; }, error => {
      record(error.response); return Promise.reject(error);
    });
  `);
  const base = Object.fromEntries(Object.entries(process.env).filter(([key]) => !relevant(key) && !['HOME', 'USERPROFILE', 'NODE_OPTIONS'].includes(key)));
  try {
    const result = spawnSync(process.execPath, ['--import', preload,
      ...(args ? [join(root, 'package/bin/index.js'), ...args] : ['--input-type=module', '-e', code])], {
      cwd: dir, env: { ...base, ...settings, HOME: home, USERPROFILE: home, NO_COLOR: '1', ...env },
      encoding: 'utf8', timeout: 130000, maxBuffer: 2 * 1024 * 1024,
    });
    if (result.error) throw new Error(`Test process failed: ${result.error.code || 'unknown error'}`);
    const read = path => { try { return readFileSync(path, 'utf8'); } catch { return ''; } };
    return { status: result.status, output: redact(result.stdout + result.stderr),
      responses: read(capture).trim().split('\n').filter(Boolean).map(line => JSON.parse(redact(line))),
      config: dotenv.parse(read(join(home, '.vansah-connect/.env'))) };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
export function succeeds(result) { assert.equal(result.status, 0, result.output); }
export function rejects(result, message) {
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, message);
  assert.equal(result.responses.length, 0, 'Local validation should reject before an HTTP response');
}
export function accepted(result, { cucumber = false } = {}) {
  assertAuthenticated(result);
  succeeds(result);
  const uploads = result.responses.filter(response => response.method === 'post');
  assert.equal(uploads.length, 1, 'Expected one real upload response');
  const response = uploads[0];
  assert.equal(response.status, 200, JSON.stringify(response));
  assert.notEqual(response.data?.success, false, JSON.stringify(response));
  if (cucumber) {
    assert.equal(response.data.success, true, JSON.stringify(response));
    assert.equal(response.data.imported, cucumberScenarioCount(), JSON.stringify(response));
    assert.equal(response.data.failed, 0, JSON.stringify(response));
    assert.equal(response.data.skipped, 0, JSON.stringify(response));
  }
}
export function assertAuthenticated(result) {
  for (const response of result.responses) {
    const message = JSON.stringify(response.data);
    assert.ok(![401, 403].includes(response.status) &&
      !/authentication failed|invalid token|token.*invalid|unauthori[sz]ed|forbidden/i.test(message),
    `Vansah rejected authentication (HTTP ${response.status}). Check VANSAH_TOKEN and VANSAH_URL in ${envFile}; the token must belong to that environment.`);
  }
}
// Read the existing report without generating, copying, or changing its contents.
function cucumberScenarioCount() {
  assert.ok(config.cucumberReport, 'Set VANSAH_CUCUMBER_REPORT in .env');
  const report = JSON.parse(readFileSync(config.cucumberReport, 'utf8'));
  assert.ok(Array.isArray(report), 'Expected a Cucumber JSON array of features');
  const count = report.reduce((total, feature) => total +
    (feature.elements || []).filter(element => element.type === 'scenario').length, 0);
  assert.ok(count > 0, 'The configured Cucumber report must contain scenarios');
  return count;
}
export function upload(extra = [], env = {}) {
  cucumberScenarioCount(); // Fail clearly on an invalid configured file before uploading.
  return run({ args: ['-f', config.cucumberReport, '--format', 'cucumber', ...extra], env });
}
