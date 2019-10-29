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
}

//THIS IS THE DATA
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//DO I NEED THIS???
// app.get('', (req, res) => {
//   let templateVars = {
//   username: req.cookies["username"],
//   // ... any other vars
// };
//   res.render("urls_index", templateVars);
// });


app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies.username };
  res.render("urls_index", templateVars);
});

//RENDERS A NEW URLS_ TEMPLATE
app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies.username }
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
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies.username };
  res.render("urls_show", templateVars);
});

//
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//REDIRECT AFTER HITTING EDIT BUTTON ON URL TO THAT URL SUBPAGE
app.post("/urls/:shortURL/edit", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies.username };
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

//ROUTE TO LOGIN
app.post("/login", (req, res) => {
  res.cookie('username', req.body['username']);
  res.redirect('/urls');
})

//ROUTE TO LOGOUT
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
})


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});