import { exec } from 'child_process';
import fs from 'fs';
import crypto from 'crypto';

function setEnvironmentVariable(value) {
    switch (process.platform) {
        case 'win32':
            // Set environment variable on Windows
            exec(`setx token "${value}"`, (error) => {
                if (error) console.error(`Error setting token in environment: ${error}`);
            });
            break;
        // case 'linux':
        // case 'darwin':
        //     // Set environment variable on Linux/Mac
        //     exec(`export CONNECT_TOKEN=${token}`, (error) => {
        //         if (error) console.error(`Error setting token in environment: ${error}`);
        //     });
        //     break;
        default:
            console.error('Unsupported platform.');
            process.exit(1);
    }
}

function saveEncryptedToken(token, password) {
    // Use AES-256-CBC for encryption
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, crypto.createHash('sha256').update(password).digest(), iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    fs.writeFileSync('encryptedToken.txt', `${iv.toString('hex')}:${encrypted}`);
}

function decryptToken(password) {
    const algorithm = 'aes-256-cbc';

    const encryptedData = fs.readFileSync('encryptedToken.txt', 'utf8');
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, crypto.createHash('sha256').update(password).digest(), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

export {
    setEnvironmentVariable,
    saveEncryptedToken,
    decryptToken

}
