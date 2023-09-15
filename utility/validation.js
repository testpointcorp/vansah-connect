import {sendResult,sendTestCaseResult} from '../api/sendresults.js';
import {beforeResult, successTxt,onCLIError} from '../utility/displayOutput.js';
import {getConnectToken } from '../utility/setGetToken.js';

export async function result(filePath){
    try {  
      const tokenValue = await getConnectToken();
      if (typeof tokenValue === 'undefined') {
        onCLIError("Unable to retrieve Vansah Connect Token \nPlease run vansahConnect -c 'Your Token Value'");
        process.exit(1);
      }
      else{
          beforeResult("Uploading Results to Vansah",false);
          sendResult(filePath,tokenValue).then(function(result){
          if(result.status > 200 && result.status < 500){
            onCLIError(`${result.data.message} \nPlease check your Vansah Connect Token \nRun vansahConnect -c 'Your Token Value' to update the Connect Token`);
            process.exit(1);
          }
          else if(result.status == 200){
          beforeResult(true);
          successTxt(result.data.message);
          process.exit(0);
          }
          else{
            onCLIError(`${result} \n Vansah Server is Under Maintenance`);
            process.exit(1);
          }
          
        });
    
        
      }  
    } catch (error) {
      onCLIError("Unable to retrieve Vansah Connect Token \nPlease run vansahConnect -c 'Your Token Value");
      process.exit(1);
    }
  }
export async function testCaseResult(testCaseKey,testCaseResult,assetKey){
    try {  
      const tokenValue = await getConnectToken();
      if (typeof tokenValue === 'undefined') {
        console.log("Unable to retrieve Vansah Connect Token \nPlease run vansahConnect -c 'Your Token Value'");
      }
      else{
        beforeResult("Uploading Results to Vansah",false);
        await sendTestCaseResult(testCaseKey,testCaseResult,assetKey,tokenValue).then(function(result){
          if(result.status > 200 && result.status < 500){
            onCLIError(`${result.data.message} \nPlease check your Vansah Connect Token \nRun vansahConnect -c 'Your Token Value' to update the Connect Token`);
            process.exit(1);
          }
          else if(result.status == 200){       
          beforeResult(false);
          successTxt(`Executing Test Case ${testCaseKey} against ${assetKey} with Result = ${testCaseResult} \n ${result.data.message}`);
          process.exit(0);
          }
          else{
            onCLIError(`${result} \n Vansah Server is Under Maintenance`);
            process.exit(1);
          }
        });
      }
    }catch (error) {
      onCLIError("Unable to retrieve Vansah Connect Token \nPlease run vansahConnect -c 'Your Token Value");
      process.exit(1);
    }
  }    