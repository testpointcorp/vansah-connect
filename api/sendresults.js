import {PROD_URL,API_VERSION} from '../const.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';


const apiUrl = PROD_URL;
const nodeApiVersion = API_VERSION;

async function sendResult(filePath,TOKEN){
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
      return response.data.message;
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

export {
  sendResult
};