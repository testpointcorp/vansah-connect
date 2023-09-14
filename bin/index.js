#!/usr/bin/env node
import yargs from 'yargs';
import {sendResult} from '../api/sendresults.js';
import {successTxt} from '../utility/displayOutput.js';
import { getConnectToken,setConnectToken, resetToken } from '../utility/endecodeToken.js';


const options = yargs.option("f", { alias: "filePath", describe: "Provide TestNg report File Path", type: "string", demandOption: false })
.option("c",{ alias: "connectToken", describe:"Provide your Vansah Connect Token", type:"string", demandOption: false})
.option("r",{ alias:"reset",describe:"Run to reset the Vansah Connect Token"}).argv;


if (options.filePath) {
  await result(options.filePath);
} 
else if(options.connectToken){
  setConnectToken(options.connectToken);
}
else if(options.reset){
  resetToken();
}
else {
  console.log("Usage: -c <connectToken> \nUsage: -f <filePath>");
}
async function fetchTokenValue() {
  try {
      return await getConnectToken();
  } catch (error) {
      console.error('Error:', error.message);
      throw error;  // Re-throwing the error 
  }
}

async function result(filePath){
  try {  
    const tokenValue = await fetchTokenValue();
   // console.log('Token Value:', tokenValue);
    let res = await sendResult(filePath,tokenValue);
    console.log(res);
    //successTxt(res);
  
  } catch (error) {
    console.error("Error:", error.message);
  }
}