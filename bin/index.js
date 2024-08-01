#!/usr/bin/env node
import yargs from 'yargs';
import {result,testCaseResult} from '../utility/validation.js';
import {setEnvVariable} from '../utility/env.js';

const options = yargs.option("f", { alias: "filePath", describe: "Provide TestNg report File Path", type: "string", demandOption: false })
.option("c",{ alias: "connectToken", describe:"Provide your Vansah Connect Token", type:"string", demandOption: false})
.option("t",{alias:"testCaseKey",describe:"Provide your Test Case Key",type:"string"})
.option("s",{alias:"testCaseResult",describe:"Use `passed` or `failed` to add the Test Case Result",type:"string"})
.option("v",{alias:"vansahAPIUrl",describe:"Provide your custom Vansah API Url",type:"string"})
.option("a",{alias:"assetKey",describe:"Provide your IssueKey or Folder Path",type:"string"}).version().help().argv;


if (options.filePath && Object.keys(options).length <=5 ) {
  await result(options.filePath);
}
else if (options.vansahAPIUrl && Object.keys(options).length <=5 ) {
  await setEnvVariable("PROD_URL",options.vansahAPIUrl);
} 
else if(options.connectToken && Object.keys(options).length <=5){
  await setEnvVariable("TOKEN",options.connectToken);
}
else if(options.testCaseKey && Object.keys(options).length <12){
  if(options.testCaseResult)
  { 
    if(options.assetKey){await testCaseResult(options.testCaseKey,options.testCaseResult,options.assetKey);}
    else{
    console.info("Usage: vansah-connect -t <TestCaseKey> -s <ResultName PASSED/FAILED> -a <AssetKey/TestFolder Path>");
    process.exit(1);
    }
  }
  else{
    console.info("Usage: vansah-connect -t <TestCaseKey> -s <ResultName PASSED/FAILED> -a <AssetKey/TestFolder Path>");
    process.exit(1);
  }
  
}
else {
  console.info("Run vansah-connect --help");
  process.exit(1);
}