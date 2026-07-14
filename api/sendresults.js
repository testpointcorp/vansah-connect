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
async function sendResult(filePath,TOKEN){
    const bodyFormData = new FormData();
    bodyFormData.append('testFormat', "TESTNG");
    bodyFormData.append('testPaths', fs.createReadStream(filePath));
    try {
      const response = await axios({
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
      if (error.response) {
      return error.response;
      } else if (error.request) {
        return error.request;
      } 
    }
}
const RESULT_IDS = { "n/a": 0, "na": 0, "failed": 1, "passed": 2, "untested": 3 };

async function sendTestCaseResult(testCaseKey,testCaseResultName,assetKey,token){
  const resultId = RESULT_IDS[`${testCaseResultName}`.trim().toLowerCase()];
  if (resultId === undefined) {
    return { status: 400, data: { message: `Invalid result "${testCaseResultName}". Use one of: passed, failed, n/a, untested.` } };
  }
  const assetObject = {};
  if(assetKey.includes("/")){
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
    const response = await axios({
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
      if (error.response) {
      return error.response;
      } else if (error.request) {
        return error.request;
      } 
    }
}
async function sendCucumberResult(filePath,assetKey,token){
  if(!projectKey){
    return { status: 400, data: { message: "VANSAH_PROJECT_KEY is not set. Run vansah-connect -p 'Your Project Key'." } };
  }
  const bodyFormData = new FormData();
  bodyFormData.append('Testformat', "Cucumber_json");
  bodyFormData.append('Testpath', fs.createReadStream(filePath), { contentType: 'application/json' });
  bodyFormData.append('projectKey', `${projectKey}`);
  if(assetKey.includes("/")){
    bodyFormData.append('testFolderPath', `${assetKey}`);
  }
  else{
    bodyFormData.append('jiraIssueKey', `${assetKey}`);
  }
  if(sprintName){ bodyFormData.append('sprintName', `${sprintName}`); }
  if(releaseName){ bodyFormData.append('releaseName', `${releaseName}`); }
  if(environmentName){ bodyFormData.append('environmentName', `${environmentName}`); }
  try {
    const response = await axios({
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