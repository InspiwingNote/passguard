const { ipcRenderer } = require('electron');
const bcrypt = require('bcrypt');

const sectionWelcome = document.getElementById('section-welcome');
const sectionAdd = document.getElementById('section-add');
const sectionPasswords = document.getElementById('section-passwords');
const sectionChangeMaster = document.getElementById('section-change-master');

const navWelcome = document.getElementById('nav-welcome');
const navAdd = document.getElementById('nav-add');
const navPasswords = document.getElementById('nav-passwords');
const navChangeMaster = document.getElementById('nav-change-master');

const masterModal = document.getElementById('master-modal');
const modalMasterInput = document.getElementById('modal-master-input');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');
const modalError = document.getElementById('modal-error-message');

const modifyModal = document.getElementById('modify-modal');
const modifyServiceInput = document.getElementById('modify-service-name');
const modifyPasswordInput = document.getElementById('modify-new-password');
const modifyCancelBtn = document.getElementById('modify-cancel-btn');
const modifySaveBtn = document.getElementById('modify-save-btn');

const notificationContainer = document.getElementById('notification-container');

function showNotification(message, type = 'success') {
  const notif = document.createElement('div');
  notif.className = `notification ${type}`;
  notif.innerText = message;
  notificationContainer.appendChild(notif);
  setTimeout(() => {
    if (notificationContainer.contains(notif)) {
      notificationContainer.removeChild(notif);
    }
  }, 5000);
}

function showSection(section) {
  [sectionWelcome, sectionAdd, sectionPasswords, sectionChangeMaster].forEach(sec => {
    sec.classList.add('hidden');
  });
  section.classList.remove('hidden');
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const storedMasterHash = await ipcRenderer.invoke('db:get-master-password');
    if (!storedMasterHash) {
      navWelcome.classList.remove('hidden');
      navAdd.classList.add('hidden');
      navPasswords.classList.add('hidden');
      navChangeMaster.classList.add('hidden');
      showSection(sectionWelcome);
    } else {
      navWelcome.classList.add('hidden');
      navAdd.classList.remove('hidden');
      navPasswords.classList.remove('hidden');
      navChangeMaster.classList.remove('hidden');
      showSection(sectionAdd);
    }
  } catch (err) {
    console.error(err);
  }
});

function promptMasterPassword() {
  return new Promise((resolve) => {
    modalError.innerText = '';
    modalMasterInput.value = '';
    masterModal.classList.remove('hidden');
    setTimeout(() => {
      modalMasterInput.focus();
    }, 100);
    function handleCancel() {
      cleanup();
      resolve(null);
    }
    function handleConfirm() {
      const val = modalMasterInput.value.trim();
      cleanup();
      resolve(val || null);
    }
    function cleanup() {
      masterModal.classList.add('hidden');
      modalCancelBtn.removeEventListener('click', handleCancel);
      modalConfirmBtn.removeEventListener('click', handleConfirm);
    }
    modalCancelBtn.addEventListener('click', handleCancel);
    modalConfirmBtn.addEventListener('click', handleConfirm);
  });
}

async function verifyMasterPassword(input) {
  if (!input) return false;
  const storedHash = await ipcRenderer.invoke('db:get-master-password');
  if (!storedHash) {
    alert("No master password is set in the database!");
    return false;
  }
  return bcrypt.compareSync(input, storedHash);
}

function showModifyModal(currentServiceName, currentPlainPassword) {
  return new Promise((resolve) => {
    modifyServiceInput.value = currentServiceName || '';
    modifyPasswordInput.value = '';
    modifyModal.classList.remove('hidden');
    setTimeout(() => {
      modifyServiceInput.focus();
    }, 100);
    function handleCancel() {
      cleanup();
      resolve(null);
    }
    function handleSave() {
      const newName = modifyServiceInput.value.trim();
      let newPass = modifyPasswordInput.value.trim();
      if (!newPass) {
        newPass = currentPlainPassword;
      }
      cleanup();
      resolve({ newServiceName: newName, newPassword: newPass });
    }
    function cleanup() {
      modifyModal.classList.add('hidden');
      modifyCancelBtn.removeEventListener('click', handleCancel);
      modifySaveBtn.removeEventListener('click', handleSave);
    }
    modifyCancelBtn.addEventListener('click', handleCancel);
    modifySaveBtn.addEventListener('click', handleSave);
  });
}

const welcomeMasterPass = document.getElementById('welcome-master-password');
const welcomeMasterRepeat = document.getElementById('welcome-master-repeat');
const welcomeSetMasterBtn = document.getElementById('welcome-set-master-btn');
const welcomeStatus = document.getElementById('welcome-status');

welcomeSetMasterBtn.addEventListener('click', async () => {
  const pass1 = welcomeMasterPass.value.trim();
  const pass2 = welcomeMasterRepeat.value.trim();
  if (!pass1 || pass1 !== pass2) {
    welcomeStatus.innerText = "Passwords do not match or are empty.";
    return;
  }
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(pass1, salt);
  try {
    await ipcRenderer.invoke('db:set-master-password', hash);
    welcomeStatus.innerText = "Master password set successfully!";
    showNotification("Master password set. You're ready to add passwords!", "success");
    navWelcome.classList.add('hidden');
    navAdd.classList.remove('hidden');
    navPasswords.classList.remove('hidden');
    navChangeMaster.classList.remove('hidden');
    showSection(sectionAdd);
  } catch (err) {
    console.error(err);
    welcomeStatus.innerText = "Error setting master password.";
    showNotification("Error setting master password!", "error");
  }
});

navAdd.addEventListener('click', () => showSection(sectionAdd));
navPasswords.addEventListener('click', () => {
  refreshPasswords();
  showSection(sectionPasswords);
});
navChangeMaster.addEventListener('click', () => showSection(sectionChangeMaster));

const serviceNameInput = document.getElementById('service-name-input');
const passwordInput = document.getElementById('password-input');
const addPasswordBtn = document.getElementById('add-password-btn');
const addStatus = document.getElementById('add-status');

const generateBtn = document.getElementById('generate-btn');
const genLength = document.getElementById('gen-length');
const genUppercase = document.getElementById('gen-uppercase');
const genLowercase = document.getElementById('gen-lowercase');
const genNumbers = document.getElementById('gen-numbers');
const genSymbols = document.getElementById('gen-symbols');

function generatePassword() {
  const length = parseInt(genLength.value) || 12;
  let chars = '';
  if (genUppercase.checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (genLowercase.checked) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (genNumbers.checked) chars += '0123456789';
  if (genSymbols.checked) chars += '!@#$%^&*()_+~`|}{[]\\:;?><,./-=';

  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

generateBtn.addEventListener('click', () => {
  passwordInput.value = generatePassword();
});

addPasswordBtn.addEventListener('click', async () => {
  addStatus.innerText = '';
  const serviceName = serviceNameInput.value.trim();
  let pass = passwordInput.value.trim();
  if (!serviceName) {
    addStatus.innerText = "Service name cannot be empty.";
    return;
  }
  if (!pass) {
    pass = generatePassword();
  }
  const masterPassword = await promptMasterPassword();
  if (!masterPassword) {
    addStatus.innerText = "Add canceled (no master password).";
    return;
  }
  const isValid = await verifyMasterPassword(masterPassword);
  if (!isValid) {
    alert("Incorrect master password. No password added.");
    return;
  }
  try {
    await ipcRenderer.invoke('db:add-password', {
      serviceName,
      plainPassword: pass,
      masterPassword
    });
    showNotification(`Password for ${serviceName} added successfully!`, "success");
    serviceNameInput.value = '';
    passwordInput.value = '';
  } catch (err) {
    console.error(err);
    addStatus.innerText = "Failed to add password.";
    showNotification("Failed to add password!", "error");
  }
});

const passwordsList = document.getElementById('passwords-list');

async function refreshPasswords() {
  passwordsList.innerHTML = '';
  try {
    const rows = await ipcRenderer.invoke('db:get-all-passwords');
    rows.forEach(row => {
      const entryDiv = document.createElement('div');
      entryDiv.className = 'password-entry';
      const nameDiv = document.createElement('div');
      nameDiv.className = 'service-name';
      nameDiv.innerText = row.service_name;
      const copyBtn = document.createElement('button');
      copyBtn.innerText = 'Copy';
      copyBtn.addEventListener('click', () => handleCopy(row.id));
      const modifyBtn = document.createElement('button');
      modifyBtn.innerText = 'Modify';
      modifyBtn.addEventListener('click', () => handleModify(row));
      const deleteBtn = document.createElement('button');
      deleteBtn.innerText = 'Delete';
      deleteBtn.addEventListener('click', () => handleDelete(row.id));
      entryDiv.appendChild(nameDiv);
      entryDiv.appendChild(copyBtn);
      entryDiv.appendChild(modifyBtn);
      entryDiv.appendChild(deleteBtn);
      passwordsList.appendChild(entryDiv);
    });
  } catch (err) {
    console.error(err);
    showNotification("Error fetching passwords!", "error");
  }
}

async function handleCopy(id) {
  const mp = await promptMasterPassword();
  if (!mp) return;
  const valid = await verifyMasterPassword(mp);
  if (!valid) {
    alert("Incorrect master password.");
    return;
  }
  try {
    const decrypted = await ipcRenderer.invoke('db:decrypt-password', { id, masterPassword: mp });
    if (!decrypted) {
      alert("Decryption failed.");
      return;
    }
    navigator.clipboard.writeText(decrypted);
    showNotification("Password copied to clipboard!", "success");
  } catch (err) {
    console.error(err);
    showNotification("Error decrypting or copying password!", "error");
  }
}

async function handleModify(row) {
  const mp = await promptMasterPassword();
  if (!mp) return;
  const valid = await verifyMasterPassword(mp);
  if (!valid) {
    alert("Incorrect master password.");
    return;
  }
  const currentPlain = await ipcRenderer.invoke('db:decrypt-password', { id: row.id, masterPassword: mp });
  if (!currentPlain) {
    alert("Decryption failed. Cannot modify.");
    return;
  }
  const result = await showModifyModal(row.service_name, currentPlain);
  if (!result) return;
  const { newServiceName, newPassword } = result;
  try {
    await ipcRenderer.invoke('db:update-password', {
      id: row.id,
      newServiceName: newServiceName || "Untitled",
      newPlainPassword: newPassword,
      masterPassword: mp
    });
    showNotification("Password updated!", "success");
    refreshPasswords();
  } catch (err) {
    console.error(err);
    showNotification("Failed to update password.", "error");
  }
}

async function handleDelete(id) {
  const mp = await promptMasterPassword();
  if (!mp) return;
  const valid = await verifyMasterPassword(mp);
  if (!valid) {
    alert("Incorrect master password.");
    return;
  }
  if (!confirm("Are you sure you want to delete this password?")) return;
  try {
    await ipcRenderer.invoke('db:delete-password', id);
    showNotification("Password deleted!", "success");
    refreshPasswords();
  } catch (err) {
    console.error(err);
    showNotification("Failed to delete password.", "error");
  }
}

const currentMasterInput = document.getElementById('current-master');
const newMasterInput = document.getElementById('new-master');
const newMasterRepeatInput = document.getElementById('new-master-repeat');
const changeMasterBtn = document.getElementById('change-master-btn');
const changeMasterStatus = document.getElementById('change-master-status');

changeMasterBtn.addEventListener('click', async () => {
  const current = currentMasterInput.value;
  const newPass = newMasterInput.value;
  const newPassRepeat = newMasterRepeatInput.value;
  changeMasterStatus.innerText = '';
  if (!newPass || newPass !== newPassRepeat) {
    changeMasterStatus.innerText = "New passwords do not match!";
    return;
  }
  const validCurrent = await verifyMasterPassword(current);
  if (!validCurrent) {
    changeMasterStatus.innerText = "Incorrect current master password!";
    return;
  }
  const salt = bcrypt.genSaltSync(10);
  const newHash = bcrypt.hashSync(newPass, salt);
  try {
    await ipcRenderer.invoke('db:set-master-password', newHash);
    showNotification("Master password changed!", "success");
    currentMasterInput.value = '';
    newMasterInput.value = '';
    newMasterRepeatInput.value = '';
  } catch (err) {
    console.error(err);
    changeMasterStatus.innerText = "Failed to change master password.";
    showNotification("Failed to change master password!", "error");
  }
});
