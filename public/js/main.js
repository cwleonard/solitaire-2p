function performCardFlip(cdiv, cdata) {
	
	$(cdiv).removeClass('card-back');
	$(cdiv).addClass('card-front');
	$(cdiv).addClass(cdata.suit);
	$(cdiv).html(cdata.face);
	cdiv.card = cdata;
	
	$(cdiv).draggable({
		start: cardStart,
		drag: cardDrag,
		stop: cardStop
	});

	
}

function performCardFlipOffStack(cdiv, cdata) {
	
	$(cdiv).unbind('click');

	var p = $('#discard').position();
	
	$(cdiv).removeClass('card-back');
	$(cdiv).addClass('card-front');
	$(cdiv).addClass(cdata.card.suit);
	$(cdiv).html(cdata.card.face);
	
	$(cdiv).css('left', p.left + 'px');
	$(cdiv).css('top', p.top + 'px');
	
	$(cdiv).zIndex(cdata.z);

	cdiv.card = cdata.card;

	$(cdiv).draggable({
		start: cardStart,
		drag: cardDrag,
		stop: cardStop
	});
	
	
}

function flipCard() {
	
	if (!this.card.faceUp) {
		
		var cardDiv = this;
		checkFlip(cardDiv.card.id, function(data) {
			performCardFlip(cardDiv, data);
		});

	}
	
}

function flipCardOffStack() {

	var cardDiv = this;

	checkFlipOffStack(cardDiv.card.id, function(data) {
		performCardFlipOffStack(cardDiv, data);
	});

}

function performStackReset(data) {
	
	// loop through data and put cards back on stack

	var p = $('#stack').position();
	for (var i = 0; i < data.length; i++) {
		
		var c = $('#' + data[i].id);
		
		$(c).removeClass('card-font');
		$(c).addClass('card-back');
		$(c).html('');
		
		$(c).css('left', p.left + 'px');
		$(c).css('top', p.top + 'px');
		$(c).zIndex(i+1);
		
		$(c).unbind('click');
		$(c).click(flipCardOffStack);
		
		if (10 % (i+1) === 0) {
			p.left += 2;
		}
		
	}
	
}

function resetStack() {
	
	checkResetStack(function(data) {
		performStackReset(data);
	});
	
}


function fixZIndex(e, startAt) {
	
	while (e) {
		$(e).zIndex(startAt++);
		$(e).droppable("option", "disabled", false);
		e = e.onTop;
	}
	
}

function cardDrop(event, ui) {
	ui.draggable[0].dropped = true;
	ui.draggable[0].droppedOn = this;
}

function performCardToCardMove(data) {
	
	var moveDiv = $('#'+data.moveId);
	var targetDiv = $('#'+data.targetId);
	
	var p = targetDiv.position();
	zStart = targetDiv.zIndex() + 1;

	if (data.onBase) {
		p.top += 25;
	}

	// stuff for the html...
	if (moveDiv[0].cardUnder) {
		moveDiv[0].cardUnder.onTop = null;
	}
	targetDiv[0].onTop = moveDiv[0];
	moveDiv[0].cardUnder = targetDiv[0];
	animateCard(moveDiv[0], p);

	fixZIndex(moveDiv[0], zStart);
	
}

function performCardToFoundationMove(data) {
	
	var fn = Number(data.foundationNum);
	
	var moveDiv = $('#'+data.moveId);
	var targetDiv = $('#foundation-'+(fn+1));
	
	var p = targetDiv.position();
	zStart = targetDiv.zIndex() + 1;

	// stuff for the html...
	if (moveDiv[0].cardUnder) {
		moveDiv[0].cardUnder.onTop = null;
	}
	moveDiv[0].cardUnder = null;
	animateCard(moveDiv[0], p);

	fixZIndex(moveDiv[0], zStart);
	
}

function performCardToBaseMove(data) {
	
	var bn = Number(data.baseNum);
	
	var moveDiv = $('#'+data.moveId);
	var targetDiv = $('#base-'+(bn+1));
	
	var p = targetDiv.position();
	zStart = targetDiv.zIndex() + 1;

	// stuff for the html...
	if (moveDiv[0].cardUnder) {
		moveDiv[0].cardUnder.onTop = null;
	}
	moveDiv[0].cardUnder = null;
	animateCard(moveDiv[0], p);

	fixZIndex(moveDiv[0], zStart);
	
}

function cardStop(event, ui) {
	
	var zStart = this.lastZ || 1;
	
	if (this.dropped) {
		
		var p = $(this.droppedOn).position();

		// what were we dropped on?
		if ($(this.droppedOn).hasClass('card')) {
			
			var target = this.droppedOn.card;
			if (target.faceUp) {
				
				var cardDiv = this;
				
				checkCardToCardMove(cardDiv.card.id, target.id, function(data) {

					if (data.ok) {

						console.log('valid card-on-card placement');

						zStart = $(cardDiv.droppedOn).zIndex() + 1;

						if (data.onBase) {
							p.top += 25;
						}

						// stuff for the html...
						if (cardDiv.cardUnder) {
							cardDiv.cardUnder.onTop = null;
						}
						cardDiv.droppedOn.onTop = cardDiv;
						cardDiv.cardUnder = cardDiv.droppedOn;
						animateCard(cardDiv, p);

					} else {
						console.log('invalid card-on-card placement');
						animateCard(cardDiv, cardDiv.returnPos);
					}

					fixZIndex(cardDiv, zStart);

				});
				
			} else {
				console.log('invalid card-on-card placement (on face-down card)');
				animateCard(this, this.returnPos);
				fixZIndex(this, zStart);
			}
			
		} else if ($(this.droppedOn).hasClass('base')) {

			var bn = Number($(this.droppedOn).attr('bnum'));
			var cardDiv = this;
			
			checkCardToBaseMove(cardDiv.card.id, bn, function(data) {
				
				if (data.ok) {
					
					console.log('valid card-on-base placement');

					// stuff for the html...
					if (cardDiv.cardUnder) {
						cardDiv.cardUnder.onTop = null;
					}
					cardDiv.cardUnder = null;
					animateCard(cardDiv, p);

				} else {
					console.log('invalid card-on-base placement');
					animateCard(cardDiv, cardDiv.returnPos);
				}

				fixZIndex(cardDiv, zStart);

			});

		} else if ($(this.droppedOn).hasClass('foundation')) {
			
			var fn = Number($(this.droppedOn).attr('fnum'));
			var cardDiv = this;

			checkCardToFoundationMove(cardDiv.card.id, fn, function(data) {

				if (data.ok) {

					console.log('valid card-on-foundation placement');

					// stuff for the html...
					if (cardDiv.cardUnder) {
						cardDiv.cardUnder.onTop = null;
					}
					cardDiv.cardUnder = null;
					animateCard(cardDiv, p);

				} else {
					console.log('invalid card-on-foundation placement');
					animateCard(cardDiv, cardDiv.returnPos);
				}
				
				fixZIndex(cardDiv, zStart);
				
			});
			
		}
		
	} else {
		console.log('not a valid drop target');
		animateCard(this, this.returnPos);
		fixZIndex(this, zStart);
	}
	
	this.dropped = false;
	
}

function animateCard(card, pos) {
	
	$(card).animate({
		left: pos.left,
		top: pos.top
	}, 500);
	
	if (card.onTop) {
		pos.top += 25;
		animateCard(card.onTop, pos);
	}
	
}

function moveAlong(e, pos) {
	
	if (e.onTop) {
		$(e.onTop).css('left', pos.left + 'px');
		$(e.onTop).css('top', (pos.top + 25) + 'px');
		$(e.onTop).zIndex($(e).zIndex() + 1);
		$(e.onTop).droppable("option", "disabled", true);
		moveAlong(e.onTop, $(e.onTop).position());
	}
	
}

function cardDrag(event, ui) {
	moveAlong(this, ui.position);
}

function cardStart(event, ui) {
	this.dropped = false;
	this.returnPos = ui.offset;
	this.lastZ = $(this).zIndex();
	$(this).zIndex(999);
}

function createCardDiv(card, parent) {
	
	var c = document.createElement('div');
	$(c).attr('id', card.id);
	$(c).addClass('card');
	if (card.faceUp) {
		$(c).addClass('card-front');
		$(c).html(card.face);
		$(c).addClass(card.suit);
	} else {
		$(c).addClass('card-back');
		$(c).click(flipCard);
	}
	c.card = card;
	
	parent.append(c);

	if (card.faceUp) {
	    $(c).draggable({
	    	start: cardStart,
    		drag: cardDrag,
    		stop: cardStop
    	});
	}
	
    $(c).droppable({
    	accept: '.card',
    	drop: cardDrop
    });

	return c;

}


function setupGame(data) {
	
	for (var i = 0; i < data.bases.length; i++) {
		
		var s = data.bases[i];
		var b = $('#base-' + (i+1));
		var p = b.position();
	
		for (var j = 0; j < s.length; j++) {
		
			var c = createCardDiv(s[j], $('#table'));
			$(c).css('left', p.left + 'px');
			$(c).css('top', p.top + 'px');
			$(c).zIndex(j+1);
			
			p.top += 25;
		
		}
	
	}

	for (var i = 0; i < data.foundations.length; i++) {
		
		var s = data.foundations[i];
		var f = $('#foundation-' + (i+1));
		var p = f.position();
	
		for (var j = 0; j < s.length; j++) {
		
			var c = createCardDiv(s[j], $('#table'));
			$(c).css('left', p.left + 'px');
			$(c).css('top', p.top + 'px');
			$(c).zIndex(j+1);
		
		}
	
	}

	var p = $('#stack').position();
	for (var i = 0; i < data.stack.length; i++) {
		
		var c = createCardDiv(data.stack[i], $('#table'));
		$(c).css('left', p.left + 'px');
		$(c).css('top', p.top + 'px');
		$(c).zIndex(i+1);
		
		$(c).unbind('click');
		$(c).click(flipCardOffStack);
		
		if (10 % (i+1) === 0) {
			p.left += 2;
		}
		
	}

	p = $('#discard').position();
	for (var i = 0; i < data.discard.length; i++) {
		
		var c = createCardDiv(data.discard[i], $('#table'));
		$(c).css('left', p.left + 'px');
		$(c).css('top', p.top + 'px');
		$(c).zIndex(i+1);
		
	}
	
	var p1 = data.players[0];
	if (p1.name != null) {
		$('#p1-score').html(p1.name + ": " + p1.score);
	}
	var p2 = data.players[1];
	if (p2.name != null) {
		$('#p2-score').html(p2.name + ": " + p2.score);
	}
	
	// connect via socket.io
	
    window.sckt = io.connect('http://localhost:3000');
    window.sckt.on("connect", function() {
    	window.sckt.emit('join', {
    		gameId: window.gameId,
    		playerId: window.playerId
    	});
        console.log("socket connected");
    });
    
    window.sckt.on("player_join", function(data) {
    	console.log('player ' + data.name + ' joined the game');
    	$('#p' + data.num + '-score').html(data.name + ": " + data.score);
    });

    window.sckt.on("flip_card", function(data) {
    	performCardFlip($('#'+data.id), data);
    });

    window.sckt.on("flip_card_off_stack", function(data) {
    	performCardFlipOffStack($('#'+data.card.id), data);
    });

    window.sckt.on("reset_stack", function(data) {
    	performStackReset(data);
    });

    window.sckt.on("move_card_to_card", function(data) {
    	performCardToCardMove(data);
    });

    window.sckt.on("move_card_to_foundation", function(data) {
    	performCardToFoundationMove(data);
    });

    window.sckt.on("move_card_to_base", function(data) {
    	performCardToBaseMove(data);
    });

}

/**
 * Attempts to flip over a card. If allowed, callback will be called
 * and passed the card's data.
 * 
 * @param cid
 * @param callback
 */
function checkFlip(cid, callback) {
	
	var info = {
		gid: window.gameId,
		pid: window.playerId
	};
	$.post("/flip/" + cid, info, function(resp) {
		if (resp.ok) {
			callback(resp.data);
		}
	}, "json");
	
}

function checkFlipOffStack(cid, callback) {
	
	var info = {
		gid: window.gameId,
		pid: window.playerId
	};
	$.post("/from-stack/" + cid, info, function(resp) {
		if (resp.ok) {
			callback(resp.data);
		}
	}, "json");
	
}

function checkResetStack(callback) {
	
	var info = {
		gid: window.gameId,
		pid: window.playerId
	};
	$.post("/reset-stack/", info, function(resp) {
		if (resp.ok) {
			callback(resp.data);
		}
	}, "json");
	
}

function checkCardToCardMove(cid, tid, callback) {
	
	var info = {
			gid: window.gameId,
			pid: window.playerId
		};
	$.post("/move-card/" + cid + "/to-card/" + tid, info, function(data) {
		callback(data);
	}, "json");
	
}

function checkCardToBaseMove(cid, bn, callback) {
	
	var info = {
			gid: window.gameId,
			pid: window.playerId
		};
	$.post("/move-card/" + cid + "/to-base/" + bn, info, function(data) {
		callback(data);
	}, "json");
	
}

function checkCardToFoundationMove(cid, fn, callback) {
	
	var info = {
			gid: window.gameId,
			pid: window.playerId
		};
	$.post("/move-card/" + cid + "/to-foundation/" + fn, info, function(data) {
		callback(data);
	}, "json");
	
}


function joinGame(gid, pid, pname) {
	
	var pinfo = {
		id: pid,
		name: pname
	};
	
	$.post("/join/" + gid, pinfo, function(data) {

		console.log("joined game '" + gid + "'");
		window.playerId = pid;
		window.gameId = gid;
		setupGame(data);

	}, "json");
	
}

function promptNewGame() {
	$('#joinTitle').html("Create New Game");
	$('#joinGameModal').modal('show');
}

function joinExistingGame(gid) {
	
	$('#newGame').hide();
	
	console.log("joining game '" + gid + "'");
	
	$.get("/game-info/" + gid, function(data) {

		if (data.length > 0) {
			var pname = $('#playerName').val();
			var pid = data[0];
			$('#joinGameModal').modal('hide');
			joinGame(gid, pid, pname);
		} else {
			console.log('cant join, game is full');
		}

	}, "json");
	
}

function createNewGame() {

	$.post("/create", function(data) {

		$('#newGame').hide();
		
		var gid = data.gameId;
		console.log("created game '" + gid + "'");
		
		$.get("/game-info/" + data.gameId, function(data) {

			var p1name = $('#playerName').val();
			var p1id = data[0];
			$('#joinGameModal').modal('hide');
			joinGame(gid, p1id, p1name);
			
			var stateObj = { gameId: gid };
			if (history.pushState) {
				history.pushState(stateObj, "game " + gid, 'game/' + gid);
			} else {
				console.log('really? IE?');
			}

		}, "json");

	}, "json");
	
}

/**
 * sets up the foundations and bases as drop targets 
 */
$(function() {
	
	var path = window.location.pathname;
	if (path.indexOf('/game/') === 0) {

		var gid = path.substring(6);
		$('#joinButton').click(function() {
			joinExistingGame(gid);
		});
		$('#joinTitle').html("Join Game");
		$('#joinGameModal').modal('show');
		
	} else {

		$('#newGameButton').click(promptNewGame);
		$('#joinButton').click(createNewGame);

	}
	
	$('#stack').click(resetStack);
	
    $(".base").droppable({
    	accept: '.card',
    	drop: cardDrop
    });

    $(".foundation").droppable({
    	accept: '.card',
    	drop: cardDrop
    });

});

