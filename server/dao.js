'use strict';

const sqlite = require('sqlite3');

const db = new sqlite.Database('categories.db', (err) => {
  if (err) throw err;
});

// 1) Punteggio utente più alto per ogni categoria
// /api/rankUsers
exports.getRankUsers = () => {
  return new Promise((resolve, reject) => {
    const sql = 'WITH cte AS(SELECT r.category as cat, r.nickname as nic, sum(r.score) as sc FROM rounds r GROUP BY r.category, r.nickname) SELECT cat, nic, max(sc) sc FROM cte GROUP BY cat;';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const users = rows.map((user) => ({ nickname: user.nic, category: user.cat, score: user.sc }));
      resolve(users);
    });
  });
};
// 2) riceve le risposte date dall'utente anonimo e ritorna le risposte esatte
// /api/checkAnswersGuest/:CodU/:category/:character
exports.getCorrectAnswersGuest = (ans, cat) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT text, category FROM answers WHERE category = ?';
    db.all(sql, [cat], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      var risposte = rows.map((answer) => ({ text: answer.text.toLowerCase() })); // risposte esatte prese dal database
      risposte = risposte.filter((el) => { // prendo le risposte giuste
        return ans.some((f) => {
          return f.text === el.text;
        });
      });
      resolve(risposte);
    });
  });
};

// 3) riceve le risposte date dall'utente loggato e ritorna le risposte esatte con punteggio
// /api/checkAnswersUser/:CodU/:category/:difficulty/:character
exports.getCorrectAnswersUser = (ans, cat, dif, rounds) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT text, category FROM answers WHERE category = ?';
    db.all(sql, [cat], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      var risposte = rows.map((answer) => ({ text: answer.text.toLowerCase(), score: 5 * dif })); // risposte esatte del db: aggiungo testo e punteggio;
      risposte = risposte.filter((el) => {  // tolgo le parole non presenti nel db answers
        return ans.some((f) => {
          return f.text === el.text;
        });
      });
      if (rounds.length >= 2) { // sono stati giocati 2 round, unisco le risposte//answersGiven = [...new Set(text.toString().toLowerCase().split(" ").filter(function (item) {return item.indexOf(props.round.character) === 0;}))];             
        var ris1 = rounds[0];
        var ris2 = rounds[1];
        ris1 = ris1.text.toString().toLowerCase().split(",");
        ris2 = ris2.text.toString().toLowerCase().split(",");
        var ris = ris1.concat(ris2); // unisco le stringhe
        ris = [...new Set(ris)]; // elimino i duplicati
        risposte = risposte.map(answer => {
          const found = ris.find(element => element === answer.text);
          if (found)
            return ({ text: answer.text, score: 5 * dif })
          else
            return ({ text: answer.text, score: 10 * dif })
        })
      }
      resolve(risposte);
    });
  });
};

// 4) controlla quanti round sono stati giocati per quella categoria e parola
exports.getRounds = (category, character) => { // prendo gli ultimi 2 round giocati basandomi sul loro timestamp (più alto = più recente)
  return new Promise((resolve, reject) => {
    const sql = 'WITH cte AS (SELECT *, RANK() OVER(ORDER BY timestamp DESC) rnk FROM rounds WHERE category = ? AND character = ?) SELECT CodR, character, category, answer, timestamp FROM cte WHERE rnk <=2;';
    db.all(sql, [category, character], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      var ris = rows.map((a) => ({ text: a.answer }))
      resolve(ris);
    })
  });
};

// 5) aggiunge il round nel db
exports.addRound = (round) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO rounds (CodU, nickname, character, category, score, difficulty, answer, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.run(sql, [round.CodU, round.nickname, round.character, round.category, round.score, round.difficulty, round.answer, round.timestamp], (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.lastID);
    })
  });
};