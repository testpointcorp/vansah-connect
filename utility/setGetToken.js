import fs from 'fs';
import dotenv from 'dotenv';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Compute the path for the parent directory
const parentDir = dirname(__dirname);
const filePath = join(parentDir, '.env');

dotenv.config({ path: filePath });

async function getConnectToken() {
  const token = process.env.TOKEN;
  return token;
}

async function setConnectToken(value) {

  try {
    if(fileExists(filePath)==false){
      fs.writeFileSync(filePath,`TOKEN=${value}`);
      console.info("Vansah Connect Token has been saved successfully under",filePath);
    }
    else {
      const fileContent = fs.readFileSync(filePath,'utf-8').split(os.EOL);
      const matchKey = fileContent.indexOf(fileContent.find(function(line){
        return line.match(new RegExp('TOKEN'));
      }));
      fileContent.splice(matchKey,1,`TOKEN=${value}`);
      fs.writeFileSync(filePath,fileContent.join(os.EOL));
      console.info("Vansah Connect Token has been updated successfully under",filePath);
    }
  } catch (error) {
    console.error("Unable to create .env file", error);
  }
}

function fileExists(filePath){

  try{
    fs.accessSync(filePath,fs.constants.F_OK)
    return true;
  }catch(err){
    return false;
  }
}
export { getConnectToken, setConnectToken };
