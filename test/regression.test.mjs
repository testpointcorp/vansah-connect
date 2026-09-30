import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { config, missing, root, run, upload, accepted, rejects, succeeds, assertAuthenticated } from './support/harness.mjs';

describe('Environment prerequisites', () => {
  it('loads an explicit API URL, token and project from .env or CI overrides', () => {
    assert.equal(missing('url', 'token', 'project'), false, 'Set VANSAH_URL, VANSAH_TOKEN and VANSAH_PROJECT_KEY');
    assert.ok(['http:', 'https:'].includes(new URL(config.url).protocol));
  });
});

describe('CLI regression and invalid syntax (actual CLI)', () => {
  it('prints help', () => { const result = run({ args: ['--help'] }); succeeds(result); assert.match(result.output, /Test Plan targeting/); });
  it('prints the package version outside the package directory', () => {
    const result = run({ args: ['--version'] }); succeeds(result);
    assert.equal(result.output.trim(), JSON.parse(readFileSync(join(root, 'package/package.json'))).version);
  });
  for (const [name, args, pattern] of [
    ['no command', [], /--help/],
    ['missing format', ['-f', 'report.json'], /--format is required/],
    ['unknown format', ['-f', 'report.json', '--format', 'junit'], /unknown --format/],
    ['invalid mode', ['--mode', 'invalid'], /Invalid values/],
    ['missing result', ['-t', 'syntax-only', '-a', 'syntax-only', '--mode', 'normal'], /needs -s/],
    ['missing single target', ['-t', 'syntax-only', '-s', 'passed', '--mode', 'normal'], /needs -s/],
    ['missing Cucumber target', ['-f', 'report.json', '--format', 'cucumber', '--mode', 'normal'], /needs a target/],
  ]) it(`rejects ${name}`, () => rejects(run({ args }), pattern));
  for (const format of ['testng', 'cucumber']) {
    it(`${format} rejects a missing token`, () => rejects(run({
      args: ['-f', 'report.json', '--format', format, '-a', 'syntax-only', '--mode', 'normal'],
      env: { VANSAH_TOKEN: undefined, TOKEN: undefined },
    }), /no Vansah Connect token/));
  }
  for (const type of ['stp', 'atp']) {
    it(`rejects missing ${type.toUpperCase()} key`, () => rejects(run({
      args: ['-f', 'report.json', '--format', 'cucumber', '--mode', type, '-a', 'syntax-only'],
      env: { VANSAH_STP_KEY: undefined, VANSAH_ATP_KEY: undefined },
    }), /No .* Test Plan key/));
  }
  for (const project of ['', '   ']) {
    it(`rejects ${JSON.stringify(project)} project before sending`, () => rejects(run({
      args: ['-t', 'syntax-only', '-s', 'passed', '-a', 'syntax-only', '--mode', 'normal'],
      env: { VANSAH_PROJECT_KEY: project },
    }), /Project key is missing/));
  }
});

describe('Live single-result regression', () => {
  for (const status of ['n/a', 'na', 'failed', 'passed', 'untested']) {
    it(`platform accepts the original result ${status}`, { skip: missing('url', 'token', 'project', 'caseKey', 'issue') }, () => {
      accepted(run({ args: ['-t', config.caseKey, '-s', status, '-a', config.issue, '--mode', 'normal'] }));
    });
  }
  it('logs a result against the configured folder', { skip: missing('url', 'token', 'project', 'caseKey', 'folder') }, () => {
    accepted(run({ args: ['-t', config.caseKey, '-s', 'passed', '-a', config.folder, '--mode', 'normal'] }));
  });
  it('logs a result against the configured STP', { skip: missing('url', 'token', 'project', 'caseKey', 'stp') }, () => {
    accepted(run({ args: ['-t', config.caseKey, '-s', 'passed', '--mode', 'stp', '--stp', config.stp] }));
  });
  it('accepts the configured token using the legacy TOKEN variable', { skip: missing('url', 'token', 'project', 'caseKey', 'issue') }, () => {
    accepted(run({ args: ['-t', config.caseKey, '-s', 'passed', '-a', config.issue, '--mode', 'normal'], env: { VANSAH_TOKEN: undefined, TOKEN: config.token } }));
  });
});

describe('Live report imports and plan selection', () => {
  for (const target of ['issue', 'folder']) {
    it(`imports the configured report against the ${target}`, { skip: missing('url', 'token', 'project', 'cucumberReport', target) }, () => {
      accepted(upload(['-a', config[target], '--mode', 'normal']), { cucumber: true });
    });
  }
  it('an explicit issue overrides the configured STP mode', { skip: missing('url', 'token', 'project', 'cucumberReport', 'issue', 'stp') }, () => {
    accepted(upload(['-a', config.issue], { VANSAH_MODE: 'stp' }), { cucumber: true });
  });
  it('imports the explicitly configured TestNG report', { skip: missing('url', 'token', 'project', 'testngReport') }, () => {
    accepted(run({ args: ['-f', config.testngReport, '--format', 'testng'] }));
  });
});

describe('Real platform rejection of malformed reports', () => {
  it('rejects malformed XML with an actual HTTP validation response', { skip: missing('url', 'token', 'project') }, t => {
    const result = run({ args: ['-f', join(root, 'test/fixtures/malformed.xml'), '--format', 'testng'] });
    assertAuthenticated(result);
    assert.equal(result.status, 1, result.output);
    assert.equal(result.responses.length, 1, result.output);
    const response = result.responses[0];
    assert.ok([400, 422].includes(response.status), JSON.stringify(response));
    assert.ok(response.data, 'Platform should return error details');
    assert.match(JSON.stringify(response.data), /xml|pars|report|format|file/i, 'Expected a report validation error');
    t.diagnostic(`Actual platform HTTP status: ${response.status}`);
  });
  it('rejects malformed Cucumber JSON', { skip: missing('url', 'token', 'project', 'issue') }, () => {
    const result = run({ args: ['-f', join(root, 'test/fixtures/malformed.json'), '--format', 'cucumber', '-a', config.issue, '--mode', 'normal'] });
    assertAuthenticated(result);
    assert.equal(result.status, 1, result.output); assert.equal(result.responses.length, 1, result.output);
    const response = result.responses[0];
    assert.ok([400, 422].includes(response.status) || (response.status === 200 && response.data?.success === false), JSON.stringify(response));
    assert.match(JSON.stringify(response.data), /json|pars|report|format|file/i, 'Expected a report validation error');
  });
});
