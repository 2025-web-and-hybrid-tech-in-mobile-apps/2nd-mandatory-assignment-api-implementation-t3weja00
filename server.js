const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const secret = 'JasMadToken';
let users = [];
let highScores = [];

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secret
}

passport.use(new JwtStrategy(opts, (payload, done) => {
  done(null, payload);
}))

function checkSignupBody(req, res, next) {
  const userHandle = req.body.userHandle;
  const password = req.body.password;

  if (!userHandle || !password) {
    res.status(400).send('Invalid request body');
    return;
  }

  if (userHandle.length < 6 || password.length < 6) {
    res.status(400).send('Invalid request body');
    return;
  }

  next();
}

app.post('/signup', checkSignupBody, (req, res) => {
  users.push({
    userHandle: req.body.userHandle,
    password: req.body.password
  })

  res.status(201).send('User registered successfully');
})

app.post('/login', (req, res, next) => {
  const userHandle = req.body.userHandle;
  const password = req.body.password;

  if (!userHandle || !password) {
    res.status(400).send('Bad Request');
    return;
  }

  if (userHandle.length < 6 || password.length < 6) {
    res.status(400).send('Bad Request');
    return;
  }

  if (Object.entries(req.body).length !== 2) {
    res.status(400).send('Bad Request');
    return;
  }

  if (typeof(userHandle) !== 'string' || typeof(password) !== 'string') {
    res.status(400).send('Bad request');
    return;
  }

  const correctUser = users.find(element => (element.userHandle === userHandle) && (element.password === password));

  if (!correctUser) {
    res.status(401).send('Unauthorized, incorrect username or password');
    return;
  }
  
  next();
})

app.post('/login', (req, res) => {
  res.status(200).json(
    {
      jsonWebToken: jwt.sign(
        {
          login: 'successful'
        },
        secret
      )
    }
  );
})

app.post(
  '/high-scores',
  passport.authenticate('jwt', { session: false }),
  (req, res, next) => {
    const level = req.body.level;
    const userHandle = req.body.userHandle;
    const score = req.body.score;
    const timestamp = req.body.timestamp;

    if (
      !level ||
      !userHandle ||
      !score ||
      !timestamp
    ) {
      res.status(400).send('Invalid request body');
      return;
    }

    next();
  }
)

app.post('/high-scores', (req, res) => {
  highScores.push({
    level: req.body.level,
    userHandle: req.body.userHandle,
    score: req.body.score,
    timestamp: req.body.timestamp
  })

  res.status(201).send('High score posted successfully');
})

app.get('/high-scores', (req, res) => {
  let levelScores = highScores.filter(element => element.level === req.query.level) || [];
  const page = +req.query.page || 1;

  for (let n = 0; n < levelScores.length - 1; n++) {
    for (let m = 0; m < levelScores.length - 1; m++) {
      if (levelScores[m].score < levelScores[m + 1].score) {
        let storage = levelScores[m];
        levelScores[m] = levelScores[m + 1];
        levelScores[m + 1] = storage;
      }
    }
  }

  res.status(200).json(
    levelScores.slice(20 * (page - 1), page * 20)
  )
})

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};