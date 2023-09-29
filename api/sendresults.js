import {PROD_URL,API_VERSION} from '../const.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';


const apiUrl = PROD_URL;
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
async function sendTestCaseResult(testCaseKey,testCaseResultName,assetKey,TOKEN){ 
  const assetObject = {};
  if(countHyphens(assetKey)>=1){
    assetObject.type = "folder";
    assetObject.identifier = `${assetKey}`;
  }
  else{
    assetObject.type = "issue";
    assetObject.key = `${assetKey}`;
  }
  const body = {
      asset:
       assetObject
      ,
      case:{
        key: `${testCaseKey}`
      },
      result:{
        name : `${testCaseResultName}`
      }
  };
  try {
    const response = await axios({
      method: "post",
      url: `${apiUrl}/api/${nodeApiVersion}/run`,
      data: JSON.stringify(body),
      headers: { 
        "Authorization": TOKEN,
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
function countHyphens(str) {
  const matches = str.match('/'); 
  return matches ? matches.length : 0;
}

export {
  sendResult,sendTestCaseResult
};