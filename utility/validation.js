import {sendResult,sendTestCaseResult} from '../api/sendresults.js';
import {beforeResult, successTxt,onCLIError} from '../utility/displayOutput.js';
import {getConnectToken } from '../utility/setGetToken.js';

export async function result(filePath){
    try {  
      const tokenValue = await getConnectToken();
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
export async function testCaseResult(testCaseKey,testCaseResult,assetKey){
    try {  
      const tokenValue = await getConnectToken();
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