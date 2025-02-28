const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

const dbPath = path.join(app.getPath('userData'), 'password_manager.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to open database:", err);
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS master_password (
      id INTEGER PRIMARY KEY,
      password_hash TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS passwords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_name TEXT NOT NULL,
      password TEXT NOT NULL
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS wrapped_dek (
      id INTEGER PRIMARY KEY,
      wrapped_dek TEXT
    )
  `);
});

module.exports = {
  getMasterPassword: async () => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT password_hash FROM master_password WHERE id = 1",
        (err, row) => {
          if (err) return reject(err);
          if (!row) resolve(null);
          else resolve(row.password_hash);
        }
      );
    });
  },

  setMasterPassword: async (hashed) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO master_password (id, password_hash) VALUES (1, ?)`,
        [hashed],
        function (err) {
          if (err) return reject(err);
          resolve(true);
        }
      );
    });
  },

  addPassword: async (serviceName, encryptedPassword) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO passwords (service_name, password) VALUES (?, ?)`,
        [serviceName, encryptedPassword],
        function (err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  },

  getAllPasswords: async () => {
    return new Promise((resolve, reject) => {
      db.all("SELECT id, service_name, password FROM passwords", (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  getPasswordById: async (id) => {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM passwords WHERE id = ?", [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  updatePassword: async (id, serviceName, encryptedPassword) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE passwords SET service_name = ?, password = ? WHERE id = ?`,
        [serviceName, encryptedPassword, id],
        function (err) {
          if (err) return reject(err);
          resolve(true);
        }
      );
    });
  },

  deletePassword: async (id) => {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM passwords WHERE id = ?", [id], function (err) {
        if (err) return reject(err);
        resolve(true);
      });
    });
  },

  getWrappedDEK: async () => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT wrapped_dek FROM wrapped_dek WHERE id = 1",
        (err, row) => {
          if (err) return reject(err);
          if (!row) resolve(null);
          else resolve(row.wrapped_dek);
        }
      );
    });
  },

  setWrappedDEK: async (wrapped) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO wrapped_dek (id, wrapped_dek) VALUES (1, ?)`,
        [wrapped],
        function (err) {
          if (err) return reject(err);
          resolve(true);
        }
      );
    });
  }
};
