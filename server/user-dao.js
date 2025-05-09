'use strict';

const sqlite = require('sqlite3');
const crypto = require('crypto');

// open the database3
const db = new sqlite.Database('categories.db', (err) => {
  if (err) throw err;
});


exports.gerUserInfo = (CodU) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE CodU = ?';
    db.get(sql, [CodU], (err, row) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      else if (row === undefined)
        resolve({ error: 'User not found.' });
      else {
        // by default, the local strategy looks for "username": not to create confusion in server.js, we can create an object with that property
        const user = { CodU: row.CodU, nickname: row.nickname, email: row.email }
        resolve(user);
      }
    });
  });
};

exports.getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], (err, row) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      else if (row === undefined) { resolve(false); }
      else {
        const user = { CodU: row.CodU, nickname: row.nickname, email: row.email };

        const salt = row.salt;
        crypto.scrypt(password, salt, 64, (err, hashedPassword) => {
          if (err) reject(err);

          const passwordHex = Buffer.from(row.hash, 'hex'); //changed 

          if (!crypto.timingSafeEqual(passwordHex, hashedPassword))
            resolve(false);
          else resolve(user);
        });
      }
    });
  });
};