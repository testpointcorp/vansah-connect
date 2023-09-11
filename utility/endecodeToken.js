import { exec } from 'child_process';

function getEnvironmentVariable() {
    return new Promise((resolve, reject) => {
        switch (process.platform) {
            case 'win32':
                // Get environment variable on Windows
                exec(`echo %TOKEN%` ||`echo $TOKEN`, (error, stdout) => {
                    if (error) {
                        console.error(`Error fetching TOKEN value from environment: ${error}`);
                        reject(error);
                    } else {
                        resolve(stdout.trim());
                    }
                });
                break;

            case 'linux':
                // Get environment variable on Linux/Mac
                exec(`echo $TOKEN`, (error, stdout) => {
                    if (error) {
                        console.error(`Error fetching TOKEN value from environment: ${error}`);
                        reject(error);
                    } else {
                        resolve(stdout.trim());
                    }
                });
                break;
            case 'darwin':
                // Get environment variable on Linux/Mac
                exec(`echo $TOKEN`, (error, stdout) => {
                    if (error) {
                        console.error(`Error fetching TOKEN value from environment: ${error}`);
                        reject(error);
                    } else {
                        resolve(stdout.trim());
                    }
                });
                break;

            default:
                console.error('Unsupported platform.');
                reject(new Error('Unsupported platform.'));
        }
    });
}

function setEnvironmentVariable(value){
    //To set the environment value
}

export {
    getEnvironmentVariable,
    setEnvironmentVariable,
}
