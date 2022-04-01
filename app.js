'use strict';
var express = require('express');
var path = require('path');
var fs = require('fs');
const { errorMonitor } = require('events');
const { error } = require('console');
const { Script } = require('vm');
const session = require('express-session');
var app = express();
var { MongoClient, Db } = require('mongodb');
var uri = "mongodb+srv://leelo:admin@cluster0.tcdeh.mongodb.net/NetworkersProject?retryWrites=true&w=majority";
var client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect();
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 2, sameSite: true }
}));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const redirectlogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect('/');
  } else {
    next()
  }
}

app.get('/', function (req, res) {
  const { userId } = req.session;
  res.render('login', { label: '' })
});

app.post('/', function (req, res) {
  var username1 = req.body.username;
  var pass = req.body.password;
  var found = false;

  async function main() {
    var output = await client.db('NetworkersProject').collection('UsersCollection').find().toArray();
    for (var i = 0; i < output.length; i++) {
      if (output[i].username == username1 && output[i].password == pass) {
        found = true;
        req.session.user = output[i];
        req.session.userId = output[i]._id;
        res.render('home', req.session.user);
        break;
      }
    }
    if (found == false)
      res.render('login', { label: " The Username & Password you entered aren't connected to an account " });
  }
  main().catch(console.error);
});

app.get('/Registration', function (req, res) {
  res.render('registration', { label: "" })
});

app.post('/register', function (req, res) {
  var username2 = req.body.username;
  var password1 = req.body.password;
  var user = { username: username2, password: password1, Cart: [] };
  var bool = true;
  async function main() {
    var arr = await client.db('NetworkersProject').collection('UsersCollection').find().toArray();
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].username == username2 && arr[i].password == password1) {
        bool = false;
        res.render('registration', { label: "Account exists. Try logging in." });
        break;
      } else if (arr[i].username == username2 && arr[i].password !== password1) {
        bool = false;
        res.render('registration', { label: "There is an account with the same username. Please use a different one." });
        break;

      } else if (username2 == "" || password1 == "") {
        bool = false;
        res.render('registration', { label: "Username and password fields cannot be empty." });
        break;
      }
    }
    if (bool === true) {
      await client.db('NetworkersProject').collection('UsersCollection').insertOne(user);
      var arr1 = await client.db('NetworkersProject').collection('UsersCollection').find().toArray();
      console.log(arr1[arr1.length - 1].username);
      req.session.user = arr1[arr1.length - 1];
      req.session.userId = arr1[arr1.length - 1]._id;
      res.render('home', req.session.user);
    }
  }
  main().catch(console.error);
});

app.post('/search', function (req, res) {
  const searchItem = req.body.Search;
  const x = searchItem.toString().toLowerCase();
  var y = false;
  var item = new Array();
  var ejsArr = new Array();
  async function main() {
    var arr = await client.db('NetworkersProject').collection('Products').find().toArray();
    for (var i = 0; i < arr.length; i++) {
      y = arr[i].product.toLowerCase().includes(x);
      if (y == true) {
        item.push(arr[i].product);
      }
    }
    if (item.length == 0)
      ejsArr.push({ src: "/no-items-found.jpg", label: "item not found.", View: "/home" });
    else {
      for (var i = 0; i < item.length; i++) {
        if (item[i] == "The Sun and Her Flowers")
          ejsArr.push({
            src: '/sun.jpg', label: "The Sun and Her Flowers",
            View: "/sun"
          });
        else if (item[i] == "Leaves of Grass")
          ejsArr.push({
            src: "/leaves.jpg", label: "Leaves of Grass",
            View: "/leaves"
          });
        else if (item[i] == "Galaxy S21 Ultra")
          ejsArr.push({
            src: "/galaxy.jpg", label: "Galaxy S21 Ultra",
            View: "/galaxy"
          });
        else if (item[i] == "iPhone 13 Pro")
          ejsArr.push({
            src: "/iphone.jpg", label: "iPhone 13 Pro",
            View: "/iphone"
          });
        else if (item[i] == "Boxing Bag")
          ejsArr.push({
            src: "/boxing.jpg", label: "Boxing Bag",
            View: "/boxing"
          });
        else if (item[i] == "Tennis Racket")
          ejsArr.push({
            src: "/tennis.jpg", label: "Tennis Racket",
            View: "/tennis"
          });
      }
    }
    res.render('searchresults', { ejsArr });

  }
  main().catch(console.error);
});

app.get('/home', redirectlogin, function (req, res) {
  res.render('home', req.session.user)
});

app.get('/phones', redirectlogin, function (req, res) {
  res.render('phones')
});

app.get('/sports', redirectlogin, function (req, res) {
  res.render('sports')
});

app.get('/books', redirectlogin, function (req, res) {
  res.render('books')
});

app.get('/tennis', redirectlogin, function (req, res) {
  res.render('tennis', { labelT: "" })
  var itemsInCart = new Array();
  app.post('/addToCartTennis', function (req, res) {
    async function main() {
      var currentUser = await client.db('NetworkersProject').collection('UsersCollection').find().toArray();
      for (var i = 0; i < currentUser.length; i++) {
        if (currentUser[i].username == req.session.user.username) {
          console.log(req.session.user.username);
          itemsInCart.push(currentUser[i].Cart);
         
          break;
        }
      }
      console.log(itemsInCart[0]);
      if (itemsInCart[0].includes('tennis'))
        res.render('tennis', { labelT: "Item is already in your cart." });
      else {
        client.db('NetworkersProject').collection('UsersCollection').findOneAndUpdate(
          {
            username: req.session.user.username
          },
          {
            $addToSet: {
              Cart: 'tennis',
            },
          });
        res.render('tennis', { labelT: "Item added to cart successfully." });
      }
    }
    main().catch(console.error);
  })
});

app.get('/boxing', redirectlogin, function (req, res) {
  res.render('boxing', { labelB: "" })
  var itemsInCart = new Array();
  app.post('/addToCartBoxing', function (req, res) {
    async function main() {
      var currentUser = await client.db('NetworkersProject').collection('UsersCollection').find().toArray();
      for (var i = 0; i < currentUser.length; i++) {
        if (currentUser[i].username == req.session.user.username) {
          itemsInCart.push(currentUser[i].Cart);;
          break;
        }
      }
      if (itemsInCart[0].includes('boxing'))
        res.render('boxing', { labelB: "Item is already in your cart." });
      else {
        client.db('NetworkersProject').collection('UsersCollection').findOneAndUpdate(
          {
            username: req.session.user.username
          },
          {
            $addToSet: {
              Cart: 'boxing',
            },
          });
        res.render('boxing', { labelB: "Item added to cart successfully." });
      }
    }
    main().catch(console.error);
  })
});

app.get('/galaxy', redirectlogin, function (req, res) {
  res.render('galaxy', { labelG: "" })
  var itemsInCart = new Array();
  app.post('/addToCartGalaxy', function (req, res) {
    async function main() {
      var currentUser = await client.db('NetworkersProject').collection('UsersCollection').find().toArray();
      for (var i = 0; i < currentUser.length; i++) {
        if (currentUser[i].username == req.session.user.username) {
          console.log(req.session.user.username);
          itemsInCart.push(currentUser[i].Cart);
          break;
        }
      }
      if (itemsInCart[0].includes('galaxy'))
        res.render('galaxy', { labelG: "Item is already in your cart." });
      else {
        client.db('NetworkersProject').collection('UsersCollection').findOneAndUpdate(
          {
            username: req.session.user.username
          },
          {
            $addToSet: {
              Cart: 'galaxy',
            },
          });
        res.render('galaxy', { labelG: "Item added to cart successfully." });
      }
    }
    main().catch(console.error);
  })
});

app.get('/iphone', redirectlogin, function (req, res) {
  res.render('iphone', { labelI: "" })
  var itemsInCart = new Array();
  app.post('/addToCartIphone', function (req, res) {
    async function main() {
      var currentUser = await client.db('NetworkersProject').collection('UsersCollection').find().toArray();
      for (var i = 0; i < currentUser.length; i++) {
        if (currentUser[i].username == req.session.user.username) {
          itemsInCart.push(currentUser[i].Cart);
          break;
        }
      }
      if (itemsInCart[0].includes('iphone'))
        res.render('iphone', { labelI: "Item is already in your cart." });
      else {
        client.db('NetworkersProject').collection('UsersCollection').findOneAndUpdate(
          {
            username: req.session.user.username
          },
          {
            $addToSet: {
              Cart: 'iphone',
            },
          });
        res.render('iphone', { labelI: "Item added to cart successfully." });
      }
    }
    main().catch(console.error);
  })
});

app.get('/sun', redirectlogin, function (req, res) {
  res.render('sun', { labelS: "" })
  var itemsInCart = new Array();
  app.post('/addToCartSun', function (req, res) {
    async function main() {
      var currentUser = await client.db('NetworkersProject').collection('UsersCollection').find().toArray();
      for (var i = 0; i < currentUser.length; i++) {
        if (currentUser[i].username == req.session.user.username) {
          itemsInCart.push(currentUser[i].Cart);
          break;
        }
      }
      if (itemsInCart[0].includes('sun'))
        res.render('sun', { labelS: "Item is already in your cart." });
      else {
        client.db('NetworkersProject').collection('UsersCollection').findOneAndUpdate(
          {
            username: req.session.user.username
          },
          {
            $addToSet: {
              Cart: 'sun',
            },
          });
        res.render('sun', { labelS: "Item added to cart successfully." });
      }
    }
    main().catch(console.error);
  })
});

app.get('/leaves', redirectlogin, function (req, res) {
  res.render('leaves', { labelL: "" })
  var itemsInCart = new Array();
  app.post('/addToCartLeaves', function (req, res) {
    async function main() {
      var currentUser = await client.db('NetworkersProject').collection('UsersCollection').find().toArray();
      for (var i = 0; i < currentUser.length; i++) {
        if (currentUser[i].username == req.session.user.username) {
          itemsInCart.push(currentUser[i].Cart);
          break;
        }
      }
      if (itemsInCart[0].includes('leaves'))
        res.render('leaves', { labelL: "Item is already in your cart." });
      else {
        client.db('NetworkersProject').collection('UsersCollection').findOneAndUpdate(
          {
            username: req.session.user.username
          },
          {
            $addToSet: {
              Cart: 'leaves',
            },
          });
        res.render('leaves', { labelL: "Item added to cart successfully." });
      }
    }
    main().catch(console.error);
  })
});
app.get('/cart', redirectlogin, function (req, res) {
  console.log(req.session.user.username);
  async function main() {
    var cartToBeRendered = new Array();
    var arr = await client.db('NetworkersProject').collection('UsersCollection').find().toArray();
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].username == req.session.user.username) {
        var cartArr = new Array(arr[i].Cart);
        for (var i = 0; i < cartArr[0].length; i++) {
          if (cartArr[0][i] == 'sun')
            cartToBeRendered.push("The Sun and Her Flowers");

          else if (cartArr[0][i] == 'leaves')
            cartToBeRendered.push("Leaves of Grass");

          else if (cartArr[0][i] == 'galaxy')
            cartToBeRendered.push("Galaxy S21 Ultra");

          else if (cartArr[0][i] == 'iphone')
            cartToBeRendered.push("iPhone 13 Pro");

          else if (cartArr[0][i] == 'boxing')
            cartToBeRendered.push("Boxing Bag");

          else if (cartArr[0][i] == 'tennis')
            cartToBeRendered.push("Tennis Racket");
        }
        break;
      }
    }
    res.render('cart', { label1: cartToBeRendered });
  }
  main().catch(console.error);
});

client.close();


if (process.env.PORT) {
  app.listen(process.env.PORT, function () { console.log('Server started') });
}
else {
  app.listen(3000, function () { console.log('Server started on port 3000') });
}
