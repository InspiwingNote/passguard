const crypto = require('crypto');

function generateKeyFromPassword(password) {
  return crypto.createHash('sha256').update(password).digest();
}

function encryptText(plainText, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let enc = cipher.update(plainText, 'utf8', 'base64');
  enc += cipher.final('base64');
  return iv.toString('base64') + ':' + enc;
}

function decryptText(encryptedText, key) {
  const [ivStr, cipherText] = encryptedText.split(':');
  const iv = Buffer.from(ivStr, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let dec = decipher.update(cipherText, 'base64', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

module.exports = {
  generateKeyFromPassword,
  encryptText,
  decryptText
};
