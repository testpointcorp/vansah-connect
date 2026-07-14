import {sendResult,sendTestCaseResult,sendCucumberResult} from '../api/sendresults.js';
import {beforeResult, successTxt,onCLIError} from '../utility/displayOutput.js';
import {getEnvVariable} from  '../utility/env.js';

const tokenValue = await getEnvVariable("VANSAH_TOKEN") || await getEnvVariable("TOKEN");

export async function result(filePath){
    try {  
      if (typeof tokenValue === 'undefined') {
        onCLIError("Unable to retrieve Vansah Connect Token \nPlease run vansah-connect -c 'Your Token Value'");
        process.exit(1);
      }
      else{
          beforeResult("Uploading Results to Vansah",false);
          sendResult(filePath,tokenValue).then(function(result){
          if(result.status > 200 && result.status < 500){
            onCLIError(`${result.data.message}`);
            process.exit(1);
          }
          else if(result.status == 200){
          beforeResult(true);
          successTxt(result.data.message);
          process.exit(0);
          }
          else{
            onCLIError(`${result}`);
            process.exit(1);
          }
          
        }); 
      }  
    } catch (error) {
      onCLIError(error);
      process.exit(1);
    }
  }
export async function cucumberResult(filePath,assetKey){
    try {
      if (typeof tokenValue === 'undefined') {
        onCLIError("Unable to retrieve Vansah Connect Token \nPlease run vansah-connect -c 'Your Token Value'");
        process.exit(1);
      }
      else if (!assetKey) {
        onCLIError("Usage: vansah-connect -f <cucumber.json> --format cucumber -a <IssueKey/TestFolder Path>");
        process.exit(1);
      }
      else{
        beforeResult("Uploading Cucumber Results to Vansah",false);
        const result = await sendCucumberResult(filePath,assetKey,tokenValue);
        const data = result && result.data;
        if(result && result.status == 200 && data && data.success){
          beforeResult(true);
          const runs = (data.testRuns || []).map(function(r){ return `${r.testCaseKey}=${r.status}`; }).join(", ");
          successTxt(`Imported ${data.imported}, Failed ${data.failed}, Skipped ${data.skipped}${runs ? " ("+runs+")" : ""}`);
          process.exit(0);
        }
        else{
          onCLIError(`${(data && (data.message || JSON.stringify(data))) || result}`);
          process.exit(1);
        }
      }
    } catch (error) {
      onCLIError(error);
      process.exit(1);
    }
  }
export async function testCaseResult(testCaseKey,testCaseResult,assetKey){
    try {  
      if (typeof tokenValue === 'undefined') {
        console.log("Unable to retrieve Vansah Connect Token \nPlease run vansah-connect -c 'Your Token Value'");
      }
      else{
        beforeResult("Uploading Results to Vansah",false);
        await sendTestCaseResult(testCaseKey,testCaseResult,assetKey,tokenValue).then(function(result){
          if(result.status > 200 && result.status < 500){
            onCLIError(`${result.data.message}`);
            process.exit(1);
          }
          else if(result.status == 200){       
          beforeResult(false);
          successTxt(`Executed Test Case ${testCaseKey} against ${assetKey} with Result = ${testCaseResult} \n ${result.data.message}`);
          process.exit(0);
          }
          else{
            onCLIError(`${result}`);
            process.exit(1);
          }
        });
      }
    }catch (error) {
      onCLIError(error);
      process.exit(1);
    }
  }    