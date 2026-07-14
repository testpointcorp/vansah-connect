import fs from 'fs';
import dotenv from 'dotenv';
import os from 'os';
import { join } from 'path';

// User-level config dir (like ~/.aws, ~/.claude, ~/.config/gh): persists the
// values saved via -c / -v / -p across every project, and survives reinstalls.
const configDir = join(os.homedir(), '.vansah-connect');
const configPath = join(configDir, '.env');

// Precedence: real environment (CI secrets) > project-local .env (CWD) > saved
// user config. dotenv never overwrites a variable that is already set, so load
// the higher-priority sources first.
dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: configPath });

async function getEnvVariable(key){
    return process.env[key];
}

async function setEnvVariable(key, value) {
    try {
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, `${key}=${value}`);
        console.info(`${key} has been saved successfully`);
      } else {
        const fileContent = fs.readFileSync(configPath, 'utf-8').split(os.EOL);
        const updatedContent = updateOrAddKey(fileContent, key, value);
        fs.writeFileSync(configPath, updatedContent.join(os.EOL));
        console.info(`${key} has been updated successfully`);
      }
      // Reflect immediately for the current process.
      process.env[key] = `${value}`;
    } catch (error) {
      console.error(`Unable to create or update Vansah config file at ${configPath}.`, error);
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

export { setEnvVariable, getEnvVariable };
