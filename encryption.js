const crypto = require('crypto');

const DEK_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const DIGEST = 'sha256';

function generateDEK() {
  return crypto.randomBytes(DEK_LENGTH);
}

function wrapDEK(dek, masterPassword) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const kek = crypto.pbkdf2Sync(masterPassword, salt, ITERATIONS, DEK_LENGTH, DIGEST);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', kek, iv);
  const encryptedDEK = Buffer.concat([cipher.update(dek), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, authTag, encryptedDEK]).toString('base64');
}

function unwrapDEK(wrapped, masterPassword) {
  const data = Buffer.from(wrapped, 'base64');
  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + 16);
  const encryptedDEK = data.subarray(SALT_LENGTH + IV_LENGTH + 16);
  const kek = crypto.pbkdf2Sync(masterPassword, salt, ITERATIONS, DEK_LENGTH, DIGEST);
  const decipher = crypto.createDecipheriv('aes-256-gcm', kek, iv);
  decipher.setAuthTag(authTag);
  const dek = Buffer.concat([decipher.update(encryptedDEK), decipher.final()]);
  return dek;
}

function encryptText(plainText, dek) {
  return plainText;
}

function decryptText(encryptedText, dek) {
  return encryptedText;
}

module.exports = {
  generateDEK,
  wrapDEK,
  unwrapDEK,
  encryptText,
  decryptText
};
