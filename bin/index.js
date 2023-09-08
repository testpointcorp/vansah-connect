#!/usr/bin/env node
const yargs = require("yargs");
const { sendResults } = require('../api/sendresults');

const options = yargs.usage("Usage: -f <filePath> -c <connectToken>")
.option("f", { alias: "filePath", describe: "Provide TestNg report File Path", type: "string", demandOption: true })
.option("c",{ alias: "connectToken", describe:"Provide your Vansah Connect Token", type:"string", demandOption: true}).argv;


async function result(){
  let res = await sendResults(options.filePath,options.connectToken);
  console.log(res);
  return res;
}

result();
