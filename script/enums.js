/**
 * Enum keys and their associated German translations.
 */
const GROUP = Object.freeze({
	USER: "Benutzer",
	CROUPIER: "Croupier",
	ADMIN: "Administrator"
});

const GAME_PHASE = Object.freeze({
	DEAL: "Austeilen",
	ANTE_BID: "Startgebot",
	DRAW: "Kartentausch",
	FLOP_BID: "Flop-Gebot",
	TURN_BID: "Turn-Gebot",
	RIVER_BID: "Schlussgebot",
	SHOWDOWN: "Aufdecken"
});

const HAND_TYPE = Object.freeze({
	PLAYER: "Spielerkarten",
	COMMUNITY: "Gemeinschaftskarten",
	DECK: "Kartenstapel",
	DISCARD: "Ablagestapel"
});

const HAND_RANKING = Object.freeze({
	SINGLE: "Single",
	ONE_PAIR: "Ein Paar",
	TWO_PAIR: "Zwei Paare",
	SET: "Drilling",
	STRAIGHT: "Straße",
	FLUSH: "Einfarbig",
	FULL_HOUSE: "Volles Haus",
	QUAD: "Vierling",
	STRAIGHT_FLUSH: "Einfarbige Straße",
	QUINT: "Fünfling"
});

const CARD_SUIT = Object.freeze({
	DIAMONDS: "Karo",
	HEARTS: "Herz",
	SPADES: "Pik",
	CLUBS: "Kreuz"
});

const CARD_RANK = Object.freeze({
	TWO: "Zwei",
	THREE: "Drei",
	FOUR: "Vier",
	FIVE: "Fünf",
	SIX: "Sechs",
	SEVEN: "Sieben",
	EIGHT: "Acht",
	NINE: "Neun",
	TEN: "Zehn",
	JACK: "Bube",
	QUEEN: "Dame",
	KING: "König",
	ACE: "Ass"
});


export { GROUP, GAME_PHASE, HAND_TYPE, HAND_RANKING, CARD_SUIT, CARD_RANK };