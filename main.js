const { app, BrowserWindow, ipcMain } = require('electron');
const db = require('./db');
const { generateDEK, wrapDEK, unwrapDEK, encryptText, decryptText } = require('./encryption');

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

async function getDEK(masterPassword) {
  let wrappedDEK = await db.getWrappedDEK();
  if (!wrappedDEK) {
    const dek = generateDEK();
    wrappedDEK = wrapDEK(dek, masterPassword);
    await db.setWrappedDEK(wrappedDEK);
    return dek;
  }
  try {
    return unwrapDEK(wrappedDEK, masterPassword);
  } catch (err) {
    throw new Error("Invalid master password");
  }
}


ipcMain.handle('db:get-master-password', async () => {
  return await db.getMasterPassword();
});

ipcMain.handle('db:set-master-password', async (event, { masterPassword, masterPasswordHash }) => {
  if (!masterPassword || !masterPasswordHash) {
    throw new Error("Both master password and its hash are required.");
  }
  const dek = generateDEK();
  const wrappedDEK = wrapDEK(dek, masterPassword);
  await db.setWrappedDEK(wrappedDEK);
  return await db.setMasterPassword(masterPasswordHash);
});

ipcMain.handle('db:add-password', async (event, { serviceName, plainPassword, masterPassword }) => {
  if (!masterPassword) {
    throw new Error("Master password is required to encrypt and store a password.");
  }
  const dek = await getDEK(masterPassword);
  const encrypted = encryptText(plainPassword, dek);
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
  const dek = await getDEK(masterPassword);
  try {
    return decryptText(record.password, dek);
  } catch (err) {
    return null;
  }
});

ipcMain.handle('db:update-password', async (event, { id, newServiceName, newPlainPassword, masterPassword }) => {
  if (!masterPassword) {
    throw new Error("Master password is required to encrypt and update a password.");
  }
  const dek = await getDEK(masterPassword);
  const newEncrypted = encryptText(newPlainPassword, dek);
  return await db.updatePassword(id, newServiceName, newEncrypted);
});

ipcMain.handle('db:delete-password', async (event, id) => {
  return await db.deletePassword(id);
});

ipcMain.handle('db:change-master-password', async (event, { oldMasterPassword, newMasterPassword, newMasterPasswordHash }) => {
  if (!oldMasterPassword || !newMasterPassword || !newMasterPasswordHash) {
    throw new Error("Old and new master passwords (and new hash) are required.");
  }
  const wrappedDEK = await db.getWrappedDEK();
  if (!wrappedDEK) {
    throw new Error("No DEK stored. Set your master password first.");
  }
  let dek;
  try {
    dek = unwrapDEK(wrappedDEK, oldMasterPassword);
  } catch (err) {
    throw new Error("Old master password is incorrect.");
  }
  const newWrappedDEK = wrapDEK(dek, newMasterPassword);
  await db.setWrappedDEK(newWrappedDEK);
  await db.setMasterPassword(newMasterPasswordHash);
  return true;
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
