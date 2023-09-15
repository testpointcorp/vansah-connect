#!/usr/bin/env node
import yargs from 'yargs';
import {result,testCaseResult} from '../utility/validation.js';
import {setConnectToken } from '../utility/setGetToken.js';


const options = yargs.option("f", { alias: "filePath", describe: "Provide TestNg report File Path", type: "string", demandOption: false })
.option("c",{ alias: "connectToken", describe:"Provide your Vansah Connect Token", type:"string", demandOption: false})
.option("t",{alias:"testCaseKey",describe:"Provide your Test Case Key",type:"string"})
.option("s",{alias:"testCaseResult",describe:"Use to Pass or Fail the overall Test Case Result",type:"string"})
.option("a",{alias:"assetKey",describe:"Provide your IssueKey or Folder Path",type:"string"}).argv;


if (options.filePath) {
  await result(options.filePath);
} 
else if(options.connectToken){
  await setConnectToken(options.connectToken);
}
else if(options.testCaseKey && options.testCaseResult && options.assetKey){
  await testCaseResult(options.testCaseKey,options.testCaseResult,options.assetKey);
}
else {
  console.info("Usage: -c <connectToken> \nUsage: -f <filePath>");
  process.exit(1);
}