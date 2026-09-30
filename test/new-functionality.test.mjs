import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { config, missing, run, upload, accepted, rejects, succeeds, envModule } from './support/harness.mjs';
const report = ['-f', 'report.json', '--format', 'cucumber'];

describe('Local validation of new functionality (actual CLI)', () => {
  for (const value of ['0', '-1', '1.5', 'abc', '1e2', 'Infinity', '9007199254740992', '']) {
    it(`rejects invalid iteration ${JSON.stringify(value)}`, () => {
      rejects(run({ args: [...report, '--mode', 'stp', '--itr', value] }), /positive whole number/);
    });
  }
  it('rejects an invalid configured iteration', () => {
    rejects(run({ args: [...report, '--mode', 'stp'], env: { VANSAH_ITERATION: 'invalid' } }), /positive whole number/);
  });
  for (const args of [['-f', 'report.xml', '--format', 'testng']]) {
    it(`rejects iteration for ${args[0]}`, () => rejects(run({ args: [...args, '--itr', '2'] }), /only for Cucumber/));
  }
  it('rejects iteration without a plan target', () => rejects(run({ args: [...report, '--mode', 'normal', '--itr', '2'] }), /requires an STP or ATP/));
  for (const value of ['success', 'fail', '2', 'constructor', 'toString', '__proto__']) {
    it(`rejects unsupported result ${value} locally`, () => rejects(run({ args: ['-t', 'syntax-only', '-s', value, '-a', 'syntax-only', '--mode', 'normal'] }), /Invalid result/));
  }
  for (const format of ['testng', 'cucumber']) {
    for (const [path, pattern] of [['missing-report.json', /file not found/], ['.', /not a file/]]) {
      it(`${format} rejects ${path}`, () => rejects(run({ args: ['-f', path, '--format', format, '-a', 'syntax-only', '--mode', 'normal'] }), pattern));
    }
  }
  it('saves the configured iteration in isolated user configuration', () => {
    const result = run({ args: ['--itr', config.iteration] }); succeeds(result);
    assert.equal(result.config.VANSAH_ITERATION, String(Number(config.iteration)));
    assert.match(result.output, /Test Plan Iteration/);
  });
  it('stores the actual configured token with private permissions without printing it', () => {
    succeeds(run({ code: `import assert from 'node:assert/strict'; import {statSync} from 'node:fs'; import {homedir} from 'node:os';
      import {setEnvVariable,getEnvVariable} from ${JSON.stringify(envModule)};
      const token = process.env.VANSAH_TOKEN || process.env.TOKEN;
      assert.ok(token, 'Token is required'); await setEnvVariable('VANSAH_TOKEN',token);
      assert.ok(await getEnvVariable('VANSAH_TOKEN') === token, 'Token must round-trip');
      assert.equal(statSync(homedir()+'/.vansah-connect').mode & 0o777,0o700);
      assert.equal(statSync(homedir()+'/.vansah-connect/.env').mode & 0o777,0o600);` }));
  });
});

describe('Live platform acceptance of new result statuses', () => {
  for (const status of ['pass', ' PASSED ', 'n/a-in-progress', 'failed-in-progress', 'passed-in-progress']) {
    it(`platform accepts ${JSON.stringify(status)} for the configured case and issue`, {
      skip: missing('url', 'token', 'project', 'caseKey', 'issue'),
    }, () => accepted(run({ args: ['-t', config.caseKey, '-s', status, '-a', config.issue, '--mode', 'normal'] })));
  }
});

describe('Live Cucumber plan iterations', () => {
  for (const type of ['stp', 'atp']) {
    for (const inline of [false, true]) {
      it(`${type.toUpperCase()} imports the configured report using the ${inline ? 'inline' : 'configured'} iteration`, {
        skip: missing('url', 'token', 'project', 'cucumberReport', type, ...(type === 'atp' ? ['issue'] : [])),
      }, () => accepted(upload([
        '--mode', type, `--${type}`, config[type],
        ...(type === 'atp' ? ['-a', config.issue] : []),
        ...(inline ? ['--itr', config.iteration] : []),
      ]), { cucumber: true }));
    }
  }
});


describe('Single-result plan validation and help', () => {
  const single = ['-t', 'syntax-only', '-s', 'passed'];
  for (const type of ['stp', 'atp']) {
    for (const value of ['0', '-1', '1.5', 'abc', '9007199254740992', '']) {
      it(`${type.toUpperCase()} rejects invalid inline iteration ${JSON.stringify(value)}`, () => {
        rejects(run({ args: [...single, `--${type}`, 'syntax-only', '--itr', value, '-a', 'syntax-only'] }), /positive whole number/);
      });
    }
    it(`${type.toUpperCase()} rejects an invalid saved iteration`, () => {
      rejects(run({ args: [...single, `--${type}`, 'syntax-only', '-a', 'syntax-only'], env: { VANSAH_ITERATION: 'bad' } }), /positive whole number/);
    });
    it(`${type.toUpperCase()} requires a plan key`, () => {
      rejects(run({ args: [...single, '--mode', type, '-a', 'syntax-only'], env: { VANSAH_STP_KEY: undefined, VANSAH_ATP_KEY: undefined } }), /No .* Test Plan key/);
    });
  }
  it('ATP requires an issue or folder context', () => {
    rejects(run({ args: [...single, '--atp', 'syntax-only'] }), /also requires -a/);
  });
  it('normal results reject inline iteration', () => {
    rejects(run({ args: [...single, '-a', 'syntax-only', '--mode', 'normal', '--itr', '2'] }), /requires an STP or ATP/);
  });
  it('rejects repeated iteration arguments', () => {
    rejects(run({ args: [...single, '--stp', 'syntax-only', '--itr', '1', '--itr', '2'] }), /positive whole number/);
  });
  for (const help of ['--help', 'help']) {
    it(`${help} documents single-plan iterations and ATP context`, () => {
      const result = run({ args: [help] }); succeeds(result);
      const text = result.output.replace(/\s+/g, ' ');
      assert.match(text, /Cucumber uploads and single results/);
      assert.match(text, /inline > VANSAH_ITERATION > 1/);
      assert.match(text, /--atp DEMO-P1 -a DEMO-9 --itr 2/);
      assert.equal(result.responses.length, 0);
    });
  }
});

describe('Live single-result STP and ATP iterations', () => {
  function checkPlan(result, type, iteration) {
    accepted(result);
    const request = result.responses.find(response => response.method === 'post').requestBody;
    assert.deepEqual(request.asset, { type: 'plannedRun', key: config[type], iteration });
    assert.equal(request.case.key, config.caseKey);
    assert.equal(request.project.key, config.project);
    assert.equal(request.result.id, 2);
    if (type === 'atp') {
      assert.ok(request.testPlanAssetIdentifier, 'ATP requires the resolved issue/folder identifier');
      assert.ok(result.responses.some(response => response.method === 'get'), 'Resolve ATP context with the platform');
    } else assert.equal(request.testPlanAssetIdentifier, undefined);
  }
  for (const type of ['stp', 'atp']) {
    for (const [source, extra, env, expected] of [
      ['configured', [], {}, Number(config.iteration)],
      ['inline override', ['--itr', config.iteration], { VANSAH_ITERATION: 'invalid-saved-value' }, Number(config.iteration)],
      ['default', [], { VANSAH_ITERATION: undefined }, 1],
    ]) {
      it(`${type.toUpperCase()} single result uses the ${source} iteration`, {
        skip: missing('url', 'token', 'project', 'caseKey', type, ...(type === 'atp' ? ['issue'] : [])),
      }, () => checkPlan(run({ args: ['-t', config.caseKey, '-s', 'pass', `--${type}`, config[type],
        ...(type === 'atp' ? ['-a', config.issue] : []), ...extra], env }), type, expected));
    }
  }
  it('ATP accepts folder-path context', { skip: missing('url', 'token', 'project', 'caseKey', 'atp', 'folder') }, () => {
    checkPlan(run({ args: ['-t', config.caseKey, '-s', 'passed', '--atp', config.atp, '-a', config.folder] }), 'atp', Number(config.iteration));
  });
  it('uses the saved ATP key with an explicit ATP mode and issue', { skip: missing('url', 'token', 'project', 'caseKey', 'atp', 'issue') }, () => {
    checkPlan(run({ args: ['-t', config.caseKey, '-s', 'passed', '--mode', 'atp', '-a', config.issue] }), 'atp', Number(config.iteration));
  });
  it('a normal result ignores the saved iteration and ATP mode when -a is explicit', { skip: missing('url', 'token', 'project', 'caseKey', 'issue') }, () => {
    const result = run({ args: ['-t', config.caseKey, '-s', 'passed', '-a', config.issue], env: { VANSAH_MODE: 'atp', VANSAH_ITERATION: 'invalid' } });
    accepted(result);
    assert.deepEqual(result.responses.find(response => response.method === 'post').requestBody.asset, { type: 'issue', key: config.issue });
  });
  it('does not create a run for an unknown ATP context', { skip: missing('url', 'token', 'project', 'caseKey', 'atp') }, () => {
    const result = run({ args: ['-t', config.caseKey, '-s', 'passed', '--atp', config.atp, '-a', 'nonexistent-test-context-7b69/'] });
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /ATP context .* was not found/);
    assert.ok(result.responses.length > 0);
    assert.ok(result.responses.every(response => response.method === 'get'), 'No run should be posted');
  });
});
