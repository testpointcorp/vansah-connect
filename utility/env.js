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

async function getEnvVariable(key){
    return process.env[key];
}

async function setEnvVariable(key, value) {
    try {
      if (!fileExists(filePath)) {
        fs.writeFileSync(filePath, `${key}=${value}`);
        console.info(`${key} has been saved successfully`);
      } else {
        const fileContent = fs.readFileSync(filePath, 'utf-8').split(os.EOL);
        const updatedContent = updateOrAddKey(fileContent, key, value);
        fs.writeFileSync(filePath, updatedContent.join(os.EOL));
        console.info(`${key} has been updated successfully`);
      }
    } catch (error) {
      console.error("Unable to create or update .env file. Write access denied", error);
    }
  }
  
  function updateOrAddKey(fileContent, key, value) {
    const matchKey = fileContent.indexOf(fileContent.find(line => line.startsWith(`${key}=`)));
    if (matchKey !== -1) {
      fileContent.splice(matchKey, 1, `${key}=${value}`);
    } else {
      fileContent.push(`${key}=${value}`);
    }
    return fileContent;
  }

  function fileExists(filePath) {
    return fs.existsSync(filePath);
  }  
  
export { setEnvVariable, getEnvVariable };
