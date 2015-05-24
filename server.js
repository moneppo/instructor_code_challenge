var express = require('express');
var app = express();
var fs = require('fs');
var path = require('path');

// Forgot to require the body parser
var bodyParser = require('body-parser');

// Fixed various missing parenthesis and close-braces

app.set('port', (process.env.PORT || 3000));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

// This line is redundant
// app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/favorites', function(req, res){
  var data = fs.readFileSync('./data.json');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

// Using readFileSync works fine. Another, more Node-like way to implement this 
// route, given that the database is simply a file, would be to use sendFile:
app.get('/favorites-alt', function(req, res) {
	res.setHeader('Content-Type', 'application/json');
	res.sendFile(path.join(__dirname, 'data.json'), function(err) {
		if (err) {
			res.status(error);
			res.end();
		}
	});
});

// The original implementation used an array as the base for the cached 
// favorites. This means that if the user favorites the same movie twice,
// there would be duplicates in the favorites list. 

// By making the cached favorites an object instead, favoriting the same movie
// will simply overwrite that entry. Keep in mind this changes the API 
// contract slightly as now the returned JSON is an object, not an array.

app.post('/favorites', function(req, res){
  if(!req.body.name || !req.body.oid){
    res.send('Error: missing name or ID.');
    return;
	}

  var data = JSON.parse(fs.readFileSync('./data.json'));
	
  data[req.body.name] = req.body.oid;
	
  fs.writeFile('./data.json', JSON.stringify(data));
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

// Also, while readFileSync works for this basic scenario, it will keep Node 
// from accepting future requests in high-load server environment. Here is an 
// implementation that works asynchronously:
app.post('/favorites-alt', function(req, res) {
	if(!req.body.name || !req.body.oid) {
    res.send('Error: missing name or ID.');
    return;
	}

	fs.readFile('./data.json', function(err, fileData) {
		if (err) {
			res.status(error);
			res.end();
			return;
		}
		
		var data = JSON.parse(fileData);
		data[req.body.name] = req.body.oid;
	
  	fs.writeFile('./data.json', JSON.stringify(data));
  	res.setHeader('Content-Type', 'application/json');
  	res.send(data);
	});
});

app.listen(app.get('port'), function(){
  console.log("Listening on port " + app.get('port'));
});