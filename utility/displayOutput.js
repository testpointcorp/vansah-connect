import ora from 'ora';
import chalk from 'chalk';
import { copyFileSync } from 'fs';

const spinner = ora("...");
function successTxt(message){
    spinner.succeed(chalk.green(message)); 
}
function beforeResult(message,status){
    spinner.start();
    const animateSpinner = setInterval(function(){
    spinner.text = chalk.blue(message)+chalk.blue.bold('...');
    },500);
    if(status==true){
    clearInterval(animateSpinner);
    }
}
function onCLIError(message){   
    spinner.fail(chalk.red(message));
}

export {
    successTxt,beforeResult,onCLIError
}