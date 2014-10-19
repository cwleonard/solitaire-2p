function showError() {
	
	$('#scores').hide();
	$('#newGame').hide();
	$('#shareInfo').hide();
	$('#errorInfo').show();
	
}


function performCardFlip(cdiv, cdata) {
	
	cdiv.removeClass('card-back');
	cdiv.addClass('card-front');
	cdiv.addClass(cdata.suit);
	cdiv.html(getCardFaceHtml(cdata));
	cdiv[0].card = cdata;
	
	cdiv.draggable("option", "disabled", false);

}

function performCardFlipOffStack(cdiv, cdata) {
	
	cdiv.unbind('click');

	var p = $('#discard').position();
	
	cdiv.removeClass('card-back');
	cdiv.addClass('card-front');
	cdiv.addClass(cdata.card.suit);
	cdiv.html(getCardFaceHtml(cdata.card));
	
	cdiv.css('left', p.left + 'px');
	cdiv.css('top', p.top + 'px');
	
	cdiv.zIndex(cdata.z);

	cdiv[0].card = cdata.card;

	cdiv.draggable("option", "disabled", false);
	
}

function flipCard() {
	
	if (!this.card.faceUp) {
		
		var cardDiv = this;
		checkFlip(cardDiv.card.id, function(data) {
			performCardFlip($(cardDiv), data);
		});

	}
	
}

function flipCardOffStack() {

	var cardDiv = this;

	checkFlipOffStack(cardDiv.card.id, function(data) {
		performCardFlipOffStack($(cardDiv), data);
	});

}

function performStackReset(data) {
	
	// loop through data and put cards back on stack

	var p = $('#stack').position();
	for (var i = 0; i < data.length; i++) {
		
		var c = $('#' + data[i].id);
		
		$(c).draggable("option", "disabled", true);
		
		$(c).removeClass('card-font');
		$(c).addClass('card-back');
		$(c).html('');
		
		$(c).css('left', p.left + 'px');
		$(c).css('top', p.top + 'px');
		$(c).zIndex(i+1);
		
		$(c).unbind('click');
		$(c).click(flipCardOffStack);
		
		if (10 % (i+1) === 0) {
			p.left += window.STACK_OFFSET;
		}
		
	}
	
}

function resetStack() {
	
	checkResetStack(function(data) {
		performStackReset(data);
	});
	
}

function updateScore(data) {
	
	$('#p' + data.num + '-score').html(data.name + ": " + data.score);
	
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
		p.top += CARD_OFFSET;
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

	if (this.abortDrag) {
		
		this.abortDrag = false;
		this.dropped = false;
		
		return;
		
	}
	
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

						zStart = data.zi || $(cardDiv.droppedOn).zIndex() + 1;

						if (data.onBase) {
							p.top += CARD_OFFSET;
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
						if (window.sckt) {
							window.sckt.emit('stop_drag_card', {
					    		cardId: cardDiv.card.id
					    	});
						}
					}

					fixZIndex(cardDiv, zStart);

				});
				
			} else {
				console.log('invalid card-on-card placement (on face-down card)');
				animateCard(this, this.returnPos);
				fixZIndex(this, zStart);
				if (window.sckt) {
					window.sckt.emit('stop_drag_card', {
			    		cardId: this.card.id
			    	});
				}
			}
			
		} else if ($(this.droppedOn).hasClass('base')) {

			var bn = Number($(this.droppedOn).attr('bnum'));
			var cardDiv = this;
			
			checkCardToBaseMove(cardDiv.card.id, bn, function(data) {
				
				if (data.ok) {
					
					console.log('valid card-on-base placement');
					
					zStart = 1;
					
					// stuff for the html...
					if (cardDiv.cardUnder) {
						cardDiv.cardUnder.onTop = null;
					}
					cardDiv.cardUnder = null;
					animateCard(cardDiv, p);

				} else {
					console.log('invalid card-on-base placement');
					animateCard(cardDiv, cardDiv.returnPos);
					if (window.sckt) {
						window.sckt.emit('stop_drag_card', {
				    		cardId: cardDiv.card.id
				    	});
					}
				}

				fixZIndex(cardDiv, zStart);

			});

		} else if ($(this.droppedOn).hasClass('foundation')) {
			
			var fn = Number($(this.droppedOn).attr('fnum'));
			var cardDiv = this;

			checkCardToFoundationMove(cardDiv.card.id, fn, function(data) {

				if (data.ok) {

					console.log('valid card-on-foundation placement');

					zStart = 1;
					
					// stuff for the html...
					if (cardDiv.cardUnder) {
						cardDiv.cardUnder.onTop = null;
					}
					cardDiv.cardUnder = null;
					animateCard(cardDiv, p);

				} else {
					console.log('invalid card-on-foundation placement');
					animateCard(cardDiv, cardDiv.returnPos);
					if (window.sckt) {
						window.sckt.emit('stop_drag_card', {
				    		cardId: cardDiv.card.id
				    	});
					}
				}
				
				fixZIndex(cardDiv, zStart);
				
			});
			
		}
		
	} else {
		console.log('not a valid drop target');
		animateCard(this, this.returnPos);
		fixZIndex(this, zStart);
		if (window.sckt) {
			window.sckt.emit('stop_drag_card', {
	    		cardId: this.card.id
	    	});
		}
	}
	
	this.dropped = false;
	
}

function animateCard(card, pos, duration, cb) {
	
	var d = duration || 500;
	
	var crd = $(card);
	crd.draggable("option", "disabled", true);
	crd.animate({
		left: pos.left,
		top: pos.top
	}, d, function() {
		crd.draggable("option", "disabled", false);
		crd.removeClass('dragging');
		if (cb) {
			cb();
		}
	});
	
	if (card.onTop) {
		pos.top += CARD_OFFSET;
		animateCard(card.onTop, pos);
	}
	
}

function moveAlong(e, pos) {
	
	if (e.onTop) {
		$(e.onTop).css('left', pos.left + 'px');
		$(e.onTop).css('top', (pos.top + CARD_OFFSET) + 'px');
		$(e.onTop).zIndex($(e).zIndex() + 1);
		$(e.onTop).droppable("option", "disabled", true);
		moveAlong(e.onTop, $(e.onTop).position());
	}
	
}

function cardDrag(event, ui) {
	if (this.abortDrag) {
		return false;
	} else {
		moveAlong(this, ui.position);
		if (window.sckt) {
			window.sckt.emit('drag_card', {
				cardId: this.card.id,
				pos: {
					top: ui.position.top / window.S_FACTOR,
					left: ui.position.left / window.S_FACTOR,
				}
			});
		}
	}
}

function cardStart(event, ui) {
	this.dropped = false;
	this.returnPos = ui.offset;
	this.lastZ = $(this).zIndex();
	$(this).zIndex(999);
	$(this).addClass('dragging');
	if (window.sckt) {
		window.sckt.emit('start_drag_card', {
			cardId: this.card.id
		});
	}
}

function getSuitImg(s) {
	
	return '<img src="/img/suit_' + s + '.png"/>';
	
}

function getCardFaceHtml(c) {
	
	var html = '<div class="card-val">' + c.face + ' ' + getSuitImg(c.suit) + '</div>';
	html += '<div class="card-val-bottom">' + c.face + ' ' + getSuitImg(c.suit) + '</div>';
	return html;
}

function createCardDiv(card, parent) {
	
	var c = document.createElement('div');
	$(c).attr('id', card.id);
	$(c).addClass('card');
	if (card.faceUp) {
		$(c).addClass('card-front');
		$(c).html(getCardFaceHtml(card));
		$(c).addClass(card.suit);
	} else {
		$(c).addClass('card-back');
		$(c).click(flipCard);
	}
	c.card = card;
	
	parent.append(c);

	$(c).draggable({
		start: cardStart,
		drag: cardDrag,
		stop: cardStop,
		disabled: (!card.faceUp)
	});
	
    $(c).droppable({
    	accept: '.card',
    	drop: cardDrop
    });

	return c;

}


function setupGame(data) {
	
	// check our size (phone, tablet, desktop, etc)
	var cSize = $('#stack').css('width');
	if (cSize === '75px') {
		// biggest
		window.S_FACTOR = 1.875;
		window.CARD_OFFSET = 30;
		window.STACK_OFFSET = 4;
	} else if (cSize === '40px'){
		// medium
		window.S_FACTOR = 1;
		window.CARD_OFFSET = 16;
		window.STACK_OFFSET = 2;
	} else {
		// smallest
		window.S_FACTOR = 0.90;
		window.CARD_OFFSET = 14;
		window.STACK_OFFSET = 2;
	}
	
	for (var i = 0; i < data.bases.length; i++) {
		
		var s = data.bases[i];
		var b = $('#base-' + (i+1));
		var p = b.position();
	
		var lastCard = null;
		for (var j = 0; j < s.length; j++) {
		
			var c = createCardDiv(s[j], $('#table'));
			if (lastCard) {
				lastCard.onTop = c;
			}
			c.cardUnder = lastCard;
			$(c).css('left', p.left + 'px');
			$(c).css('top', p.top + 'px');
			$(c).zIndex(j+1);
			
			p.top += CARD_OFFSET;
			
			lastCard = c;
		
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
			p.left += window.STACK_OFFSET;
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
	
	$('#shareInfo').show();
	
	// connect via socket.io
	var urlParts = window.location.href.split("/");
	var cUrl = urlParts[0] + "//" + urlParts[2];
	if (!window.location.port) {
		cUrl += ':5000';
	}
    window.sckt = io.connect(cUrl, { reconnection: false });
    window.sckt.on("connect", function() {

    	window.sckt.emit('join', {
    		gameId: window.gameId,
    		playerId: window.playerId
    	});
    		
        console.log("socket connected");
        
    });

    window.sckt.on("disconnect", function() {
        console.log("socket disconnected");
        showError();
    });

    window.sckt.on("player_join", function(data) {
    	console.log('player ' + data.name + ' joined the game');
    	$('#p' + data.num + '-score').html(data.name + ": " + data.score);
    });

    window.sckt.on("player_leave", function(data) {
    	console.log('player ' + data.name + ' left the game');
    	$('#p' + data.num + '-score').html("Player " + data.num + ": 0");
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

    window.sckt.on("score_point", function(data) {
    	updateScore(data);
    });

    window.sckt.on("drag_card", function(data) {
    	data.pos.top = data.pos.top * window.S_FACTOR;
    	data.pos.left = data.pos.left * window.S_FACTOR;
    	var cdiv = $('#'+data.cardId);
		cdiv.css('left', data.pos.left + 'px');
		cdiv.css('top', data.pos.top + 'px');
    	moveAlong(cdiv[0], data.pos);
    });
    
    window.sckt.on("start_drag_card", function(data) {
    	var cdiv = $('#'+data.cardId);
    	cdiv.draggable("option", "disabled", true);
    	cdiv[0].dropped = false;
    	cdiv[0].returnPos = cdiv.position();
    	cdiv[0].lastZ = cdiv.zIndex();
    	cdiv.zIndex(999);
    	cdiv.addClass('dragging');
    });
    
    window.sckt.on("stop_drag_card", function(data) {
    	var cdiv = $('#'+data.cardId);
		animateCard(cdiv[0], cdiv[0].returnPos, 200, function() {
			var zzz = data.zi || cdiv[0].lastZ || 1;
			fixZIndex(cdiv[0], zzz);
		});
    });
    
    window.sckt.on("abort_drag", function(data) {
    	var cdiv = $('#'+data.cardId);
    	cdiv[0].abortDrag = true;
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
	
	if (window.sckt && !window.sckt.connected) {
		showError();
	}
	
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

	if (window.sckt && !window.sckt.connected) {
		showError();
	}

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

	if (window.sckt && !window.sckt.connected) {
		showError();
	}

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

	if (window.sckt && !window.sckt.connected) {
		showError();
	}

	var info = {
			gid: window.gameId,
			pid: window.playerId
		};
	$.post("/move-card/" + cid + "/to-card/" + tid, info, function(data) {
		callback(data);
	}, "json").fail(function() {
		callback({
			ok: false
		});
	});;
	
}

function checkCardToBaseMove(cid, bn, callback) {

	if (window.sckt && !window.sckt.connected) {
		showError();
	}

	var info = {
			gid: window.gameId,
			pid: window.playerId
		};
	$.post("/move-card/" + cid + "/to-base/" + bn, info, function(data) {
		callback(data);
	}, "json").fail(function() {
		callback({
			ok: false
		});
	});
	
}

function checkCardToFoundationMove(cid, fn, callback) {

	if (window.sckt && !window.sckt.connected) {
		showError();
	}

	var info = {
			gid: window.gameId,
			pid: window.playerId
		};
	$.post("/move-card/" + cid + "/to-foundation/" + fn, info, function(data) {
		callback(data);
	}, "json").fail(function() {
		callback({
			ok: false
		});
	});
	
}


function joinGame(gid, pid, pname) {
	
	var pinfo = {
		id: pid,
		name: pname
	};
	
	$.post("/join/" + gid, pinfo, function(data) {

		window.playerId = pid;
		window.playerName = pname;
		window.gameId = gid;
		setupGame(data);

	}, "json");
	
}

function promptNewGame() {
	$('#joinTitle').html("Create New Game");
	$('#modMessage').hide();
	$('#joinGameModal').modal('show');
}

function joinExistingGame(gid) {
	
	$.get("/game-info/" + gid, function(data) {

		if (data.length > 0) {

			var pname = $('#playerName').val();
			var pid = data[0];
			$('#joinGameModal').modal('hide');
			joinGame(gid, pid, pname);

			$('#scores').show();
			$('#newGame').hide();
		
		} else {

			$('#modMessage').html("Game \"" + gid + "\" already has 2 players. Sorry. Try making a new one");
			$('#modMessage').show();
			
			$('#newGameButton').unbind();
			$('#newGameButton').click(promptNewGame);
			$('#joinButton').unbind();
			$('#joinButton').click(createNewGame);
		
		}

	}, "json").fail(function() {
		
		$('#modMessage').html("Unable to load game \"" + gid + "\". Sorry. Try making a new one");
		$('#modMessage').show();
		
		$('#newGameButton').unbind();
		$('#newGameButton').click(promptNewGame);
		$('#joinButton').unbind();
		$('#joinButton').click(createNewGame);
		
	});
	
}

function createNewGame() {

	$.post("/create", function(data) {

		$('#scores').show();
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
				history.pushState(stateObj, "game " + gid, '/game/' + gid);
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
	
	$('#shareGameModal').on('show.bs.modal', function(e) {
		$('#shareUrl').val(window.location.href);
	});
	
	$('#inviteButton').click(function() {
		$('#shareGameModal').modal('show');
	});
	
	$('#reloadButton').click(function() {
		window.location.reload();
	});
	
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

