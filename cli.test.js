import { expect } from "chai";
import { sendResult,sendTestCaseResult } from "./api/sendresults.js"; 
import { getConnectToken } from "./utility/setGetToken.js";

describe("API Tests", () => {
    
  it("API should be able to upload the testngResults.xml to Vansah", function(done){
    getConnectToken();
    sendResult("./testng-report.xml", process.env.TOKEN)
      .then(function(result) {
        console.log(result.data.message);
        expect(result.data.message).to.equal("Results import is completed.");
        done();  
      })
      .catch(function(err) {
        done(err);  
      });
  });
  it("API should be able to Execute a Test Case against an Asset to Vansah", function(done){
    getConnectToken();
    sendTestCaseResult("PVT-C500","2","PVT-4",process.env.TOKEN)
      .then(function(result) {
        console.log(result.data.message);
        expect(result.data.message).to.equal("A new Test Run created.");
        done();  
      })
      .catch(function(err) {
        done(err);  
      });
  });

});
