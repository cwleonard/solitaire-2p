var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var solitaire = require('./solitaire.js')();
var http = require('http');

var app = express();

app.use(bodyParser());

var server = http.Server(app);
var io = require('socket.io')(server);


var games = {};


io.on('connection', function(socket) {
	socket.on('join', function(data) {
		var gid = data.gameId;
		var pid = data.playerId;
		socket['game_id'] = gid;
		socket['player_id'] = pid;
		if (games[gid]) {
			games[gid].connectPlayer(pid, socket);
		}
	});
	socket.on("disconnect", function() {
		var gid = socket['game_id'];
		var pid = socket['player_id'];
		if (games[gid]) {
			games[gid].disconnectPlayer(pid);
		}
	});
	console.log('connection!');
});


// ------------ static content
app.use(express.static('public'));

app.get('/game/:gid', function(req, res, next) {
	fs.readFile('public/index.html', function(err, data) {
		res.setHeader('Content-Type', 'text/html');
		res.status(200).send(data);
	});
});

app.post('/join/:n', function(req, res, next) {
	
	var gid = req.params.n;
	var pinfo = req.body;
	res.send(games[gid].joinGame(pinfo));
	
});

app.get('/game-info/:n', function(req, res, next) {
	
	var gid = req.params.n;
	res.send(games[gid].getInfo());
	
});

app.post('/move-card/:c1/to-card/:c2', function(req, res, next) {
	
	var gid = req.body.gid;
	var pid = req.body.pid;
	var ok = games[gid].moveCardToCard(req.params.c1, req.params.c2, pid);
	res.send({
		ok: ok,
		onBase: games[gid].isCardOnBase(req.params.c1)
	});
	
});

app.post('/move-card/:c/to-base/:bn', function(req, res, next) {
	
	var gid = req.body.gid;
	var pid = req.body.pid;
	var ok = games[gid].moveCardToBaseNumber(req.params.c, req.params.bn, pid);
	res.send({
		ok: ok
	});
	
});

app.post('/move-card/:c/to-foundation/:fn', function(req, res, next) {
	
	var gid = req.body.gid;
	var pid = req.body.pid;
	var ok = games[gid].moveCardToFoundationNumber(req.params.c, req.params.fn, pid);
	res.send({
		ok: ok
	});
	
});

app.post('/flip/:c', function(req, res, next) {
	
	var gid = req.body.gid;
	var pid = req.body.pid;
	var cData = games[gid].flipCard(req.params.c, pid);
	res.send({
		ok: (cData === null ? false : true),
		data: cData
	});
	
});

app.post('/from-stack/:c', function(req, res, next) {
	
	var gid = req.body.gid;
	var pid = req.body.pid;
	var cData = games[gid].fromStack(req.params.c, pid);
	res.send({
		ok: (cData === null ? false : true),
		data: cData
	});
	
});

app.post('/reset-stack', function(req, res, next) {
	
	var gid = req.body.gid;
	var pid = req.body.pid;
	var resp = games[gid].resetStack(pid);
	res.send({
		ok: (resp === null ? false : true),
		data: resp
	});
	
});

app.post('/create', function(req, res, next) {
	
	var g = solitaire.newGame();
	console.log('created new game "' + g.getId() + '"');
	games[g.getId()] = g;
	res.send({
		gameId: g.getId()
	});
	
});


// ------------ start the listening

var srv = server.listen(5000, function() {
	console.log('listening on port %d', srv.address().port);
});

