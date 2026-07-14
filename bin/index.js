#!/usr/bin/env node
import yargs from 'yargs';
import {result,testCaseResult,cucumberResult} from '../utility/validation.js';
import {setEnvVariable} from '../utility/env.js';

const cfgGroup = "Configuration (saved to ~/.vansah-connect/.env):";
const uploadGroup = "Upload a report (-f):";
const resultGroup = "Log a single result / target asset:";

const options = yargs
  .scriptName("vansah-connect")
  .usage(
    "Vansah Connect — send automated test results to Vansah Test Management for Jira.\n\n" +
    "Usage:\n" +
    "  vansah-connect -c <token>                                   Save your Vansah Connect token\n" +
    "  vansah-connect -v <url>                                     Save your Vansah API URL\n" +
    "  vansah-connect -p <projectKey>                              Save your Vansah Space (Jira project) key\n" +
    "  vansah-connect -f <report> [--format <fmt>] [-a <asset>]    Upload an automation report\n" +
    "  vansah-connect -t <caseKey> -s <result> -a <asset>          Log a single Test Case result\n\n" +
    "Config resolution order: environment variables > project ./.env > ~/.vansah-connect/.env"
  )
  .option("c", { alias: "connectToken", describe: "Save your Vansah Connect (API) token", type: "string", group: cfgGroup })
  .option("v", { alias: "vansahAPIUrl", describe: "Save your Vansah API URL (default https://prod.vansah.com)", type: "string", group: cfgGroup })
  .option("p", { alias: "projectKey", describe: "Save your Vansah Space Key / Jira project key (e.g. DEMO)", type: "string", group: cfgGroup })
  .option("f", { alias: "filePath", describe: "Path to the automation report to upload", type: "string", group: uploadGroup })
  .option("format", { describe: "Report format for -f", type: "string", choices: ["testng", "cucumber"], default: "testng", group: uploadGroup })
  .option("t", { alias: "testCaseKey", describe: "Test Case key to log a result for (e.g. DEMO-C50)", type: "string", group: resultGroup })
  .option("s", { alias: "testCaseResult", describe: "Result value: passed | failed | n/a | untested", type: "string", group: resultGroup })
  .option("a", { alias: "assetKey", describe: "Jira Issue key (DEMO-9) or Test Folder path ('regression/login/'). Required for -t and for --format cucumber", type: "string", group: resultGroup })
  .example('vansah-connect -c "$VANSAH_TOKEN"', "Save your Connect token")
  .example("vansah-connect -p DEMO", "Save your Space (project) key")
  .example("vansah-connect -f ./testng-results.xml", "Upload a TestNG report (default format)")
  .example("vansah-connect -f ./cucumber.json --format cucumber -a DEMO-9", "Upload Cucumber results against a Jira issue")
  .example("vansah-connect -f ./cucumber.json --format cucumber -a 'regression/login/'", "Upload Cucumber results against a Test Folder")
  .example("vansah-connect -t DEMO-C50 -s passed -a DEMO-9", "Log one Test Case result against an issue")
  .epilogue("Optional run properties (sprint/release/environment) are read from VANSAH_SPRINT_NAME, VANSAH_RELEASE_NAME, VANSAH_ENVIRONMENT_NAME.\nDocs: https://github.com/testpointcorp/vansah-connect")
  .wrap(yargs.terminalWidth())
  .version().help().argv;


if (options.filePath) {
  if (`${options.format}`.toLowerCase() === "cucumber") {
    await cucumberResult(options.filePath, options.assetKey);
  } else {
    await result(options.filePath);
  }
}
else if (options.testCaseKey) {
  if (options.testCaseResult && options.assetKey) {
    await testCaseResult(options.testCaseKey, options.testCaseResult, options.assetKey);
  } else {
    console.info("Usage: vansah-connect -t <TestCaseKey> -s <ResultName PASSED/FAILED> -a <AssetKey/TestFolder Path>");
    process.exit(1);
  }
}
else if (options.connectToken || options.vansahAPIUrl || options.projectKey) {
  if (options.connectToken) { await setEnvVariable("VANSAH_TOKEN", options.connectToken); }
  if (options.vansahAPIUrl) { await setEnvVariable("VANSAH_URL", options.vansahAPIUrl); }
  if (options.projectKey) { await setEnvVariable("VANSAH_PROJECT_KEY", options.projectKey); }
}
else {
  console.info("Run vansah-connect --help");
  process.exit(1);
}