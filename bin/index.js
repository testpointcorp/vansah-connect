#!/usr/bin/env node
import yargs from 'yargs';
import {result,testCaseResult} from '../utility/validation.js';
import {setConnectToken } from '../utility/setGetToken.js';


const options = yargs.option("f", { alias: "filePath", describe: "Provide TestNg report File Path", type: "string", demandOption: false })
.option("c",{ alias: "connectToken", describe:"Provide your Vansah Connect Token", type:"string", demandOption: false})
.option("t",{alias:"testCaseKey",describe:"Provide your Test Case Key",type:"string"})
.option("s",{alias:"testCaseResult",describe:"Use to Pass or Fail the overall Test Case Result",type:"string"})
.option("a",{alias:"assetKey",describe:"Provide your IssueKey or Folder Path",type:"string"}).argv;


if (options.filePath && Object.keys(options).length <=4 ) {
  await result(options.filePath);
} 
else if(options.connectToken && Object.keys(options).length <=4){
  await setConnectToken(options.connectToken);
}
else if(options.testCaseKey && Object.keys(options).length <=12){
  if(options.testCaseResult)
  { 
    if(options.assetKey){await testCaseResult(options.testCaseKey,options.testCaseResult,options.assetKey);}
    else{
    console.info("Usage: vansahConnect -t <TestCaseKey> -s <ResultName PASSED/FAILED> -a <AssetKey/TestFolder Path>");
    process.exit(1);
    }
  }
  else{
    console.info("Usage: vansahConnect -t <TestCaseKey> -s <ResultName PASSED/FAILED> -a <AssetKey/TestFolder Path>");
    process.exit(1);
  }
  
}
else {
  console.info("Usage:\nvansahConnect -c <connectToken> \nvansahConnect -f <filePath> \nvansahConnect -t <TestCaseKey> -s <ResultName PASSED/FAILED> -a <AssetKey/TestFolder Path>");
  process.exit(1);
}