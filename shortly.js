var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: '@lkafhafaldshfldahlf',
  resave: false,
  saveUninitialized: true
}));

app.get('/', 
  function(req, res) {
    res.send(`
    <h1> Welcome to Our Homepage <h1>
    <a href = "/login">Log In</a><br>
    <a href = "/signup">Sign Up</a>`);
  });

app.get('/create', 
  function(req, res) {
    if (!req.session.displayName) {
      console.log(req.session);
      res.send('<script type="text/javascript">alert("로그인이 필요한 페이지입니다");</script><a href = "/login">로그인페이지로</a>');   
    } else {
      res.render('index');
    }
  });

app.get('/links', 
  function(req, res) {
    Links.reset().fetch().then(function(links) {
      res.status(200).send(links.models);
    });
  });

app.post('/links', 
  function(req, res) {
    var uri = req.body.url;

    if (!util.isValidUrl(uri)) {
      console.log('Not a valid url: ', uri);
      return res.sendStatus(404);
    }

    new Link({ url: uri }).fetch().then(function(found) {
      if (found) {
        res.status(200).send(found.attributes);
      } else {
        util.getUrlTitle(uri, function(err, title) {
          if (err) {
            console.log('Error reading URL heading: ', err);
            return res.sendStatus(404);
          }

          Links.create({
            url: uri,
            title: title,
            baseUrl: req.headers.origin
          })
            .then(function(newLink) {
              res.status(200).send(newLink);
            });
        });
      }
    });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/
const newLocal = app.get('/login', function (req, res) {
  res.render('login');
});

app.post('/login', function(req, res) {
  var uname = req.body.username;
  var pwd = req.body.password;
  new User({ username: uname}).fetch().then(function (user) {
    console.log('user :', user);
    if (!user) {
      // res.redirect('/login');
      res.send('<script type="text/javascript">alert("아이디와 비밀번호를 ");</script><a href = "/login">로그인페이지로</a>');
    } else {
      console.log(1);
      bcrypt.compare(pwd, user.attributes.password, function(err, result) {
        if (err) throw err; 
        else {
          if (user.attributes.username === uname && result) {
            req.session.displayName = uname;
            res.redirect('/create');
          } else {
            res.send('<script type="text/javascript">alert("아이디와 비밀번호를 확인해주세요");</script><a href = "/login">로그인페이지로</a>');
          }
        }
      });
    }
  });
});

app.get('/welcome', function(req, res) {
  if (req.session.displayName) {
    console.log(req.session);
    res.redirect('/create');
  } else {
    res.redirect('/');
  }
});



app.post('/signup', function (req, res) {

  var username = req.body.username;
  var password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));


  new User({ username: username }).fetch()
    .then(function (user) {
      console.log('user :', user);
      if (!user) {
        console.log(password);
        console.log('no user found from /signup fetch ');
        Users.create({ username: username, password: password });
      } else {
 
        console.log('username exists, try another one');
        res.send('<script type="text/javascript">alert("이미 존재하는 아이디입니다");</script><a href = "/signup">회원가입페이지로</a>');
      }
    });
});


app.get('/signup', function (req, res) { 
  res.render('signup');
});

app.get('/logout', function (req, res) {
  delete req.session.displayName;
  res.redirect('/login');
});



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
