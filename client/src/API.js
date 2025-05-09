const APIURL = new URL('http://localhost:3001/api/');  // Do not forget '/' at the end

/* application API*/

async function getRankUsers() {
  // call: GET /api/rankUsers
  const response = await fetch(new URL('rankUsers', APIURL));
  const usersJson = await response.json();
  if (response.ok)
    return usersJson.map((user) => ({ nickname: user.nickname, category: user.category, score: user.score }));
  else
    throw usersJson;  // an object with the error coming from the server
}

// call: POST /api/checkAnswersGuest/:CodU/:category/:character 
async function checkAnswersGuest(answers, category, user, character) {
  let response = await fetch(new URL('checkAnswersGuest/' + user.CodU + '/' + category + '/' + character, APIURL), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ answers: answers, category: category, character: character, CodU: user.CodU }), // lista rispose inserite answers -> answer.text
  });
  if (response.ok) {
    const ans = await response.json(); // risposte esatte
    return ans;
  } else {
    const errDetail = await response.json();
    throw errDetail.message;
  }
}

// call: POST /api/checkAnswersUser/:CodU/:category/:difficulty/:character
async function checkAnswersUser(answers, category, difficulty, user, character, timestamp) {  // mi ritorna la lista di risposte esatte con relativo punteggio
  let response = await fetch(new URL('checkAnswersUser/' + user.CodU + '/' + category + '/' + difficulty + '/' + character, APIURL), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ answers: answers, category: category, difficulty: difficulty, character: character, CodU: user.CodU, nickname: user.nickname, timestamp: timestamp }), // lista rispose inserite answers -> answer.text
  });
  if (response.ok) {
    const ans = await response.json();  // risposte esatte con punteggio
    return ans;
  } else {
    const errDetail = await response.json();
    throw errDetail.message;
  }
}

async function newRound(round) {
  // call: POST /api/newRound
  return new Promise((resolve, reject) => {
    fetch(new URL('newRound', APIURL), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ CodU: round, nickname: round.nickname, character: round.character, category: round.category, score: round.score, difficulty: round.difficulty, answer: round.answer, timestamp: round.timestamp })
    }).then((response) => {
      if (response.ok) {
        resolve(null);
      } else {
        // analyze the cause of error
        response.json()
          .then((message) => { reject(message); }) // error message in the response body
          .catch(() => { reject({ error: "Cannot parse server response." }) }); // something else
      }
    }).catch(() => { reject({ error: "Cannot communicate with the server." }) }); // connection errors
  });
}

/* login API */

async function logIn(credentials) {
  let response = await fetch(new URL('sessions', APIURL), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  if (response.ok) {
    const user = await response.json();
    return user;
  } else {
    const errDetail = await response.json();
    throw errDetail.message;
  }
}

async function logOut() {
  await fetch(new URL('sessions/current', APIURL), { method: 'DELETE', credentials: 'include' });
}

async function getUserInfo() {
  const response = await fetch(new URL('sessions/current', APIURL), { credentials: 'include' });
  const userInfo = await response.json();
  if (response.ok) {
    return userInfo;
  } else {
    throw userInfo;  // an object with the error coming from the server
  }
}

const API = { getUserInfo, logIn, logOut, getRankUsers, checkAnswersGuest, checkAnswersUser, newRound };

export default API;