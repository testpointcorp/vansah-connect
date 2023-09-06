#!/usr/bin/env node
const yargs = require("yargs");
const axios = require('axios').default;
const FormData = require('form-data');
const fs = require('fs');


const apiUrl = "https://prod.vansahnode.app";
const nodeApiVersion = "v1";

const options = yargs.usage("Usage: -f <filePath> -c <connectToken>")
.option("f", { alias: "filePath", describe: "Provide TestNg report File Path", type: "string", demandOption: true })
.option("c",{ alias: "connectToken", describe:"Provide your Vansah Connect Token", type:"string", demandOption: true}).argv;



sendFileToVansah(options.filePath,options.connectToken);

async function sendFileToVansah(filePath, TOKEN){
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
    console.log(response.data.message);
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code outside of the range of 2xx
    console.error('Error:', error.response.data.message);
    //console.error('Status:', error.response.status);
    //console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
     console.error('Error:', error.request);
    } 
  }
}
