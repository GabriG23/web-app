'use strict';

const express = require('express');
const morgan = require('morgan'); // logging middleware
const { check, validationResult } = require('express-validator'); // validation middleware
const dao = require('./dao'); // module for accessing the DB
const cors = require('cors');
const passport = require('passport'); // auth middleware
const LocalStrategy = require('passport-local').Strategy; // username and password for login
const session = require('express-session'); // enable sessions
const userDao = require('./user-dao'); // module for accessing the users in the DB

/*** Set up Passport ***/
// set up the "username and password" login strategy
// by setting a function to verify username and password
passport.use(new LocalStrategy(
  function (username, password, done) {
    userDao.getUser(username, password).then((user) => {
      if (!user)
        return done(null, false, { message: 'Incorrect username and/or password.' });

      return done(null, user);
    })
  }
));

// serialize and de-serialize the user (user object <-> session)
// we serialize the user id and we store it in the session: the session is very small in this way
passport.serializeUser((user, done) => {
  done(null, user.CodU);
});

// starting from the data in the session, we extract the current (logged-in) user
passport.deserializeUser((CodU, done) => {
  userDao.gerUserInfo(CodU)
    .then(user => {
      done(null, user); // this will be available in req.user
    }).catch(err => {
      done(err, null);
    });
});

// init express
const app = new express();
const port = 3001;

// set-up the middlewares
app.use(morgan('dev'));
app.use(express.json());
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};
app.use(cors(corsOptions)); // NB: Usare solo per sviluppo e per l'esame! Altrimenti indicare dominio e porta corretti

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated())
    return next();

  return res.status(401).json({ error: 'not authenticated' });
}

// set up the session
app.use(session({
  // by default, Passport uses a MemoryStore to keep track of the sessions
  secret: 'a secret sentence not to share with anybody and anywhere, used to sign the session ID cookie',
  resave: false,
  saveUninitialized: false
}));

// then, init passport
app.use(passport.initialize());
app.use(passport.session());

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

/*** APIs ***/

// GET /api/rankUsers
app.get('/api/rankUsers', (req, res) => {
  dao.getRankUsers()
    .then((users) => res.json(users))
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: `Database error while retrieving users` }).end();
    });
});
// controllo risposte da parte dell'utente anonimo
// POST /api/checkAnswersGuest/:CodU/:category/:character
app.post('/api/checkAnswersGuest/:CodU/:category/:character', [
  check('CodU').isInt({ min: 0 }),
  check('category').isString().isIn(['animals', 'nations', 'colors']),
  check('character').isString().isLength({ min: 1, max: 1 }).isIn(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'w', 'z']),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  if (req.body.CodU !== 0) { // CONTROLLO utente anonimo
    console.log(err);
    res.status(401).json({ error: `Utente non anonimo` }).end();
  } else {
    // Controllo che il codice passato nell'URL sia uguale a quello passato nel req.body
    if (req.body.CodU.toString() === req.params.CodU && req.body.category === req.params.category && req.body.character === req.params.character) {
      var answers = req.body.answers;
      if (answers.length === 0) { // CONTROLLO che il vettore delle risposte non sia vuoto
        res.json(answers);
        res.status(200).end();
      } else {
        answers = answers.map((element) => ({ text: element.text.toLowerCase() })).filter(function (item) { return item.text.indexOf(req.body.character) === 0; }); // CONTROLLO carattere lato server
        answers = [...new Set(answers)]; // CONTROLLO parole duplicate lato server

        dao.getCorrectAnswersGuest(answers, req.body.category)
          .then((risposte) => res.json(risposte))
          .catch((err) => {
            console.log(err);
            res.status(500).json({ error: `Database error while retrieving correct answers` }).end();
          });
      }
    } else {
      res.status(503).json({ error: `Database error during the check of the answers` });
    }
  }
});

// POST /api/checkAnswersUser/:CodU/:category/:difficulty/:character  // ricevo answers, category, difficulty, CodU
app.post('/api/checkAnswersUser/:CodU/:category/:difficulty/:character', [  // controllo delle risposte che andranno moltiplicate per calcolare il nuovo punteggio
  check('CodU').isInt({ min: 0 }),
  check('category').isString().isIn(['animals', 'nations', 'colors']),
  check('difficulty').isInt({ min: 1, max: 4 }),
  check('character').isString().isLength({ min: 1, max: 1 }).isIn(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'w', 'z']),
  check('timestamp').isInt(),
  check('nickname').isString(),
], isLoggedIn, async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  if (req.isAuthenticated()) { // CONTROLLO utente autenticato (loggato)
    // Controllo che il codice passato nell'URL sia uguale a quello passato nel req.body      
    if (req.body.CodU.toString() === req.params.CodU && req.body.category === req.params.category && req.body.difficulty.toString() === req.params.difficulty && req.body.character === req.params.character) {
      try {
        var answers = req.body.answers; // tutte le risposte inserite dall'utente
        var score;
        var stringa;
        if (answers.length === 0) { // CONTROLLO che il vettore delle risposte non sia vuoto
          score = 0;
          stringa = '';
        } else {
          var rounds = await dao.getRounds(req.body.category, req.body.character); // ULTIMI 2 ROUND GIOCATI
          // CONTROLLO del carattere lato server e rendo tutte le parole lowerCase
          answers = answers.map((element) => ({ text: element.text.toLowerCase() })).filter(function (item) { return item.text.indexOf(req.body.character) === 0; });
          answers = [...new Set(answers)]; // CONTROLLO parole duplicate lato server
          answers = await dao.getCorrectAnswersUser(answers, req.body.category, req.body.difficulty, rounds); // CONTROLLO risposte giuste
          score = answers.reduce((sum, ele) => sum + ele.score, 0); // trovo lo score totale
          stringa = answers.map(function (item) {
            return item['text'];
          });
        }
        const round = { // creo il round
          CodU: req.body.CodU,
          nickname: req.body.nickname,
          character: req.body.character,
          score: score,
          category: req.body.category,
          difficulty: req.body.difficulty,
          answer: stringa,
          timestamp: req.body.timestamp
        };
        await dao.addRound(round); // aggiungo il round nel database CodU, nickname, character, score, category, difficulty, answer, timestamp
        res.json(answers);
        res.status(200).end();
      } catch (err) {
        res.status(503).json({ error: `Database error during the check of the answers` });
      }
    }
    else
      res.status(503).json({ error: `Database error during the check of the answers` });
  } else {
    res.status(401).json({ error: 'Unauthenticated user!' });
  }
});

// controllo risposte da parte dell'utente loggato
// POST /api/newRound/
app.post('/api/newRound', [
  check('CodU').isInt({ min: 0 }),
  check('nickname').isString(),
  check('character').isString().isLength({ min: 1, max: 1 }).isIn(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'w', 'z']),
  check('category').isString().isIn(['animals', 'nations', 'colors']),
  check('score').isInt({ min: 0 }),
  check('difficulty').isInt({ min: 1, max: 4 }),
  check('answer').isString(),
  check('timestamp').isInt()
], isLoggedIn,
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    if (req.isAuthenticated()) { // CONTROLLO utente autenticato (loggato)
      const round = req.body;
      try {
        await dao.addRound(round);
        res.status(200).end();
      } catch (err) {
        res.status(503).json({ error: `Database error during the creation of round ` });
      }
    }
    else
      res.status(401).json({ error: 'Unauthenticated user!' });
  });

/*** Users APIs ***/

// POST /sessions 
// login
app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json(info);
    }
    // success, perform the login
    req.login(user, (err) => {
      if (err)
        return next(err);

      // req.user contains the authenticated user, we send all the user info back
      // this is coming from userDao.getUser()
      return res.json(req.user);
    });
  })(req, res, next);
});

// DELETE /sessions/current 
// logout
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => { res.status(200).end(); });
});

// GET /sessions/current
// check whether the user is logged in or not
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  }
  else
    res.status(401).json({ error: 'Unauthenticated user!' });
});
