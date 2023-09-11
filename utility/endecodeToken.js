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

function setEnvironmentVariable(value) {
    return new Promise((resolve, reject) => {
        let command;

        switch (process.platform) {
            case 'win32':
                // Windows Command
                command = `setx TOKEN "${value}"`;
                break;
            case 'linux':
            case 'darwin':
                // Unix/Mac Command (this sets the variable for the session)
                command = `export TOKEN="${value}"`;
                break;
            default:
                reject(new Error('Unsupported platform.'));
                return;
        }

        exec(command, (error) => {
            if (error) {
                reject(new Error(`Error setting $TOKEN in environment: ${error}`));
            } else {
                resolve(`Successfully set $TOKEN to ${value}`);
            }
        });
    });
}

export {
    getEnvironmentVariable,
    setEnvironmentVariable
}
