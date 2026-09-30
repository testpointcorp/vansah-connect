#!/usr/bin/env node
import yargs from 'yargs';
import {readFileSync} from 'node:fs';
import {result,testCaseResult,cucumberResult} from '../utility/validation.js';
import {setEnvVariable,getEnvVariable} from '../utility/env.js';

const cfgGroup = "Configuration (saved to ~/.vansah-connect/.env):";
const uploadGroup = "Upload a report (-f):";
const resultGroup = "Log a single result / target asset:";
const planGroup = "Test Plan targeting (mode stp/atp):";

// Resolve the Test Plan target for a run, or null for a normal issue/folder run.
// Precedence:
//   1. Inline --mode / --stp / --atp on the command always wins.
//   2. An explicit -a asset means a normal "quick run" - the saved VANSAH_MODE is
//      ignored so a sticky stp/atp mode never hijacks an issue/folder run.
//   3. Otherwise fall back to the saved VANSAH_MODE.
// Mode only ever applies to stp/atp; anything else resolves to no plan (null).
async function resolvePlanTarget(options){
  let mode;
  if(options.mode){ mode = options.mode; }
  else if(options.stp !== undefined){ mode = "stp"; }
  else if(options.atp !== undefined){ mode = "atp"; }
  else if(options.assetKey){ mode = "normal"; }
  else { mode = (await getEnvVariable("VANSAH_MODE")) || "normal"; }
  mode = `${mode}`.toLowerCase();
  if(mode !== "stp" && mode !== "atp"){ return null; }
  const key = mode === "atp"
    ? (options.atp || await getEnvVariable("VANSAH_ATP_KEY"))
    : (options.stp || await getEnvVariable("VANSAH_STP_KEY")); 
    return { type: mode, key, iteration: iterationValue(options.itr ?? await getEnvVariable("VANSAH_ITERATION") ?? 1) };
}

const options = yargs
  .scriptName("vansah-connect")
  .command("help", "Show commands and examples", () => {}, () => { yargs.showHelp(); process.exit(0); })
  .usage(
    "Vansah Connect - publish automated test results to Vansah Test Management for Jira.\n\n" +
    "Usage:\n" +
    "  vansah-connect -c <token>                                   Save your Vansah Connect token\n" +
    "  vansah-connect -v <url>                                     Save your Vansah API URL\n" +
    "  vansah-connect -p <projectKey>                              Save your Vansah Space (Jira project) key\n" +
    "  vansah-connect -f <report> --format <testng|cucumber> [-a <asset>]   Upload an automation report\n" +
    "  vansah-connect -t <caseKey> -s <result> -a <asset>          Log a single Test Case result\n" +
    "  vansah-connect --mode stp|atp ...                           Target a Standard/Advanced Test Plan"
  )
  .option("c", { alias: "connectToken", describe: "Save your Vansah Connect (API) token", type: "string", group: cfgGroup })
  .option("v", { alias: "vansahAPIUrl", describe: "Save your Vansah API URL (default https://prod.vansah.com)", type: "string", group: cfgGroup })
  .option("p", { alias: "projectKey", describe: "Save your Vansah Space Key / Jira project key (e.g. DEMO)", type: "string", group: cfgGroup })
  .option("environment", { alias: "env", describe: "Save the tested environment name (e.g. UAT, SYS)", type: "string", group: cfgGroup })
  .option("sprint", { describe: "Save the sprint name to associate with runs", type: "string", group: cfgGroup })
  .option("release", { describe: "Save the release name to associate with runs", type: "string", group: cfgGroup })
  .option("f", { alias: "filePath", describe: "Path to the automation report to upload", type: "string", group: uploadGroup })
  .option("format", { describe: "Report format for -f (required with -f): testng | cucumber", type: "string", group: uploadGroup })
  .option("t", { alias: "testCaseKey", describe: "Test Case key to log a result for (e.g. DEMO-C50)", type: "string", group: resultGroup })
  .option("s", { alias: "testCaseResult", describe: "Result value: passed (or pass) | failed | n/a | untested | n/a-in-progress | failed-in-progress | passed-in-progress", type: "string", group: resultGroup })
  .option("a", { alias: "assetKey", describe: "Jira Issue key (DEMO-9) or Test Folder path ('regression/login/'). Required for -t and for --format cucumber unless --mode stp is used", type: "string", group: resultGroup })
  .option("mode", { describe: "Plan target: stp (Standard Test Plan) or atp (Advanced Test Plan); normal = issue/folder. Saved when used alone. Passing -a on a run forces a normal quick run regardless of the saved mode", type: "string", choices: ["normal", "stp", "atp"], group: planGroup })
  .option("stp", { describe: "Standard Test Plan key (e.g. DEMO-P2). Saved when used alone", type: "string", group: planGroup })
  .option("itr", { describe: "STP/ATP iteration for Cucumber uploads and single results. Positive whole number; inline > VANSAH_ITERATION > 1. Must already exist in the plan", type: "string", group: planGroup })
  .option("atp", { describe: "Advanced Test Plan key (e.g. DEMO-P1). Saved when used alone", type: "string", group: planGroup })
  .example('vansah-connect -c "$VANSAH_TOKEN"', "Save your Connect token")
  .example("vansah-connect -p DEMO", "Save your Space (project) key")
  .example("vansah-connect --mode stp --stp DEMO-P2", "Save a Standard Test Plan target")
  .example("vansah-connect --environment UAT --sprint 'Sprint 1' --release v1.2", "Save run properties")
  .example("vansah-connect --itr 1", "Save the plan iteration for Cucumber and single results")
  .example("vansah-connect -f ./cucumber.json --format cucumber --stp DEMO-P2 --itr 2", "Upload to Standard Test Plan iteration 2")
  .example("vansah-connect -f ./cucumber.json --format cucumber --atp DEMO-P1 -a DEMO-9 --itr 2", "Upload to Advanced Test Plan iteration 2")
  .example("vansah-connect -f ./testng-results.xml --format testng", "Upload a TestNG report")
  .example("vansah-connect -f ./cucumber.json --format cucumber -a DEMO-9", "Upload Cucumber results against a Jira issue")
  .example("vansah-connect -f ./cucumber.json --format cucumber --mode stp --stp DEMO-P2", "Upload Cucumber results against a Standard Test Plan")
  .example("vansah-connect -f ./cucumber.json --format cucumber --mode atp --atp DEMO-P1 -a DEMO-9", "Upload Cucumber results against an Advanced Test Plan")
  .example("vansah-connect -t DEMO-C50 -s passed -a DEMO-9", "Log one Test Case result against an issue")
  .example("vansah-connect -t DEMO-C50 -s passed --stp DEMO-P2 --itr 2", "Log one result against STP iteration 2")
  .example("vansah-connect -t DEMO-C50 -s passed --atp DEMO-P1 -a DEMO-9 --itr 2", "Log one result against ATP iteration 2 with issue context")
  .example("vansah-connect -t DEMO-C50 -s passed --atp DEMO-P1 -a 'regression/login/' --itr 2", "Log one result against ATP iteration 2 with folder context")
  .epilogue("Docs: https://github.com/testpointcorp/vansah-connect")
  .wrap(yargs.terminalWidth())
  .showHelpOnFail(false, "Run vansah-connect --help to see all commands.")
  .version(JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version).help().argv;


function iterationValue(value){
  const number = Number(value);
  if (!/^\d+$/.test(`${value}`) || !Number.isSafeInteger(number) || number < 1) {
    console.error("Error: --itr / VANSAH_ITERATION must be a positive whole number (e.g. 1 or 2).");
    process.exit(1);
  }
  return number;
}
if (options.itr !== undefined) {
  iterationValue(options.itr);
  if (options.filePath && `${options.format}`.trim().toLowerCase() !== "cucumber") {
    console.error("Error: --itr is supported only for Cucumber uploads and single results targeting STP/ATP.");
    process.exit(1);
  }
}

if (options.filePath) {
  const format = typeof options.format === "string" ? options.format.trim().toLowerCase() : undefined;
  const formatHelp =
    "  --format testng     (TestNG XML - targets via custom attributes, no -a needed)\n" +
    "  --format cucumber   (Cucumber JSON - needs -a <IssueKey/TestFolder>, or --mode stp/atp)\n\n" +
    "Examples:\n" +
    "  vansah-connect -f ./testng-results.xml --format testng\n" +
    "  vansah-connect -f ./cucumber.json --format cucumber -a DEMO-9\n" +
    "  vansah-connect -f ./cucumber.json --format cucumber --mode stp --stp DEMO-P2\n" +
    "  vansah-connect -f ./cucumber.json --format cucumber --mode atp --atp DEMO-P1 -a DEMO-9   (ATP needs -a context)";
  if (!format) {
    console.error("Error: --format is required with -f. Choose the report format explicitly:\n" + formatHelp);
    process.exit(1);
  }
  if (format !== "testng" && format !== "cucumber") {
    console.error(`Error: unknown --format "${options.format}". Use one of: testng, cucumber.\n` + formatHelp);
    process.exit(1);
  }
  if (format === "cucumber") {
    const planTarget = await resolvePlanTarget(options);
    if (options.itr !== undefined && !planTarget) {
      console.error("Error: --itr requires an STP or ATP target for a Cucumber upload.");
      process.exit(1);
    }
    await cucumberResult(options.filePath, options.assetKey, planTarget);
  } else {
    await result(options.filePath);
  }
}
else if (options.testCaseKey) {
  const planTarget = await resolvePlanTarget(options);
  if (options.itr !== undefined && !planTarget) {
    console.error("Error: --itr requires an STP or ATP target for a single result.");
    process.exit(1);
  }
  if (options.testCaseResult && (options.assetKey || planTarget)) {
    await testCaseResult(options.testCaseKey, options.testCaseResult, options.assetKey, planTarget);
  } else {
    console.error(
      "Error: logging a result needs -s <result> and a target (-a <asset>, --stp <plan>, or --atp <plan> with -a <context>).\n\n" +
      "Examples:\n" +
      "  vansah-connect -t DEMO-C50 -s passed -a DEMO-9\n" +
      "  vansah-connect -t DEMO-C50 -s passed --mode stp --stp DEMO-P2"
    );
    process.exit(1);
  }
}
else if (options.connectToken || options.vansahAPIUrl || options.projectKey ||
         options.environment || options.sprint || options.release ||
         options.mode || options.stp || options.atp || options.itr !== undefined) {
  if (options.connectToken) { await setEnvVariable("VANSAH_TOKEN", options.connectToken); }
  if (options.vansahAPIUrl) { await setEnvVariable("VANSAH_URL", options.vansahAPIUrl); }
  if (options.projectKey) { await setEnvVariable("VANSAH_PROJECT_KEY", options.projectKey); }
  if (options.environment) { await setEnvVariable("VANSAH_ENVIRONMENT_NAME", options.environment); }
  if (options.sprint) { await setEnvVariable("VANSAH_SPRINT_NAME", options.sprint); }
  if (options.release) { await setEnvVariable("VANSAH_RELEASE_NAME", options.release); }
  if (options.itr !== undefined) { await setEnvVariable("VANSAH_ITERATION", iterationValue(options.itr)); }
  if (options.mode) { await setEnvVariable("VANSAH_MODE", options.mode); }
  if (options.stp) { await setEnvVariable("VANSAH_STP_KEY", options.stp); }
  if (options.atp) { await setEnvVariable("VANSAH_ATP_KEY", options.atp); }
}
else {
  console.info("Run vansah-connect --help");
  process.exit(1);
}
