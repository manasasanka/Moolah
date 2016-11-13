var express = require('express');
var app = express(),
    bodyParser = require('body-parser');
var http = require('http');

var accountId, transactionHistory, longlat,
    transactionById={};
var categories = {};
var avergs = [];

var foursquare = require('node-foursquare-venues')('U4025PGPA5XYX5REYBOWI3EPMOHPFRA5IZFV5T0QWIYQLNSK', 'B5ADJ1325H0ZOTITCZ450HMYG4GI0FPORQPS5LSAZN5XJPFO', '20140806', 'foursquare');


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


app.get('/', function(request, response) {
  response.render('pages/index');
});

//endpoint call
//intuit-mint.herokuapp.com/api/v1/user/transactions

var options = {
  host: 'intuit-mint.herokuapp.com',
  path: '/api/v1/user/transactions'
};

callback = function(response) {
  var str = '';

  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
    str += chunk;
  });

  //the whole response has been recieved, so we just print it out here
  response.on('end', function () {
    //console.log(str);
    transactionHistory = JSON.parse(str);   //store JSON of transaction history globally
    //store JSON info associated by ID
    for (var transacInd in transactionHistory){
      if (transactionById[transactionHistory[transacInd].accountId])
        transactionById[transactionHistory[transacInd].accountId].push(transactionHistory[transacInd])
      else {
        transactionById[transactionHistory[transacInd].accountId] = []
        transactionById[transactionHistory[transacInd].accountId].push(transactionHistory[transacInd]);
      }
    }
    console.log('pending:' + transactionHistory[0].accountId);
  });
};


function avgs(transactions){
  //var fdcount = 0;  //money spent on food and drinks
  console.log("here");
  var fdamt = 0;
  var fduser =0;
  //var ecount = 0;   //money spent on entertainment
  var eamt = 0;
  var euser=0;
  //var scount = 0;   //shopping count
  var samt = 0;
  var suser=0;
  //var tcount = 0;   //transportation count
  var tamt = 0;
  var tuser=0;
  // var ocount= 0;    //other count
  var oamt = 0;
  var ouser=0;
  //var total = 0;
  //var totalamt = 0;

  var uniqueusers = [];
  for (var i in transactions) {
    var count=0;
    var obj = transactions[i];
    if (uniqueusers.indexOf(obj.accountId) == -1){
      uniqueusers.push(obj.accountId);
    }
    var cat = transactions[i].category;
    if(cat == "Fast Food" || cat == "Groceries" || cat == "Restaurants"|| cat == "Alcohol and Drinks" || cat == "Coffee")
    {
      fdamt+=obj.amount;
      if ( parseInt(transactions[i].accountId, 10) ==  parseInt(accountId,10)){
        fduser+=obj.amount;
        //count++;
      }
      count++;
    }
    else if(cat == "Entertainment")
    {
      eamt+=obj.amount;
      if ( parseInt(transactions[i].accountId, 10) ==  parseInt(accountId, 10)) {
        euser += obj.amount;
      }count++;
      //}
    }
    else if(cat == "Shopping" || cat == "Clothing")
    {
      //scount++;
      samt+=obj.amount;
      if ( parseInt(transactions[i].accountId, 10) ==  parseInt(accountId, 10)) {
        suser += obj.amount;
      }count++;
      //}
    }
    else if(cat == "Rental Car & Taxi"|| cat == "Public transportation" || cat == "Air Travel" || cat == "Travel")
    {
      //console.log(accountId);
      tamt+=obj.amount;
      //console.log("i",transactions[i].accountId);
      if (parseInt(transactions[i].accountId, 10) == parseInt(accountId, 10)) {
        tuser += obj.amount;
      }count++;
      //}
    }
    else if(obj.amount<0){
      //ocount++;
      oamt+=obj.amount;
      if (parseInt(transactions[i].accountId, 10) == parseInt(accountId, 10)){
        ouser+=obj.amount;
        count++;
      }
    }
    if(obj.amount<0)
    {
      //total++;
      //totalamt += obj.amount;
    }
    var lookup = {};
    var result = [];
    var name = transactions[i].accountId;

    if (!(name in lookup)) {
      lookup[name] = 1;
      result.push(name);
    }
  }
  var avgs = [];
  //console.log("count" + count);

  /*fduser=fdamt;
   euser=eamt;
   suser=samt;
   tuser=tamt;
   ouser=oamt;*/

  fdamt=fdamt/uniqueusers.length;
  eamt=eamt/uniqueusers.length;
  samt=samt/uniqueusers.length;
  tamt=tamt/uniqueusers.length;
  omt=oamt/uniqueusers.length;

  //console.log("fuser" + fduser + "fdamt" + fdamt);
  avgs.push(fdamt);
  avgs.push(eamt);
  avgs.push(samt);
  avgs.push(tamt);
  avgs.push(oamt);

  console.log(fduser, "AND ", euser, "AND", suser, "AMTS ", fdamt, "AND", eamt)
  avgs.push(fduser);
  avgs.push(euser);
  avgs.push(suser);
  avgs.push(tuser);
  avgs.push(ouser);

  return avgs;
};


app.post('/avg', function(req, res) {
  // avergs = avgs(transactionHistory);
  res.send(JSON.stringify(avgs(transactionHistory)));
});




http.request(options, callback).end();

app.post('/sendId', function (req, res){
  accountId=req.body["accountId"];
  longlat = req.body["location"];
  //severe = req.body["severity"];
  console.log("ID IS : ",accountId, longlat);
//  console.log("Transactions for account: ", transactionById[accountId]);
  res.send(JSON.stringify(transactionById[accountId]));
});




// app.get('/login', function(req, res) {
//   res.writeHead(303, { 'location': foursquare.getAuthClientRedirectUrl() });
//   res.end();
// });
//
//
// app.get('/callback', function (req, res) {
//   foursquare.getAccessToken({
//     code: req.query.code
//   }, function (error, accessToken) {
//     if(error) {
//       res.send('An error was thrown: ' + error.message);
//     }
//     else {
//       // Save the accessToken and redirect.
//res.redirect('/test?token='+accessToken);
//       console.log("ACCESS", accessToken);
//     }
//   });
// });

// foursquare.getVenue('4d4b7105d754a06374d81259', function (error, response) {
//   if (error) {return console.error(error)}
//     console.log(response);
// })

// describe('the foursquare node api', function() {
//   this.timeout(5000);
//   describe('the venues methods', function () {
//     describe('venues#venue()', function () {
//       it('gets a venue', function (done) {
//         foursquare.venues.venue('40a55d80f964a52020f31ee3', function (err, resp) {
//           assert.isNull(err);
//           assert.isObject(resp);
//           done();
//         });
//       });
//     });
//   });
// });


// foursquare.getVenue('40a55d80f964a52020f31ee3', function(error, response) {
//   if (error) { return console.error(error) }
//   console.log("YAY", response);
// });
//
// foursquare.searchVenues({ near: 'New York' }, function(error, response) {
//   if (error) { return console.error(error) }
//   console.log("YAY2", response);
// });


app.post('/categoryRecommendations', function (req, res) {
  var inp =req.body;  //array of categories that need recs
  //format of inp: {category: severity, category:severity, ...}

  food();
  function food(){
    foursquare.venues.search( {ll: longlat, categoryId: '4d4b7105d754a06374d81259', limit: 20}, function(err, resp){
      categories["food"]=[]
      //console.log('resp' + resp.response.venues);
      for (i in resp.response.venues){
        //if (resp.response.venues[i].price <= inp["food"] && categories["food"].length<20) {
        categories["food"].push(resp.response.venues[i])
        //console.log("SHOP ", resp.response.venues[i])
        //}
      }

      //console.log(categories["food"])
    });
    //console.log(categories)

    entertainment();
  }

  function entertainment(){
    foursquare.venues.search( {ll: longlat, categoryId: '4d4b7104d754a06370d81259', limit: 20}, function(err, resp){
      categories["entertainment"]=[]
      for (i in resp.response.venues){
        categories["entertainment"].push(resp.response.venues[i])
      }
    });
    transportation();
  }
  function transportation(){
    foursquare.venues.search( {ll: longlat, categoryId: '4d4b7105d754a06379d81259', limit: 20}, function(err, resp){
      categories["transportation"]=[]
      for (i in resp.response.venues){
        categories["transportation"].push(resp.response.venues[i])
      }

    });
    console.log('trp' + categories["food"]);

    shopping();
  }

  function shopping(){
    foursquare.venues.search( {ll: longlat, categoryId: '4d4b7105d754a06378d81259', limit: 20}, function(err, resp){
      categories["shopping"]=[]
      for (i in resp.response.venues){
        categories["shopping"].push(resp.response.venues[i])
      }
    })
    done();
  }
  function done(){
    console.log('kat',categories);
    res.send(JSON.stringify(categories));
  }
  //send recommendations by category

});


app.get('/trans', function(request,response){
  var str = '';

  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
    str += chunk;
  });

  //the whole response has been recieved, so we just print it out here
  response.on('end', function () {
    console.log(str);
    var obj = JSON.parse(str);
    console.log(obj.pending);
    console.log(obj.accountId);
  });
});

//app.listen(app.get('port'), function() {
app.listen(63342, function(){
  console.log('Node app is running on port', app.get('port'));
});


