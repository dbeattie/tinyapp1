const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser')
app.use(cookieParser());

const bcrypt = require('bcrypt');

//GENERATES 6 RANDOM CHARACTERS
function generateRandomString() {
  return Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
};

//LOOKS UP IF EMAIL EXISTS IN USERS DATABASE
function emailLookupHelper(email){
  for (let id in users) {
    if (users[id].email === email) {
      return users[id].id;
    }
  }
  return null;  
};

//VALIDATES IF EMAIL MATCHES PASSWORD
function validateUser(email, password) {
  for (let id in users) {
    if (users[id].email === email && bcrypt.compareSync(password, users[id].hashedPassword)) {
      return true;
    }
  }
  return false; 
};

//VALIDATES USER ACCESS TO URLS ON URLS_INDEX
function urlsForUser(userId) {
    matchObj = {};
    for (let id in urlDatabase) {
    if (urlDatabase[id].userID === userId) {
      matchObj[id] = urlDatabase[id];
    }
  } 
  return matchObj;
};

//URL DATA
// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

//NEW DATA OBJECT OF OBJECTS (KEYS CAN'T START WITH NUM)
const urlDatabase = {
  b6UTxQ: { longURL: "http://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "http://www.google.ca", userID: "userRandomID" },
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "user2@example.com" },
  sm5xK9: { longURL: "http://jaysfromthecouch.com/", userID: "user2@example.com" }
};

//NEW USER DATA OBJECT OF OBJECTS WITH HASHED PASSWORDS
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    hashedPassword: "$2b$10$825qzFNgJ7IKFNh2JIG0suy1GbWWqvQJUCkRdTknI.a9mRqxeqkLa"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    hashedPassword: "$2b$10$vz/uNS1o/VvJIz74SDpQM.URo9NGPH7KqAB3rt/9mM2CrUcxYOMMS"
  }
}

// //OLD USER DATA OBJECT OF OBJECTS WITH PLAINTEXT PASSWORDS
// const users1 = { 
//   "userRandomID": {
//     id: "userRandomID", 
//     email: "user@example.com", 
//     password: "1234"
//   },
//  "user2RandomID": {
//     id: "user2RandomID", 
//     email: "user2@example.com", 
//     password: "dishwasher-funk"
//   }
// }

//MIDDLEWARE TO GRANT PERMISSION WITH COOKIE TO URLS PAGE
app.use("/urls", (req, res, next) => {
  if (req.cookies.id) {
   next();
  } else {
   res.redirect('/login');
  }
 });

 //MIDDLEWARE TO GRANT PERMISSION WITH COOKIE TO URLS/NEW PAGE
// app.use("/urls/new", (req, res, next) => {
//   if (req.cookies.id) {
//    next();
//   } else {
//    res.redirect('/login');
//   }
//  });

 //MIDDLEWARE TO GRANT PERMISSION TO EDIT/ INDIVIDUAL URL PAGE
 app.use("/urls/:shortURL", (req, res, next) => {
  if (req.cookies.id && urlDatabase[req.params.shortURL].userID === req.cookies.id) {
    next();
  } else {
    res.redirect('/login');
  }
 });


//RENDERS REGISTRATION PAGE
app.get("/register", (req, res) => {
  let templateVars = { userId: users, user: users[req.cookies.id]};
  res.render("register", templateVars);
});

//RENDERS LOGIN PAGE
app.get("/login", (req, res) => {
  let templateVars = { userId: users, user: users[req.cookies.id]};
  res.render("login", templateVars);
});

//RENDERS THE LIST OF URLS (AKA URLS_INDEX)
app.get("/urls", (req, res) => {
  let urls = (urlsForUser(req.cookies.id));
  let templateVars = { urls: urls, user: users[req.cookies.id]};
  res.render("urls_index", templateVars);
});

//RENDERS A URLS_NEW TEMPLATE
app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies.id] }
  res.render("urls_new", templateVars);
});

//USES RANDOM CHARACTER FUNCTION TO PASS GENERATED ID INTO THE SHORTURL PARAMETER
app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  let newUrlObj = {}
  let shortUrlKey = generateRandomString();
  
  newUrlObj['longURL'] = req.body.longURL;
  newUrlObj['userID'] = req.cookies.id; 
  urlDatabase[shortUrlKey] = newUrlObj;

  res.redirect('/urls');
});

//ASSOCIATES ANY SHORT URL DATA WITH THAT ENTIRE KEY AND VALUE FROM MY STORED DATA
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies.id] };
  res.render("urls_show", templateVars);
});

//REDIRECTS YOU TO THE LONG URL FROM THIS SHORT URL IF YOU TYPE IT IN MANUALLY EXAMPLE:"/u/gs5las"
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//REDIRECT AFTER HITTING EDIT BUTTON ON URL TO THAT URL SUBPAGE
app.post("/urls/:shortURL/edit", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies.id] };
  res.render("urls_show", templateVars);
})

//REDIRECT AFTER DELETING AN ENTIRE URL FROM DATABASE
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  console.log(urlDatabase);
  res.redirect('/urls');
})

//REDIRECT AFTER UPDATING LONG URL FROM URLS_SHOW
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body['longURL'];
  res.redirect('/urls');
})

//ROUTE AWAY FROM REGISTER PAGE
app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('400 Error: Bad Request');
  } else if (emailLookupHelper(req.body.email)) {
    res.status(400).send('400 Error: Bad Request')
  } else {
    const hashedPassword = bcrypt.hashSync(req.body['password'], 10);

    let newUserObj = {};
    let uniqueUserId = generateRandomString(); 
    newUserObj.id = uniqueUserId;
    newUserObj['email'] = req.body['email'];
    newUserObj['hashedPassword'] = hashedPassword;

    users[uniqueUserId] = newUserObj;

    res.cookie('id', newUserObj.id); //set user_id cookie, should contain the randomly generated id
    res.redirect('/urls'); //redirect after registration to index page
  }
});

//ROUTE AWAY FROM LOGIN PAGE
app.post("/login", (req, res) => {
  
  let email = req.body['email'];
  let password = req.body['password'];  
  let uniqueId = emailLookupHelper(email);

  if (!emailLookupHelper(email)) { 
    res.status(400).send('403 Error: Forbidden');
  } else if (emailLookupHelper(email)) {
    validateUser(email, password);
    if (!validateUser(email, password)) {
      res.status(400).send('403 Error: Forbidden');
    } else {
      res.cookie('id', uniqueId); //set user_id cookie based on the id
      res.redirect('/urls'); //redirect after registration to index page  
    }
  }
}); 

//ROUTE TO LOGOUT
app.post("/logout", (req, res) => {
  res.clearCookie('id');
  res.redirect('/urls');
})

//GET .JSON FILES
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//REDIRECTS '/' HOME TO URLS INDEX PAGE
app.get("/", (req, res) => {
  res.redirect('/urls');
});

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

// app.get("/set", (req, res) => {
//   const a = 1;
//   res.send(`a = ${a}`);
//  });
 
//  app.get("/fetch", (req, res) => {
//   res.send(`a = ${a}`);
//  });

//SERVER IS ON AND LISTENING
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});