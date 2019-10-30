const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser')
app.use(cookieParser());

//GENERATES 6 RANDOM CHARACTERS
function generateRandomString() {
  return Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
};

//LOOKS UP IF EMAIL EXISTS IN USERS DATABASE
function emailLookupHelper(email){
  for (let id in users) {
    if (users[id].email === email) {
      return users[id].id;
    } else {
      return null;
    }
  }  
};

//VALIDATES IF EMAIL MATCHES PASSWORD
function validateUser(email, password) {
  for (let id in users) {
    if (users[id].email === email && users[id].password === password) {
      return true;
    } else {
      return false;
    }
  } 
};
//URL DATA
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//USER DATA OBJECT of OBJECTS
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "1234"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

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

//RENDERS LIST OF URLS or URLS_INDEX
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.cookies.id]};
  res.render("urls_index", templateVars);
});

//RENDERS A URLS_NEW TEMPLATE
app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies.id] }
  res.render("urls_new", templateVars);
});

//CREATES A RANDOM 6 CHARACTER FUNCTION THAT CAN PASS INTO THE SHORTURL PARAMETER
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  
  let key = generateRandomString();
  urlDatabase[key] = req.body.longURL;
  res.redirect('/urls');
});

//ASSOCIATES ANY SHORT URL DATA WITH THAT ENTIRE KEY AND VALUE FROM MY STORED DATA
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies.id] };
  res.render("urls_show", templateVars);
});

//REDIRECTS YOU TO THE LONG URL FROM THIS SHORT URL IF YOU TYPE IT IN MANUALLY EXAMPLE:"/u/gs5las"
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//REDIRECT AFTER HITTING EDIT BUTTON ON URL TO THAT URL SUBPAGE
app.post("/urls/:shortURL/edit", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies.id] };
  res.render("urls_show", templateVars);
})

//REDIRECT AFTER DELETING AN ENTIRE URL FROM DATABASE
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
})

//REDIRECT AFTER UPDATING LONG URL FROM URLS_SHOW
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body['longURL'];
  res.redirect('/urls');
})

//ROUTE AWAY FROM REGISTER PAGE
app.post("/register", (req, res) => {
  let newUserObj = {};
  newUserObj['email'] = req.body['email'];
  newUserObj['password'] = req.body['password'];
  
  let uniqueUserId = generateRandomString(); 
  newUserObj.id = uniqueUserId;
  users[uniqueUserId] = newUserObj

  if (newUserObj.email === '' || newUserObj.password === '') {
    res.status(400).send('400 Error: Bad Request');
  } else if (emailLookupHelper(newUserObj.email)) {
    res.status(400).send('400 Error: Bad Request')
  } else {
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
  } else if (emailLookupHelper(req.body['email'])) {
    validateUser(email, password);
    if (validateUser(email, password) === false) {
      res.status(400).send('403 Error: Forbidden');
    } else {
    res.cookie('id', uniqueId); //set user_id cookie based on the id
    res.redirect('/urls'); //redirect after registration to index page  
    }
  console.log(users.id);
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