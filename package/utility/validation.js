import {sendResult,sendTestCaseResult,sendCucumberResult} from '../api/sendresults.js';
import {beforeResult, successTxt,onCLIError} from '../utility/displayOutput.js';
import {getEnvVariable} from  '../utility/env.js';

const tokenValue = await getEnvVariable("VANSAH_TOKEN") || await getEnvVariable("TOKEN");

// Returns an error string if the resolved Test Plan target is incomplete,
// otherwise null. ATP requires an issue or folder context for both upload flows.
function planTargetError(planTarget, contextValue, contextHint){
  if(!planTarget){ return null; }
  const label = planTarget.type === "atp" ? "Advanced Test Plan" : "Standard Test Plan";
  const setHint = planTarget.type === "atp"
    ? "vansah-connect --atp <PlanKey>"
    : "vansah-connect --stp <PlanKey>";
  if(!planTarget.key){
    return `No ${label} key configured for --mode ${planTarget.type}. Set one with ${setHint} (or pass it inline).`;
  }
  if(planTarget.type === "atp" && !contextValue){
    return `--mode atp (Advanced Test Plan) also requires ${contextHint}.`;
  }
  return null;
}

const TOKEN_HELP =
  "Save it with:\n" +
  "  vansah-connect -c \"Your Vansah Connect Token\"";

const CUCUMBER_EXAMPLES =
  "Examples:\n" +
  "  vansah-connect -f ./cucumber.json --format cucumber -a DEMO-9\n" +
  "  vansah-connect -f ./cucumber.json --format cucumber -a \"regression/login/\"\n" +
  "  vansah-connect -f ./cucumber.json --format cucumber --mode stp --stp DEMO-P2\n" +
  "  vansah-connect -f ./cucumber.json --format cucumber --mode atp --atp DEMO-P1 -a DEMO-9   (ATP needs -a context)";

const SINGLE_RESULT_EXAMPLES =
  "Examples:\n" +
  "  vansah-connect -t DEMO-C50 -s passed -a DEMO-9\n" +
  "  vansah-connect -t DEMO-C50 -s passed -a \"regression/login/\"\n" +
  "  vansah-connect -t DEMO-C50 -s passed --stp DEMO-P2 --itr 2\n" +
  "  vansah-connect -t DEMO-C50 -s passed --atp DEMO-P1 -a DEMO-9 --itr 2";

// Print a friendly, multi-line validation error (matching the --format style)
// and exit. Used for pre-flight checks before any API call - no spinner.
function failWith(message, hint){
  console.error(`Error: ${message}` + (hint ? `\n\n${hint}` : ""));
  process.exit(1);
}

export async function result(filePath){
    try {
      if (typeof tokenValue === 'undefined') {
        failWith("no Vansah Connect token found.", TOKEN_HELP);
      }
      else{
          beforeResult("Uploading Results to Vansah",false);
          await sendResult(filePath,tokenValue).then(function(result){
          if(result.status > 200 && result.status < 500){
            onCLIError(`${result.data.message}`);
            process.exit(1);
          }
          else if(result.status == 200){
          beforeResult(true);
          successTxt(result.data.message);
          process.exit(0);
          }
          else{
            onCLIError(`${result}`);
            process.exit(1);
          }
          
        }); 
      }  
    } catch (error) {
      onCLIError(error);
      process.exit(1);
    }
  }
export async function cucumberResult(filePath,assetKey,planTarget){
    try {
      if (typeof tokenValue === 'undefined') {
        failWith("no Vansah Connect token found.", TOKEN_HELP);
      }
      if (!planTarget && !assetKey) {
        failWith("a Cucumber upload needs a target - provide an asset with -a, or select a Test Plan with --mode stp/atp.", CUCUMBER_EXAMPLES);
      }
      const perr = planTargetError(planTarget, assetKey, "-a <IssueKey or TestFolder path> as context");
      if (perr) {
        failWith(perr, CUCUMBER_EXAMPLES);
      }
      beforeResult("Uploading Cucumber Results to Vansah",false);
      const result = await sendCucumberResult(filePath,assetKey,tokenValue,planTarget);
      const data = result && result.data;
      if(result && result.status == 200 && data && data.success){
        beforeResult(true);
        successTxt(`Imported ${data.imported}, Failed ${data.failed}, Skipped ${data.skipped}`);
        process.exit(0);
      }
      else{
        const summary = (data && (data.message || JSON.stringify(data))) || result;
        const errors = data && data.data && data.data.errors;
        const details = Array.isArray(errors)
          ? errors.filter(error => error && typeof error.msg === 'string').map(error => error.msg)
          : [];
        onCLIError([summary, ...details].join('\n'));
        process.exit(1);
      }
    } catch (error) {
      onCLIError(error);
      process.exit(1);
    }
  }
export async function testCaseResult(testCaseKey,testCaseResult,assetKey,planTarget){
    try {
      if (typeof tokenValue === 'undefined') {
        failWith("no Vansah Connect token found.", TOKEN_HELP);
      }
      const planError = planTargetError(planTarget, assetKey, "-a <IssueKey or TestFolder path> as context");
      if (planError) {
        failWith(planError, SINGLE_RESULT_EXAMPLES);
      }
      const target = planTarget ? `${planTarget.type.toUpperCase()} ${planTarget.key} iteration ${planTarget.iteration ?? 1}${planTarget.type === "atp" ? ` (${assetKey})` : ""}` : assetKey;
      beforeResult("Uploading Results to Vansah",false);
      await sendTestCaseResult(testCaseKey,testCaseResult,assetKey,tokenValue,planTarget).then(function(result){
        if(result.status > 200 && result.status < 500){
          onCLIError(`${result.data.message}`);
          process.exit(1);
        }
        else if(result.status == 200){
        beforeResult(false);
        successTxt(`Executed Test Case ${testCaseKey} against ${target} with Result = ${testCaseResult} \n ${result.data.message}`);
        process.exit(0);
        }
        else{
          onCLIError(`${result}`);
          process.exit(1);
        }
      });
    }catch (error) {
      onCLIError(error);
      process.exit(1);
    }
  }
