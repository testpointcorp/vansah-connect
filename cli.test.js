import { expect } from "chai";
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import dotenv from "dotenv";
import { sendResult, sendTestCaseResult, sendCucumberResult } from "./api/sendresults.js";

dotenv.config();

// ---------------------------------------------------------------------------
// Config from .env - integration tests run only when VANSAH_TOKEN is set, and
// are skipped (not failed) otherwise. Copy env.example to .env to enable them.
// ---------------------------------------------------------------------------
const TOKEN    = process.env.VANSAH_TOKEN;
const PROJECT  = process.env.VANSAH_PROJECT_KEY;
const FOLDER   = process.env.VANSAH_FOLDER_PATH;
const ISSUE    = process.env.VANSAH_JIRA_ISSUE_KEY;
const CASE     = process.env.VANSAH_TEST_CASE_KEY;
const STP      = process.env.VANSAH_STP_KEY;
const ATP      = process.env.VANSAH_ATP_KEY;
const ATP_CTX  = process.env.VANSAH_ATP_ASSET_TYPE === "issue" ? ISSUE : FOLDER;

const RUN_API = Boolean(TOKEN);
const apiIt = RUN_API ? it : it.skip;

const BIN = path.resolve(process.cwd(), "bin/index.js");
const FIXTURES = path.join(os.tmpdir(), "vansah-connect-tests");
const CUCUMBER_JSON = path.join(FIXTURES, "cucumber.json");
const TESTNG_XML = path.join(FIXTURES, "testng.xml");

// Run the CLI as a child process so its process.exit() calls don't kill mocha.
// Env is scrubbed of VANSAH_* so CLI tests are deterministic regardless of .env.
function runCli(args, extraEnv = {}) {
  const env = {};
  for (const k of Object.keys(process.env)) {
    if (!k.startsWith("VANSAH_")) env[k] = process.env[k];
  }
  env.HOME = FIXTURES;         // no saved ~/.vansah-connect/.env
  env.USERPROFILE = FIXTURES;
  Object.assign(env, extraEnv);
  try {
    const stdout = execFileSync("node", [BIN, ...args], { cwd: FIXTURES, env, encoding: "utf8" });
    return { code: 0, stdout, stderr: "" };
  } catch (e) {
    return { code: e.status, stdout: e.stdout || "", stderr: e.stderr || "" };
  }
}

before(function () {
  fs.mkdirSync(FIXTURES, { recursive: true });

  // Cucumber report: one passing scenario tagged with the Vansah test case key.
  const cucumber = [
    {
      uri: "features/demo.feature",
      name: "Demo",
      elements: [
        {
          name: "A passing scenario",
          type: "scenario",
          tags: [{ name: `@${CASE || "DEMO-C1"}` }],
          steps: [
            { keyword: "Given ", name: "a precondition", result: { status: "passed", duration: 1000 } },
            { keyword: "Then ", name: "an assertion holds", result: { status: "passed", duration: 1000 } },
          ],
        },
      ],
    },
  ];
  fs.writeFileSync(CUCUMBER_JSON, JSON.stringify(cucumber, null, 2));

  // TestNG report: reuse the repo fixture's (schema-valid, TestNG-exported)
  // structure, retargeting every Case Key / Tested Issue in both test methods
  // to the .env values so the import lands in the configured space.
  let testng = fs.readFileSync(path.resolve(process.cwd(), "testng-report.xml"), "utf8");
  if (CASE)  testng = testng.split("PVT-C500").join(CASE).split("PS-C193").join(CASE);
  if (ISSUE) testng = testng.split("PVT-4").join(ISSUE).split("PS-85").join(ISSUE);
  fs.writeFileSync(TESTNG_XML, testng);
});

// ===========================================================================
// CLI validation - no network, deterministic, always run
// ===========================================================================
describe("CLI: help & config", function () {
  it("--help lists the Test Plan targeting group", function () {
    const { code, stdout } = runCli(["--help"]);
    expect(code).to.equal(0);
    expect(stdout).to.contain("Test Plan targeting");
    expect(stdout).to.contain("--show-config");
  });

  it("--show-config prints the effective config with masked token", function () {
    const { code, stdout } = runCli(["--show-config"], {
      VANSAH_TOKEN: "abcd12345678wxyz",
      VANSAH_PROJECT_KEY: "DEMO",
      VANSAH_MODE: "stp",
      VANSAH_STP_KEY: "DEMO-P9",
    });
    expect(code).to.equal(0);
    expect(stdout).to.contain("DEMO");
    expect(stdout).to.contain("Mode");
    expect(stdout).to.contain("DEMO-P9");
    expect(stdout).to.not.contain("abcd12345678wxyz"); // token must be masked
  });
});

describe("CLI: -f report validation", function () {
  it("requires --format with -f", function () {
    const { code, stderr } = runCli(["-f", TESTNG_XML]);
    expect(code).to.equal(1);
    expect(stderr).to.contain("--format is required");
  });

  it("rejects an unknown --format value", function () {
    const { code, stderr } = runCli(["-f", TESTNG_XML, "--format", "xml"]);
    expect(code).to.equal(1);
    expect(stderr).to.contain("unknown --format");
  });

  it("cucumber upload needs a target (-a or --mode)", function () {
    const { code, stderr } = runCli(["-f", CUCUMBER_JSON, "--format", "cucumber"], {
      VANSAH_TOKEN: "dummy",
      VANSAH_PROJECT_KEY: "DEMO",
    });
    expect(code).to.equal(1);
    expect(stderr.toLowerCase()).to.contain("target");
  });

  it("cucumber ATP requires -a context", function () {
    const { code, stderr } = runCli(
      ["-f", CUCUMBER_JSON, "--format", "cucumber", "--mode", "atp", "--atp", "DEMO-P8"],
      { VANSAH_TOKEN: "dummy", VANSAH_PROJECT_KEY: "DEMO" }
    );
    expect(code).to.equal(1);
    expect(stderr).to.contain("-a");
  });
});

describe("CLI: -t single result validation", function () {
  it("blocks Advanced Test Plans for single results", function () {
    const { code, stderr } = runCli(
      ["-t", "DEMO-C50", "-s", "passed", "--mode", "atp", "--atp", "DEMO-P8"],
      { VANSAH_TOKEN: "dummy", VANSAH_PROJECT_KEY: "DEMO" }
    );
    expect(code).to.equal(1);
    expect(stderr).to.contain("not supported for single results");
  });

  it("requires a target when none is given", function () {
    const { code, stderr } = runCli(["-t", "DEMO-C50", "-s", "passed"], {
      VANSAH_TOKEN: "dummy",
      VANSAH_PROJECT_KEY: "DEMO",
    });
    expect(code).to.equal(1);
    expect(stderr.toLowerCase()).to.contain("target");
  });
});

// ===========================================================================
// API payload - no network, always run
// ===========================================================================
describe("API: input validation (no network)", function () {
  it("rejects an invalid result value before calling the API", async function () {
    const res = await sendTestCaseResult("DEMO-C50", "not-a-real-result", "DEMO-9", "any-token");
    expect(res.status).to.equal(400);
    expect(res.data.message).to.match(/invalid result/i);
  });
});

// ===========================================================================
// API integration - hit the real Vansah API using .env (skipped without token)
// ===========================================================================
describe("API: TestNG upload", function () {
  this.timeout(30000);
  // Verifies our upload path - multipart form-data, the /testCase/import/XML
  // endpoint, and the auth header. A full 200 additionally requires every Case
  // Key / Tested Issue embedded in the report to resolve inside the target
  // space, which is test-data (not code) and not guaranteed for a fixture, so we
  // assert the request was accepted and authorized and got a Vansah JSON reply.
  apiIt("reaches the import endpoint and is authorized", async function () {
    const res = await sendResult(TESTNG_XML, TOKEN);
    expect(res, "no response - transport failed").to.have.property("status");
    expect(res.status, "endpoint/auth failure: " + JSON.stringify(res.data)).to.not.be.oneOf([401, 403, 404]);
    expect(res.data).to.be.an("object");
    expect(res.data.message).to.be.a("string");
  });
});

describe("API: single Test Case result", function () {
  this.timeout(30000);

  apiIt("logs a result against a Jira issue", async function () {
    const res = await sendTestCaseResult(CASE, "passed", ISSUE, TOKEN);
    expect(res.status, JSON.stringify(res.data)).to.equal(200);
  });

  apiIt("logs a result against a Test Folder", async function () {
    const res = await sendTestCaseResult(CASE, "failed", FOLDER, TOKEN);
    expect(res.status, JSON.stringify(res.data)).to.equal(200);
  });

  apiIt("logs a result against a Standard Test Plan", async function () {
    if (!STP) return this.skip();
    const res = await sendTestCaseResult(CASE, "passed", null, TOKEN, { type: "stp", key: STP });
    expect(res.status, JSON.stringify(res.data)).to.equal(200);
  });
});

describe("API: Cucumber upload", function () {
  this.timeout(30000);

  apiIt("uploads against a Jira issue", async function () {
    const res = await sendCucumberResult(CUCUMBER_JSON, ISSUE, TOKEN);
    expect(res.status, JSON.stringify(res.data)).to.equal(200);
    expect(res.data.success).to.equal(true);
  });

  apiIt("uploads against a Test Folder", async function () {
    const res = await sendCucumberResult(CUCUMBER_JSON, FOLDER, TOKEN);
    expect(res.status, JSON.stringify(res.data)).to.equal(200);
    expect(res.data.success).to.equal(true);
  });

  apiIt("uploads against a Standard Test Plan", async function () {
    if (!STP) return this.skip();
    const res = await sendCucumberResult(CUCUMBER_JSON, null, TOKEN, { type: "stp", key: STP });
    expect(res.status, JSON.stringify(res.data)).to.equal(200);
  });

  apiIt("uploads against an Advanced Test Plan (with context)", async function () {
    if (!ATP) return this.skip();
    const res = await sendCucumberResult(CUCUMBER_JSON, ATP_CTX, TOKEN, { type: "atp", key: ATP });
    expect(res.status, JSON.stringify(res.data)).to.equal(200);
  });
});
