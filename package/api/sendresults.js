import {PROD_URL,API_VERSION} from '../const.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import {getEnvVariable} from  '../utility/env.js';

const apiUrl = await getEnvVariable("VANSAH_URL") || await getEnvVariable("PROD_URL") || PROD_URL;
const projectKey = await getEnvVariable("VANSAH_PROJECT_KEY");
const environmentName = await getEnvVariable("VANSAH_ENVIRONMENT_NAME");
const sprintName = await getEnvVariable("VANSAH_SPRINT_NAME");
const releaseName = await getEnvVariable("VANSAH_RELEASE_NAME");
const nodeApiVersion = API_VERSION;
const REQUEST_TIMEOUT_MS = 120000;

function timeoutResponse(error) {
  if (["ECONNABORTED", "ETIMEDOUT", "ERR_CANCELED"].includes(error.code)) {
    return { status: 408, data: { message: "Vansah request timed out after 120 seconds." } };
  }
}
function reportFileError(filePath){
  try {
    if (!fs.statSync(filePath).isFile()) {
      return { status: 400, data: { message: `Report path is not a file: ${filePath}` } };
    }
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch (error) {
    const message = error.code === 'ENOENT'
      ? `Report file not found: ${filePath}`
      : `Report file is not readable: ${filePath}`;
    return { status: 400, data: { message } };
  }
}

function projectError(){
  if (!projectKey || !projectKey.trim()) {
    return { status: 400, data: { message: "Project key is missing. Set it with vansah-connect -p <PROJECT_KEY>." } };
  }
}

async function sendResult(filePath,TOKEN){
    const missingProject = projectError();
    if (missingProject) return missingProject;
    const fileError = reportFileError(filePath);
    if (fileError) return fileError;
    const bodyFormData = new FormData();
    bodyFormData.append('testFormat', "TESTNG");
    bodyFormData.append('testPaths', fs.createReadStream(filePath));
    bodyFormData.append('projectKey', `${projectKey}`);
    try {
      const response = await axios({
        timeout: REQUEST_TIMEOUT_MS,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        method: "post",
        url: `${apiUrl}/api/${nodeApiVersion}/testCase/import/XML`,
        data: bodyFormData,
        headers: {
          "Authorization": TOKEN,
          "Content-Type": "multipart/form-data"
        },
      });
      return response;
    } catch (error) {
      const timeout = timeoutResponse(error);
      if (timeout) { return timeout; }
      if (error.response) {
      return error.response;
      } else if (error.request) {
        return error.request;
      }
    }
}
// Built-in IDs: https://help.vansah.com/en/articles/9822260-understanding-a-test-result-status/
const RESULT_IDS = {
  "n/a": 0, "na": 0,
  "failed": 1,
  "passed": 2, "pass": 2,
  "untested": 3,
  "n/a-in-progress": 4,
  "failed-in-progress": 5,
  "passed-in-progress": 6
};

// The ATP run API needs the internal issue/folder identifier, not its display key.
// Read all pages so nested folders and assets beyond the first page are resolved.
async function resolvePlanAsset(assetKey, token) {
  const isFolder = assetKey.includes('/');
  const assets = [];
  let startAt = 0;
  while (true) {
    const response = await axios({
      method: 'get', url: `${apiUrl}/api/${nodeApiVersion}/testFolders`,
      params: { projectKey, type: isFolder ? 'list' : 'issue', startAt, limit: 100 },
      headers: { Authorization: token },
      timeout: REQUEST_TIMEOUT_MS, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.status !== 200 || response.data?.success !== true) {
      return { error: { status: response.status === 200 ? 400 : response.status, data: response.data } };
    }
    const rows = response.data.data;
    if (!Array.isArray(rows)) throw new Error('Unable to read ATP context assets from Vansah.');
    assets.push(...rows);
    startAt += rows.length;
    const total = response.data.pagination?.total;
    if (!rows.length || (Number.isFinite(total) ? startAt >= total : rows.length < 100)) break;
  }
  const byId = new Map(assets.map(asset => [asset.identifier, asset]));
  function folderPath(asset) {
    const names = [];
    const seen = new Set();
    while (asset) {
      if (seen.has(asset.identifier)) throw new Error('Circular folder hierarchy returned by Vansah.');
      seen.add(asset.identifier);
      names.unshift(asset.name);
      if (!asset.parentIdentifier) return names.join('/');
      asset = byId.get(asset.parentIdentifier);
    }
    return null; // Do not mistake a nested folder with a missing parent for a root folder.
  }
  const normalize = value => value.replace(/^\/+|\/+$/g, '').toLowerCase();
  const matches = assets.filter(asset => {
    const name = isFolder ? folderPath(asset) : asset.name;
    return typeof name === 'string' && normalize(name) === normalize(assetKey);
  });
  if (matches.length !== 1 || !matches[0].identifier) {
    return { error: { status: 400, data: { message: matches.length > 1
      ? `ATP context "${assetKey}" is ambiguous. Use a unique issue key or full folder path.`
      : `ATP context "${assetKey}" was not found in project ${projectKey}.` } } };
  }
  return { identifier: matches[0].identifier };
}

async function sendTestCaseResult(testCaseKey,testCaseResultName,assetKey,token,planTarget){
  const status = `${testCaseResultName}`.trim().toLowerCase();
  if (!Object.hasOwn(RESULT_IDS, status)) {
    return { status: 400, data: { message: `Invalid result "${testCaseResultName}". Use one of: passed (or pass), failed, n/a, untested, n/a-in-progress, failed-in-progress, passed-in-progress.` } };
  }
  const resultId = RESULT_IDS[status];
  const missingProject = projectError();
  if (missingProject) return missingProject;
  const assetObject = {};
  if (planTarget) {
    const iteration = planTarget.iteration ?? 1;
    if (!Number.isSafeInteger(iteration) || iteration < 1) {
      return { status: 400, data: { message: "Iteration must be a positive whole number." } };
    }
    if (!['stp', 'atp'].includes(planTarget.type) || !planTarget.key) {
      return { status: 400, data: { message: "A valid STP or ATP plan key is required." } };
    }
    if (planTarget.type === 'atp' && !assetKey) {
      return { status: 400, data: { message: "ATP requires -a <IssueKey or TestFolder path> as context." } };
    }
    assetObject.type = "plannedRun";
    assetObject.key = `${planTarget.key}`;
    assetObject.iteration = iteration;
  }
  else if(!assetKey){
    return { status: 400, data: { message: "An issue or folder target is required." } };
  }
  else if(assetKey.includes("/")){
    assetObject.type = "folder";
    assetObject.folderPath = `${assetKey}`;
  }
  else{
    assetObject.type = "issue";
    assetObject.key = `${assetKey}`;
  }
  const body = {
      asset:
       assetObject
      ,
      project:{
        key: `${projectKey}`
      },
      case:{
        key: `${testCaseKey}`
      },
      result:{
        id : resultId
      }
  };
  if(environmentName){
    body.properties = { environment: { name: `${environmentName}` } };
  }
  try {
    if (planTarget?.type === 'atp') {
      const context = await resolvePlanAsset(assetKey, token);
      if (context.error) return context.error;
      body.testPlanAssetIdentifier = context.identifier;
    }
    const response = await axios({
      timeout: REQUEST_TIMEOUT_MS,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      method: "post",
      url: `${apiUrl}/api/${nodeApiVersion}/run`,
      data: JSON.stringify(body),
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      },
    });
    return response;
    } catch (error) {
      const timeout = timeoutResponse(error);
      if (timeout) { return timeout; }
      if (error.response) {
      return error.response;
      } else if (error.request) {
        return error.request;
      }
    }
}
async function sendCucumberResult(filePath,assetKey,token,planTarget){
  const missingProject = projectError();
  if (missingProject) return missingProject;
  const fileError = reportFileError(filePath);
  if (fileError) return fileError;
  const iteration = planTarget?.iteration ?? 1;
  if (planTarget && (!Number.isSafeInteger(iteration) || iteration < 1)) {
    return { status: 400, data: { message: "Iteration must be a positive whole number." } };
  }
  const bodyFormData = new FormData();
  if (planTarget) { bodyFormData.append('iterationNumber', `${iteration}`); }
  bodyFormData.append('Testformat', "Cucumber_json");
  bodyFormData.append('Testpath', fs.createReadStream(filePath), { contentType: 'application/json' });
  bodyFormData.append('projectKey', `${projectKey}`);
  const appendContextAsset = (key) => {
    if(`${key}`.includes("/")){
      bodyFormData.append('testFolderPath', `${key}`);
    }
    else{
      bodyFormData.append('jiraIssueKey', `${key}`);
    }
  };
  if(planTarget && planTarget.type === "stp"){
    bodyFormData.append('standardTestPlanKey', `${planTarget.key}`);
  }
  else if(planTarget && planTarget.type === "atp"){
    bodyFormData.append('advancedTestPlanKey', `${planTarget.key}`);
    // Advanced Test Plans need an issue/folder context alongside the plan key.
    appendContextAsset(assetKey);
  }
  else{
    appendContextAsset(assetKey);
  }
  if(sprintName){ bodyFormData.append('sprintName', `${sprintName}`); }
  if(releaseName){ bodyFormData.append('releaseName', `${releaseName}`); }
  if(environmentName){ bodyFormData.append('environmentName', `${environmentName}`); }
  try {
    const response = await axios({
      timeout: REQUEST_TIMEOUT_MS,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      method: "post",
      url: `${apiUrl}/api/${nodeApiVersion}/cucumber/import`,
      data: bodyFormData,
      headers: {
        "Authorization": token,
        ...bodyFormData.getHeaders()
      },
    });
    return response;
  } catch (error) {
    const timeout = timeoutResponse(error);
    if (timeout) { return timeout; }
    if (error.response) {
      return error.response;
    } else if (error.request) {
      return error.request;
    }
  }
}
export {
  sendResult,sendTestCaseResult,sendCucumberResult
};
