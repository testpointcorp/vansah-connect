import { expect } from "chai";
import { sendResult,sendTestCaseResult } from "./api/sendresults.js"; 
import { result , testCaseResult} from "./utility/validation.js";

describe("API Tests", function() {
    
  it("API should be able to upload the testngResults.xml to Vansah", function(done){
    sendResult("./testng-report.xml", process.env.VANSAH_TOKEN)
      .then(function(result) {
        expect(result.data.message).to.equal("Results import is completed.");
        done();  
      })
      .catch(function(err) {
        done(err);  
      });
  });
  it("API should be able to Execute a Test Case against an Issue to Vansah", function(done){
    sendTestCaseResult("PVT-C500","PASSED","PVT-4",process.env.VANSAH_TOKEN)
      .then(function(result) {
        expect(result.data.message).to.equal("A new Test Run created.");
        done();  
      })
      .catch(function(err) {
        done(err);  
      });
  });
  it("API should be able to Execute a Test Case against a TestFolder to Vansah", function(done){
    sendTestCaseResult("PVT-C500","PASSED","cb7c7c7a-5efc-11ee-bf34-eef1749e5133",process.env.VANSAH_TOKEN)
      .then(function(result) {
        expect(result.data.message).to.equal("A new Test Run created.");
        done();  
      })
      .catch(function(err) {
        done(err);  
      });
  });

});
describe("Validate Validation func()",function(){
  it("Validate result(), uploading TestNG results file to Vansah", function(done){
  result("./testng-report.xml")
      .then(function() {
        done();  
      })
      .catch(function(err) {
        done(err);  
      });
  });
  it("Validate testCaseResult for a Test Folder()", function(done){
    testCaseResult("PVT-C500","FAILED","cb7c7c7a-5efc-11ee-bf34-eef1749e5133")
          .then(function(result) {
            expect(result.data.message).to.equal("A new Test Run created.");
            done();  
          })
          .catch(function(err) {
            done(err);  
          });
    });
});
