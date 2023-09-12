import { readFile, writeFile } from 'fs/promises'; // Use 'fs/promises' for Promise-based file operations

const filePath = './config/config.json';

async function getEnvironmentVariable() {
  try {
    const data = await readFile(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    return jsonData.token;
  } catch (error) {
    console.error("Unable to retrieve Vansah Connect Token", error);
    throw error;
  }
}

async function setEnvironmentVariable(value) {
  const jsonData = JSON.stringify({ token: value }, null, 2);

  try {
    await writeFile(filePath, jsonData, 'utf8');
  } catch (error) {
    console.error("Unable to store Vansah Connect Token", error);
    throw error;
  }
}

export { getEnvironmentVariable, setEnvironmentVariable };
