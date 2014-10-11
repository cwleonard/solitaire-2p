module.exports = function() {

	var HEARTS   = 0;
	var CLUBS    = 1;
	var SPADES   = 2;
	var DIAMONDS = 3;
	
	var UP   = 11;
	var DOWN = 10;
	
	var RED   = 20;
	var BLACK = 21;
	
	var STACK      = 30;
	var DISCARD    = 31;
	var BASE       = 32;
	var FOUNDATION = 33;
	
	var htmlCode = ['&hearts;', '&clubs;', '&spades;', '&diams;'];
	var valueText = [ 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K' ];
	
	/**
	 * from http://byronsalau.com/blog/how-to-create-a-guid-uuid-in-javascript/
	 */
	function createGuid() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}
	
	function makeGameId() {
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	    for( var i=0; i < 5; i++ ) {
	        text += possible.charAt(Math.floor(Math.random() * possible.length));
	    }
	    return text;
	}
	
	function Card(s, v) {
		
		var id = createGuid();
		var suit = s;
		var value = v;
		var color = ( s === HEARTS || s === DIAMONDS ) ? RED : BLACK;
		var face = DOWN;
		var above = null;
		var below = null;
		var location = null;
		var locationType = null;
		
		this.getData = function() {
			return {
				id: id,
				faceUp: (face === UP ? true : false),
				suit: (face === UP ? this.getSuit() : null),
				value: (face === UP ? value : null),
				color: (face === UP ? color : null),
				face: (face === UP ? this.getFace() : null)
			};
		};
		
		this.getId = function() {
			return id;
		};
		
		this.getFace = function() {
			return valueText[value-1] + ' ' + htmlCode[suit];
		};
		
		this.getValue = function() {
			return value;
		};
		
		this.isFaceUp = function() {
			return (face === UP);
		};
		
		this.getSuit = function() {
			if (suit === HEARTS) {
				return "hearts";
			} else if (suit === CLUBS) {
				return "clubs";
			} else if (suit === SPADES) {
				return "spades";
			} else if (suit === DIAMONDS) {
				return "diamonds";
			}
		};
		
		this.flip = function() {
			if (face === UP) {
				face = DOWN;
			} else {
				face = UP;
			}
		};
		
		this.setLocationType = function(lt) {
			locationType = lt;
		};
		
		this.getLocationType = function() {
			return locationType;
		};
		
		this.setLocation = function(o) {
			location = o;
		};

		this.getLocation = function() {
			return location;
		};

		this.setCardBelow = function(otherCard) {
			below = otherCard;
		};
		
		this.setCardAbove = function(otherCard) {
			above = otherCard;
		};

		this.getCardBelow = function() {
			return below;
		};
		
		this.getCardAbove = function() {
			return above;
		};

		this.isTop = function() {
			return (above === null);
		};
		
		this.getColor = function() {
			return color;
		};
		
		this.accept = function(otherCard) {
			
			if (face === DOWN) {
				return false;
			} else if (locationType === STACK || locationType === DISCARD) {
				return false;
			} else if ( locationType === FOUNDATION && ( (otherCard.getValue() === (value + 1)) && (otherCard.getSuit() === this.getSuit()) ) ) {
				return true;
			} else if ( locationType === BASE && ((otherCard.getValue() === value - 1) && otherCard.getColor() !== color) ) {
				return true;
			} else {
				return false;
			}
			
		};
		
		this.moveTo = function(otherCard) {
			
			if (below !== null) {
				below.setCardAbove(null);
			}
			otherCard.setCardAbove(this);
			below = otherCard;
			
		};
		
	}
	
	function Deck() {
		
		var cards = [];

		for (var i = 0; i < 4; i++) {
			for (var j = 1; j <= 13; j++) {
				cards.push(new Card(i, j));
			}
		}
		
		//+ Jonas Raoni Soares Silva
		//@ http://jsfromhell.com/array/shuffle [v1.0]
		this.shuffle = function () { //v1.0
		    for(var j, x, i = cards.length; i; j = Math.floor(Math.random() * i), x = cards[--i], cards[i] = cards[j], cards[j] = x);
		};
		
		this.getCard = function() {
			return cards.pop();
		};
		
		this.size = function() {
			return cards.length;
		};
		
		this.shuffle();
		
	}
	
	function Game() {
		
		var id = makeGameId();
		
		var stack = [];
		var discard = [];
		
		var f0 = [];
		var f1 = [];
		var f2 = [];
		var f3 = [];
		
		var b0 = [];
		var b1 = [];
		var b2 = [];
		var b3 = [];
		var b4 = [];
		var b5 = [];
		var b6 = [];
		
		var bSet = [ b0, b1, b2, b3, b4, b5, b6 ];
		var fSet = [ f0, f1, f2, f3 ];
		
		var cardMap = {};
		
		var stackIndex = 0;
		
		var deck = new Deck();
		
		var player1 = {
			id: createGuid(),
			num: 1,
			name: null,
			score: 0,
			socket: null
		};
		var player2 = {
			id: createGuid(),
			num: 2,
			name: null,
			score: 0,
			socket: null
		};
		var players = {};
		players[player1.id] = player1;
		players[player2.id] = player2;
		
		// put cards on the 7 bases, flip over the top card in each
		
		for (var x = 0; x < 7; x++) {
			for (var y = 0; y < x + 1; y++) {
				var card = deck.getCard();
				cardMap[card.getId()] = card;
				card.setLocationType(BASE);
				card.setLocation(bSet[x]);
				bSet[x].push(card);
			}
		}

		for (var i = 0; i < bSet.length; i++) {
			bSet[i][bSet[i].length-1].flip();
		}
		
		// add the rest of the cards to the stack
		while (deck.size() > 0) {
			var sc = deck.getCard();
			cardMap[sc.getId()] = sc;
			sc.setLocationType(STACK);
			sc.setLocation(stack);
			stack.push(sc);
		}
		stackIndex = stack.length - 1;
		
		this.getId = function() {
			return id;
		}
		
		this.getBase = function(i) {
			return bSet[i];
		};

		this.getFoundation = function(i) {
			return fSet[i];
		};
		
		this.getStack = function() {
			return stack;
		};

		this.getDiscard = function() {
			return discard;
		};

		this.allowDrop = function(card) {
			return (card.getLocation()[card.getLocation().length - 1] === card);
		};
		
		this.getCardFromStack = function() {
			if (stackIndex < 0) {
				stackIndex = stack.length - 1;
			}
			var c = stack[stackIndex];
			if (!c.isFaceUp()) {
				c.flip();
			}
			stackIndex--;
			return c;
		};
		
		function addPoint(pid) {
			if (players[pid]) {
				var scorer = players[pid];
				console.log('player ' + scorer.id + ' scored a point');
				scorer.score++;
				for (var p in players) {
					var player = players[p];
					if (player.socket) {
						player.socket.emit("score_point", {
							name: scorer.name,
							num: scorer.num,
							score: scorer.score
						});
					}
				}
			}
		}
		
		this.isCardOnBase = function(cardId) {
			return (cardMap[cardId].getLocationType() === BASE);
		};
		
		this.flipCard = function(cardId, pid) {
			
			if (!players[pid]) {
				return null;
			}
			
			card = cardMap[cardId];

			if (!card.isFaceUp() && card.getLocationType() === BASE && card.getLocation()[card.getLocation().length - 1] === card) {
				card.flip();
				sendToOtherPlayer(pid, "flip_card", card.getData());
				return card.getData();
			} else {
				return null;
			}
			
		};

		this.fromStack = function(cardId, pid) {

			if (!players[pid]) {
				return null;
			}

			var card = cardMap[cardId];

			if (!card.isFaceUp() && card.getLocationType() === STACK && card.getLocation()[card.getLocation().length - 1] === card) {
				card.flip();
				stack.pop();
				// put on top of discard
				card.setLocationType(DISCARD);
				card.setLocation(discard);
				discard.push(card);
				var retData = {
					card: card.getData(),
					z: discard.length
				};
				sendToOtherPlayer(pid, "flip_card_off_stack", retData);
				return retData;
			} else {
				return null;
			}
			
		};
		
		this.resetStack = function(pid) {

			if (!players[pid]) {
				return null;
			}

			if (stack.length === 0) { // only reset if it is empty
				
				for (var d = discard.length - 1; d >= 0; d--) {
					var card = discard[d];
					card.flip();
					// put on top of stack
					card.setLocationType(STACK);
					card.setLocation(stack);
					stack.push(card);
				}
				discard = [];
				
				var stackData = [];
				for (var i = 0; i < stack.length; i++) {
					stackData.push(stack[i].getData());
				}
				sendToOtherPlayer(pid, "reset_stack", stackData);
				return stackData;
				
			} else {
				return null;
			}
			
		};

		this.moveCardToCard = function(cardId, targetId, pid) {
			
			var target = cardMap[targetId];
			
			if (target.getLocationType() === BASE && target.getLocation()[target.getLocation().length-1] !== target) {

				return {
					ok: false
				};

			} else if (target.getLocationType() === BASE) {
				
				var ret = {ok: false};
				ret.ok = this.moveCardToBase(cardId, target.getLocation());
				if (ret.ok) {
					ret.onBase = true;
					sendToOtherPlayer(pid, "move_card_to_card", {
						moveId: cardId,
						targetId: targetId,
						onBase: true
					});
					addPoint(pid);
				}
				return ret;
				
			} else if (target.getLocationType() === FOUNDATION) {
				
				var ret = {ok: false};
				ret.ok = this.moveCardToFoundation(cardId, target.getLocation());
				if (ret.ok) {
					ret.onBase = false;
					ret.zi = target.getLocation().length;
					sendToOtherPlayer(pid, "move_card_to_card", {
						moveId: cardId,
						targetId: targetId,
						onBase: false,
						zi: ret.zi
					});
					addPoint(pid);
				}
				return ret;
				
			} else {
				
				return {
					ok: false
				};
				
			}
			
		};

		this.moveCardToFoundationNumber = function(cardId, fn, pid) {
			var res = this.moveCardToFoundation(cardId, fSet[fn]);
			if (res) {
				sendToOtherPlayer(pid, "move_card_to_foundation", {
					moveId: cardId,
					foundationNum: fn
				});
				addPoint(pid);
			}
			return res;
		};
		
		this.moveCardToFoundation = function(cardId, f) {
			
			var card = cardMap[cardId];

			var ok = false;
			if (f.length === 0 && card.getValue() === 1) {
				ok = true;
			} else if (f.length > 0 && f[f.length-1].accept(card) && card === card.getLocation()[card.getLocation().length-1]) {
				ok = true;
			}
			
			if (ok) {

				card.dragger = null;

				// pull from current location
				var pullIndex = -1;
				var s = card.getLocation();
				for (var i = 0; i < s.length && pullIndex < 0; i++) {
					if (s[i] === card) {
						pullIndex = i;
					}
				}
				if (pullIndex > -1) {
					s.splice(pullIndex, 1);
				}
				
				// put on top of foundation
				card.setLocationType(FOUNDATION);
				card.setLocation(f);
				f.push(card);
				
			}
			
			return ok;
			
		};

		this.moveCardToBaseNumber = function(cardId, bn, pid) {
			var res = this.moveCardToBase(cardId, bSet[bn]);
			if (res) {
				sendToOtherPlayer(pid, "move_card_to_base", {
					moveId: cardId,
					baseNum: bn
				});
				addPoint(pid);
			}
			return res;
		};
			
		this.moveCardToBase = function(cardId, b) {

			var card = cardMap[cardId];

			var ok = false;
			if (b.length === 0 && card.getValue() === 13) { // only accept K at bottom
				ok = true;
			} else if (b.length > 0 && b[b.length-1].accept(card)) {
				ok = true;
			}
			
			if (ok) {
				
				card.dragger = null;
				
				// pull from current location
				var pullIndex = -1;
				var s = card.getLocation();
				for (var i = 0; i < s.length && pullIndex < 0; i++) {
					if (s[i] === card) {
						pullIndex = i;
					}
				}
				if (pullIndex > -1) {
					if (card.getLocationType() === BASE) {
						var pulled = s.splice(pullIndex, s.length - pullIndex);
						// put on top of new base
						card.setLocationType(BASE);
						for (var i = 0; i < pulled.length; i++) {
							pulled[i].setLocation(b);
							b.push(pulled[i]);
						}
					} else {
						s.splice(pullIndex, 1);
						card.setLocationType(BASE);
						card.setLocation(b);
						b.push(card);
					}
				}
				

			}
			
			return ok;
			
		};
		
		this.getInfo = function() {
			
			var slots = [];
			for (var i in players) {
				var p = players[i];
				if (p.name === null) {
					slots.push(p.id);
				}
			}
			return slots;
			
		};
		
		this.joinGame = function(pinfo) {
			
			if (!pinfo) {
				return null;
			}
			
			players[pinfo.id].name = pinfo.name;
			
			var bases = [];
			var foundations = [];
			var stk = [];
			var dsc = [];
			var peeps = [];
			
			for (var b = 0; b < bSet.length; b++) {
				var base = [];
				for (var bi = 0; bi < bSet[b].length; bi++) {
					base.push(bSet[b][bi].getData());
				}
				bases.push(base);
			}

			for (var f = 0; f < fSet.length; f++) {
				var foundation = [];
				for (var fi = 0; fi < fSet[f].length; fi++) {
					foundation.push(fSet[f][fi].getData());
				}
				foundations.push(foundation);
			}

			for (var s = 0; s < stack.length; s++) {
				stk.push(stack[s].getData());
			}

			for (var d = 0; d < discard.length; d++) {
				dsc.push(discard[d].getData());
			}

			for (var i in players) {
				var p = players[i];
				peeps.push({
					name: p.name,
					num: p.num,
					score: p.score
				});
			}

			return {
				bases: bases,
				foundations: foundations,
				stack: stk,
				discard: dsc,
				players: peeps
			};
			
		};
		
		this.sendDrag = function(pid, cardId, pos) {
			
			sendToOtherPlayer(pid, "drag_card", {
				cardId: cardId,
				pos: pos
			});
			
		};

		this.startDrag = function(pid, cardId) {
			
			var card = cardMap[cardId];
			if (card.dragger) {
				sendToPlayer(pid, "abort_drag", {
					cardId: cardId
				});
			} else {
				card.dragger = pid;
				sendToOtherPlayer(pid, "start_drag_card", {
					cardId: cardId
				});
			}
			
		};

		this.stopDrag = function(pid, cardId) {
			
			var card = cardMap[cardId];
			card.dragger = null;
			sendToOtherPlayer(pid, "stop_drag_card", {
				cardId: cardId
			});
			
		};

		function sendToPlayer(pid, event, data) {
			
			var player = players[pid];
			if (player && player.socket) {
				console.log('sending ' + event + ' to ' + player.id);
				player.socket.emit(event, data);
			}
			
		}

		function sendToOtherPlayer(me, event, data) {
			
			for (var p in players) {
				if (p !== me) {
					var player = players[p];
					if (player.socket) {
						console.log('sending ' + event + ' to ' + player.id);
						player.socket.emit(event, data);
					}
				}
			}
			
		}
		
		this.connectPlayer = function(pid, psock) {
			
			if (pid) {
				console.log('connected player ' + pid + ' socket');
				players[pid].socket = psock;
				sendToOtherPlayer(pid, 'player_join', {
					name: players[pid].name,
					num: players[pid].num,
					score: players[pid].score
				});
			}
			
			
			
		};
		
		this.disconnectPlayer = function(pid) {

			if (pid) {
				console.log('disconnected player ' + pid + ' socket');
				players[pid].name = null;
				players[pid].socket = null;
			}

		};
		

	}
	
	return {
		newGame: function() {
			return new Game();
		}
	};
	
};

