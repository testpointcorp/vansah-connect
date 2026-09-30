import fs from 'fs';
import dotenv from 'dotenv';
import os from 'os';
import { join } from 'path';

// User-level config dir (like ~/.aws, ~/.claude, ~/.config/gh): persists the
// values saved via -c / -v / -p across every project, and survives reinstalls.
const configDir = join(os.homedir(), '.vansah-connect');
const configPath = join(configDir, '.env');

// Precedence: real environment (CI secrets) > saved user config > project-local
// .env (CWD). dotenv never overwrites a variable that is already set, so load
// the higher-priority sources first.
dotenv.config({ path: configPath });
dotenv.config({ path: join(process.cwd(), '.env') });

async function getEnvVariable(key){
    return process.env[key];
}

async function setEnvVariable(key, value) {
    try {
      const exists = fs.existsSync(configPath);
      const values = exists ? dotenv.parse(fs.readFileSync(configPath)) : {};
      values[key] = `${value}`;
      const content = Object.entries(values).map(([name, entry]) => serializeEntry(name, entry)).join(os.EOL);
      fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
      fs.chmodSync(configDir, 0o700);
      if (exists) { fs.chmodSync(configPath, 0o600); }
      fs.writeFileSync(configPath, content, { mode: 0o600 });
      const label = key === 'VANSAH_ITERATION' ? 'Test Plan Iteration' : key;
      console.info(`${label} has been ${exists ? 'updated' : 'saved'} successfully`);
      // Reflect immediately for the current process.
      process.env[key] = `${value}`;
    } catch (error) {
      console.error(`Unable to create or update Vansah config file at ${configPath}.`, error);
      process.exitCode = 1;
    }
  }

  function serializeEntry(key, value) {
    // dotenv has no general-purpose escaping; verify each representation with its parser.
    for (const quote of ["'", '"', '`', '']) {
      const entry = `${key}=${quote}${value}${quote}`;
      const parsed = dotenv.parse(entry);
      if (Object.keys(parsed).length === 1 && parsed[key] === value) {
        return entry;
      }
    }
    throw new Error(`Cannot preserve the value for ${key} in dotenv format.`);
  }

export { setEnvVariable, getEnvVariable };
