const { app, BrowserWindow, ipcMain } = require('electron');
const db = require('./db');
const { encryptText, decryptText, generateKeyFromPassword } = require('./encryption');

function createWindow() {
  const win = new BrowserWindow({
    width: 950,
    height: 750,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  win.loadFile('index.html');
}

ipcMain.handle('db:get-master-password', async () => {
  return await db.getMasterPassword();
});

ipcMain.handle('db:set-master-password', async (event, hashedMaster) => {
  return await db.setMasterPassword(hashedMaster);
});

ipcMain.handle('db:add-password', async (event, { serviceName, plainPassword, masterPassword }) => {
  if (!masterPassword) {
    throw new Error("Master password is required to encrypt and store a password.");
  }
  const key = generateKeyFromPassword(masterPassword);
  const encrypted = encryptText(plainPassword, key);
  return await db.addPassword(serviceName, encrypted);
});

ipcMain.handle('db:get-all-passwords', async () => {
  return await db.getAllPasswords();
});

ipcMain.handle('db:decrypt-password', async (event, { id, masterPassword }) => {
  if (!masterPassword) {
    throw new Error("Master password is required to decrypt a password.");
  }
  const record = await db.getPasswordById(id);
  if (!record) return null;

  const key = generateKeyFromPassword(masterPassword);
  try {
    return decryptText(record.password, key);
  } catch (err) {
    return null;
  }
});

ipcMain.handle('db:update-password', async (event, { id, newServiceName, newPlainPassword, masterPassword }) => {
  if (!masterPassword) {
    throw new Error("Master password is required to encrypt and update a password.");
  }
  const key = generateKeyFromPassword(masterPassword);
  const newEncrypted = encryptText(newPlainPassword, key);
  return await db.updatePassword(id, newServiceName, newEncrypted);
});

ipcMain.handle('db:delete-password', async (event, id) => {
  return await db.deletePassword(id);
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
