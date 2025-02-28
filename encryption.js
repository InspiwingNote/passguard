const crypto = require('crypto');

const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const DIGEST = 'sha256';

function generateKeyFromPassword(password, salt = crypto.randomBytes(SALT_LENGTH)) {
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return { key, salt };
}

function encryptText(plainText, password) {
  const { key, salt } = generateKeyFromPassword(password);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, authTag, encrypted]).toString('base64');
}

function decryptText(encryptedText, password) {
  try {
    const data = Buffer.from(encryptedText, 'base64');

    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + 16);
    const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + 16);

    const { key } = generateKeyFromPassword(password, salt);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateKeyFromPassword,
  encryptText,
  decryptText
};
