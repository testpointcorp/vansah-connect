import { readFile, writeFile } from 'fs/promises'; 

const filePath = './config/config.json';

async function getConnectToken() {
  try {
    const data = await readFile(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    return jsonData.token;
  } catch (error) {
    console.error("Unable to retrieve Vansah Connect Token", error);
    throw error;
  }
}

async function setConnectToken(value) {
  const jsonData = JSON.stringify({ token: value }, null, 2);

  try {
    await writeFile(filePath, jsonData, 'utf8');
  } catch (error) {
    console.error("Unable to store Vansah Connect Token", error);
    throw error;
  }
}
async function resetToken(){
  const data = "";
  try{
    await writeFile(filePath,data,'utf-8');
  }catch(error){
    console.error("Unable to reset the Vansah Connect Token");
    throw error;
  };
}

export { getConnectToken, setConnectToken, resetToken };
