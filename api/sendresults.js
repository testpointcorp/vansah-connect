const { PROD_URL,API_VERSION } = require('../const');
const axios = require('axios').default;
const FormData = require('form-data');
const fs = require('fs');

const apiUrl = PROD_URL;
const nodeApiVersion = API_VERSION;

async function sendResults(filePath, TOKEN){
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

module.exports = {
    sendResults
}