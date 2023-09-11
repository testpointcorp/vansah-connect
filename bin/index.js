#!/usr/bin/env node
import yargs from 'yargs';
import req from '../api/sendResults.js';
import display from '../utility/displayOutput.js';
import { setEnvironmentVariable } from '../utility/endecodeToken.js';


const options = yargs.option("f", { alias: "filePath", describe: "Provide TestNg report File Path", type: "string", demandOption: false })
.option("c",{ alias: "connectToken", describe:"Provide your Vansah Connect Token", type:"string", demandOption: false}).argv;


if (options.filePath && options.connectToken) {
  result(options.filePath, options.connectToken);
} 
if(options.connectToken){
  setEnvironmentVariable(options.connectToken);
}
else {
  console.log("Usage: -c <connectToken> \n Usage: -f <filePath>");
}

async function result(filePath,connectToken){
  try {
    let res = await req.sendResults(filePath,connectToken);
    display.successTxt(res);
  } catch (error) {
    console.error("Error:", error.message);
  }
}