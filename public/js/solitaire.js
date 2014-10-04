(function(window) {

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
		
		this.getBase = function(i) {
			return bSet[i];
		};

		this.getFoundation = function(i) {
			return fSet[i];
		};

		this.getStackSize = function() {
			return stack.length;
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
		
		this.isCardOnBase = function(card) {
			return (card.getLocationType() === BASE);
		};
		
		this.flipCard = function(card) {
			
			if (card.getLocationType() === BASE && card.getLocation()[card.getLocation().length - 1] === card) {
				card.flip();
				return true;
			} else {
				return false;
			}
			
		};
		
		this.moveCardToCard = function(card, target) {
			
			if (target.getLocationType() === BASE && target.getLocation()[target.getLocation().length-1] !== target) {
				return false;
			} else if (target.getLocationType() === BASE) {
				return this.moveCardToBase(card, target.getLocation());
			} else if (target.getLocationType() === FOUNDATION) {
				return this.moveCardToFoundation(card, target.getLocation());
			} else {
				return false;
			}
			
		};

		this.moveCardToFoundationNumber = function(card, fn) {
			return this.moveCardToFoundation(card, fSet[fn]);
		};
		
		this.moveCardToFoundation = function(card, f) {
			
			var ok = false;
			if (f.length === 0 && card.getValue() === 1) {
				ok = true;
			} else if (f.length > 0 && f[f.length-1].accept(card)) {
				ok = true;
			}
			
			if (ok) {
				
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

		this.moveCardToBaseNumber = function(card, bn) {
			return this.moveCardToBase(card, bSet[bn]);
		};
			
		this.moveCardToBase = function(card, b) {

			var ok = false;
			if (b.length === 0 && card.getValue() === 13) { // only accept K at bottom
				ok = true;
			} else if (b.length > 0 && b[b.length-1].accept(card)) {
				ok = true;
			}
			
			if (ok) {
				
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

	}
	
	window.game = new Game();
	
}(window));

