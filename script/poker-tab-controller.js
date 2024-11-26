import TabController from "../../../tool/tab-controller.js";
import { GAME_PHASE, HAND_RANKING } from "./enums.js";


/**
 * Skeleton for tab controller type.
 */
class PokerTabController extends TabController {

	/**
	 * Initializes a new instance.
	 */
	constructor () {
		super("poker");

		// register controller event listeners 
		this.addEventListener("activated", event => this.processActivated());
	}


	// HTML element getter operations
	get serviceOrigin () { return this.sharedProperties["service-origin"]; }
	get sessionOwner () { return this.sharedProperties["session-owner"]; }
	set sessionOwner (value) { this.sharedProperties["session-owner"] = value; }

	get pokerTablesViewTemplate () { return document.querySelector("head>template.poker-tables-view"); }
	get pokerTableViewRowTemplate () { return document.querySelector("head>template.poker-tables-view-row"); }
	get pokerTablesSection () { return this.center.querySelector("section.poker-tables-view"); }
	get pokerTablesName () {return this.pokerTablesSection.querySelector("div.control>div>input.alias");}
	get pokerTablesVariantSelector () {return this.pokerTablesSection.querySelector("div.control>div>select.variant");}
	get pokerTablesSeatCount () {return this.pokerTablesSection.querySelector("div.control>div>input.seat-count");}
	get pokerTablesEntryBid () {return this.pokerTablesSection.querySelector("div.control>div>input.entry-bid");}
	get pokerTableDivControl () {return this.pokerTablesSection.querySelector("div.control");}
	get pokerTablesTbody () {return this.pokerTablesSection.querySelector("div.main>div.tables>table>tbody");}
	get pokerNeuButton () { return this.pokerTablesSection.querySelector("div.control>button.create"); }
	
	//================================================poker-table-view====================================================
	get pokerTableViewTemplate () { return document.querySelector("head>template.poker-table-view"); }
	get pokerTableSection () { return this.center.querySelector("section.poker-table-view"); }
	get pokerQuitButton () { return this.pokerTableSection.querySelector("div.control>button.quit"); }
	get pokerStartGameButton () { return this.pokerTableSection.querySelector("div.control>button.start"); }
	get pokerControlDiv () { return this.pokerTableSection.querySelector("div.control"); }
	get pokerTableDiv () { return this.pokerTableSection.querySelector("div.table"); }
	get pokerBetButton ()  { return this.pokerTableSection.querySelector("div.control>button.bet"); }
	get pokerFoldButton ()  { return this.pokerTableSection.querySelector("div.control>button.fold"); }
	get pokerDrawButton ()  { return this.pokerTableSection.querySelector("div.control>button.draw"); }
	get pokerBidAmountInput ()  { return this.pokerTableSection.querySelector("div.control>input.bid-increment"); }
	//=============================================status======================================
	get pokerCardDesignSelector () { return this.pokerTableSection.querySelector("div.status>select.design"); }
	get pokerGamePhaseOutput () { return this.pokerTableSection.querySelector("div.status>output.phase"); }
	get pokerMaxBidOutput () { return this.pokerTableSection.querySelector("div.status>output.max-bid"); }
	get pokerPotOutput () { return this.pokerTableSection.querySelector("div.status>output.pot"); }
	get pokerCreditOutput () { return this.pokerTableSection.querySelector("div.status>output.credit"); }
	//============================================table-view-hand==================================
	get pokerTablesViewCommunityHandTemplate () { return document.querySelector("head>template.table-view-community-hand"); }
	get pokerTablesViewPlayerHandTemplate () { return document.querySelector("head>template.table-view-player-hand"); }
	//============================================table-view-hand==================================
	
	
	
	
	//get skeletonPane () { return this.center.querySelector("section.<style-class>"); }


	/**
	 * Handles that activity has changed from false to true.
	 */
	async processActivated () {
		this.messageOutput.value = "";
		let a = 9;
		console.log("convert number to string", typeof a,typeof a.toString());
		// redefine center content
		while (this.center.lastElementChild) this.center.lastElementChild.remove();
		this.center.append(this.pokerTablesViewTemplate.content.firstElementChild.cloneNode(true));

		try {
			if (this.sessionOwner.group === "ADMIN") {
				this.pokerTableDivControl.classList.remove("hidden");
				const gameVariants = await this.#invokeQueryAllGameVariants();
				for (const gameVariant of gameVariants) {
					const option = document.createElement("option");
					option.innerText = gameVariant.alias;
					option.value = gameVariant.identity.toString();
					this.pokerTablesVariantSelector.append(option);
				}

				// register basic event listeners
				this.pokerNeuButton.addEventListener("click", event => this.processSubmitTable());
			}

			await this.#displayPokerTables();
			if (this.sessionOwner.tableReference) {
				const table = await this.#invokeQueryTable(this.sessionOwner.tableReference);
				await this.processDisplayPokerTable(table);
			}

			await this.observeTableEvents();
			this.messageOutput.value = "";
		} catch (error) {
			this.messageOutput.value = error.message || error.toString();
			console.error(error);
		}	
	}


	// for create & modification!
	async processSubmitTable (table = {}) {
		try {
			if (!table.variant) table.variant = {};
			if (!table.avatar) table.avatar = { identity: 1 };
			if (!table.seats) table.seats = [];
			table.alias = this.pokerTablesName.value.trim() || null;
			table.entryBid = window.parseFloat(this.pokerTablesEntryBid.value || "0") * 100;
			table.variant.identity = window.parseInt(this.pokerTablesVariantSelector.value);

			const seatCount = window.parseInt(this.pokerTablesSeatCount.value);
			if (table.seats.length > seatCount) table.seats.length = seatCount;			// for modification!
			for (let position = table.seats.length; position < seatCount; ++position)
				table.seats.push({ position: position });

			table.identity = await this.#invokeInsertOrUpdateTable(table);
			await this.#displayPokerTables();
			this.messageOutput.value = "ok.";
		} catch (error) {
			this.messageOutput.value = error.message || error.toString();
			console.error(error);
		}	
	}


	async #displayPokerTables () {
		const pokerTables = await this.#invokeQueryTables();
		// console.log(pokerTables);
		 
		this.pokerTablesTbody.innerHTML = "";
		for (const pokerTable of pokerTables) {
			const tableRow = this.pokerTableViewRowTemplate.content.firstElementChild.cloneNode(true);
			this.pokerTablesTbody.append(tableRow);
			tableRow.querySelector("td.table>button").addEventListener("click", event => this.processDisplayPokerTable(pokerTable));
			
			if (this.sessionOwner.group === "ADMIN") {
				tableRow.querySelector("td.table>button>img").addEventListener("dragover", event => this.processAvatarTransfer(event.dataTransfer));
				tableRow.querySelector("td.table>button>img").addEventListener("drop", event => this.processSubmitAvatar(pokerTable, event.dataTransfer.files[0], tableRow));
			}

			tableRow.querySelector("td.table>button>img").src = this.sharedProperties["service-origin"] + "/services/documents/" + pokerTable.avatar.identity;
			tableRow.querySelector("td.alias").innerText = pokerTable.alias || "-";	
			tableRow.querySelector("td.variant").innerText = pokerTable.variant.alias || "-";	

			for (const seat of pokerTable.seats) {
				const tableCell = document.createElement("td");
				tableCell.classList.add("seat");

				const seatButton = document.createElement("button");
				seatButton.addEventListener("click", event => this.processDisplayPokerTable(pokerTable, seat));
				//TODO

				const imgView = document.createElement("img");
				imgView.src = seat.occupant ? "image/seat/seat-unavailable.png" : "image/seat/seat-available.png";

				seatButton.append(imgView);
				tableCell.append(seatButton);
				tableRow.append(tableCell);	
			}
		}
	}


	//====================2=====================
	// um ein foto zu transferieren, müssen wir zuerst validieren.
	// Wurde Text oder Datei gedragged (.kind)? Wenn Datei, hat diese den richtigen Typ?=(.type)
	async processAvatarTransfer (dataTransfer) {
		const primaryItem = dataTransfer.items[0];
		dataTransfer.dropEffect = primaryItem.kind === "file" && primaryItem.type.startsWith("image/")
			? "copy"
			: "none";
	}


	//===========================mschan foto=====================================	
	async processSubmitAvatar (table, tableFile, tableRow) {
		try {
			table.avatar.identity = await this.#invokeInsertOrUpdateDocument(tableFile);
			tableRow.querySelector("td.table>button>img").src = this.sharedProperties["service-origin"] + "/services/documents/" + table.avatar.identity;

			await this.#invokeInsertOrUpdateTable(table);
			table.version += 1;

			this.messageOutput.value = "ok";
		} catch (error) {
			this.messageOutput.value = error.message;
			console.error(error);
		}
	}


	async processDisplayPokerTable (table, seat = null) {
		try {
			if (this.sessionOwner.group === "USER")
				await this.#occupySeat(table, seat);
			this.sessionOwner = await this.#invokeQueryPerson(this.sessionOwner.identity);

			this.pokerTablesSection.classList.add("hidden");
			this.center.append(this.pokerTableViewTemplate.content.firstElementChild.cloneNode(true));
			this.pokerQuitButton.addEventListener("click", event => this.processQuitPokerTable());
			this.pokerStartGameButton.addEventListener("click", event => this.processStartNewGame());
			this.pokerBetButton.addEventListener("click", event => this.processBet());
			this.pokerFoldButton.addEventListener("click", event => this.processFold());
			this.pokerDrawButton.addEventListener("click", event => this.processExchangeCards());

			if (table.currentGameReference)
				await this.#displayGame();
			else
				await this.#displayTable();
			this.messageOutput.value = "";
		} catch (error) {
			this.messageOutput.value = error.message;
			console.error(error);
		}

		console.log(table, seat);
	}


	async #displayTable () {
		if (!this.active || !this.sessionOwner.tableReference) return;
		this.pokerTableDiv.innerHTML = "";
		const table = await this.#invokeQueryTable(this.sessionOwner.tableReference);

		const occupants = table.seats.map(seat => seat.occupant).filter(person => person && person.credit > 2 * table.entryBid);
		this.pokerStartGameButton.disabled = occupants.length < table.variant.minPlayerCount;
		this.pokerQuitButton.disabled = false;
		this.pokerBidAmountInput.disabled = true;
		this.pokerBetButton.disabled = true;
		this.pokerFoldButton.disabled = true;
		this.pokerDrawButton.disabled = true;
		
		this.pokerBidAmountInput.value = "";
		this.pokerGamePhaseOutput.value = "-";
		this.pokerCreditOutput.value = (this.sessionOwner.credit/ 100).toFixed(2) + "€";
		this.pokerPotOutput.value = "-";
		this.pokerMaxBidOutput.value = "-";

		for (const tableSeat of table.seats) {
			const span = document.createElement("span");
			span.classList.add("seat", "p" + table.seats.length + tableSeat.position);
			span.innerHTML = tableSeat.position.toString();
			this.pokerTableDiv.append(span);

			const avatarViewer = document.createElement("img");
			span.append(avatarViewer);
			avatarViewer.classList.add("avatar");
			avatarViewer.src = tableSeat.occupant
				? this.serviceOrigin + "/services/documents/" + tableSeat.occupant.avatar.identity
				: "image/seat/seat-available.png";
		}
	}


	async #displayGame () {
		if (!this.active || !this.sessionOwner.tableReference) return;
		const table = await this.#invokeQueryTable(this.sessionOwner.tableReference);

		if (!table.currentGameReference) return;
		const game = await this.#invokeQueryGame(table.currentGameReference);
		const gameAge = Date.now() - game.modified;
		if (!this.pokerTableSection) return;

		const occupants = table.seats.map(seat => seat.occupant).filter(person => person && person.credit > 2 * table.entryBid);
		const sessionOwnerHand = game.hands.find(hand => hand.type === "PLAYER" && hand.playerReference === this.sessionOwner.identity);
		const communityHand = game.hands.find(hand => hand.type === "COMMUNITY");
		const playerHands = game.hands.filter(hand => hand.type === "PLAYER");

		this.pokerStartGameButton.disabled = occupants.length < game.variant.minPlayerCount || game.phase !== "SHOWDOWN";
		this.pokerQuitButton.disabled = game.phase !== "SHOWDOWN";
		this.pokerBidAmountInput.disabled = !game.phase.endsWith("_BID") || sessionOwnerHand.position !== game.activePosition;
		this.pokerFoldButton.disabled = this.pokerBetButton.disabled || sessionOwnerHand.folded;
		this.pokerBetButton.disabled = this.pokerBidAmountInput.disabled;
		this.pokerDrawButton.disabled = game.phase !== "DRAW" || sessionOwnerHand.position !== game.activePosition || sessionOwnerHand.folded;
		this.pokerFoldButton.disabled = this.pokerBetButton.disabled || sessionOwnerHand.folded;

		const pot = playerHands.reduce((accu, hand) => accu + hand.bid, 0);
		this.pokerBidAmountInput.value = (Math.min(game.maxBid - sessionOwnerHand.bid, this.sessionOwner.credit) / 100).toFixed(2);
		this.pokerGamePhaseOutput.value = GAME_PHASE[game.phase];
		this.pokerCreditOutput.value = (this.sessionOwner.credit/ 100).toFixed(2) + "€";
		this.pokerPotOutput.value = game.phase === "SHOWDOWN" ? "-" : (pot / 100).toFixed(2) + "€";
		this.pokerMaxBidOutput.value = game.phase === "SHOWDOWN" ? "-" : (game.maxBid / 100).toFixed(2) + "€";

		if (this.pokerTableDiv.querySelectorAll("span.hand").length === 0)
			this.pokerTableDiv.innerHTML = "";

		//=============================ich====================================		
		let communityHandSpan = this.pokerTableDiv.querySelector("span.hand.community");
		if (!communityHandSpan) {
			communityHandSpan = this.pokerTablesViewCommunityHandTemplate.content.firstElementChild.cloneNode(true);
			this.pokerTableDiv.append(communityHandSpan);

			const cardSpan = communityHandSpan.querySelector("span.card");
			for (let cardIndex = 0; cardIndex < game.variant.communityCardCount; ++cardIndex) {
				const cardViewer = document.createElement("img");
				cardViewer.classList.add("card");
				cardSpan.append(cardViewer);
			}	
		}


		if (game.variant.communityCardCount > 0) {
			const visibleCommunityCards = await this.#invokeQueryCards(communityHand.identity);
			const cardSpan = communityHandSpan.querySelector("span.card");
			for (let cardIndex = 0; cardIndex < game.variant.communityCardCount; ++cardIndex) {
				const card = cardIndex < visibleCommunityCards.length ? visibleCommunityCards[cardIndex] : null;
				const cardViewer = cardSpan.querySelector("img.card:nth-of-type(" + (cardIndex + 1) + ")");
				cardViewer.src = card
					? this.pokerCardDesignSelector.value + (card.suit.toLowerCase() + " - " + card.rank.toLowerCase() + ".png")
					: this.pokerCardDesignSelector.value + "back - blue.png";
			}
		}
		//=====================ich==============================================================

		for (const playerHand of playerHands) {
			const positionStyleClass = "p" + playerHands.length + playerHand.position;

			let handSpan = this.pokerTableDiv.querySelector("span.hand." + positionStyleClass);
			if (!handSpan) {
				handSpan = this.pokerTablesViewPlayerHandTemplate.content.firstElementChild.cloneNode(true);
				handSpan.classList.add(positionStyleClass);
				this.pokerTableDiv.append(handSpan);
			}

			const player = await this.#invokeQueryPerson(playerHand.playerReference);
			if (player.identity === this.sessionOwner.identity)
				this.sessionOwner = player;

			const avatarViewer = handSpan.querySelector("img.avatar");
			avatarViewer.src = this.serviceOrigin + "/services/documents/" + player.avatar.identity;
			const nameOutput = handSpan.querySelector("output.name");
			nameOutput.value = player.name.given;

			const cardViewers = Array.from(handSpan.querySelectorAll("img.card"));
			const visibleCards = await this.#invokeQueryCards(playerHand.identity);
			const cardSpan = handSpan.querySelector("span.card");
			for (let cardIndex = 0; cardIndex < game.variant.playerCardCount; ++cardIndex) {
				let cardViewer = cardIndex < cardViewers.length ? cardViewers[cardIndex] : null;
				if (!cardViewer) {
					cardViewer = document.createElement("img");
					cardSpan.append(cardViewer);
					cardViewer.classList.add("card");
					cardViewer.addEventListener("click", event => event.target.classList.toggle("selected"));
				}

				cardViewer.src = cardIndex < visibleCards.length
					? this.pokerCardDesignSelector.value + visibleCards[cardIndex].suit.toLowerCase() + " - " + visibleCards[cardIndex].rank.toLowerCase() + ".png"
					: this.pokerCardDesignSelector.value + "back - blue.png";
			}
		
			if (playerHand.position === game.activePosition) 
				handSpan.classList.add("active");
			else
				handSpan.classList.remove("active");
			
			if (game.phase === "SHOWDOWN" && gameAge < 1 * 60 * 1000) {
				const winnerHand = playerHands.find(playerHand => playerHand.victorious);
				const winner = await this.#invokeQueryPerson(winnerHand.playerReference);
				this.messageOutput.value = winner.name.given + " hat durch " + (winnerHand.ranking ? HAND_RANKING[winnerHand.ranking] : "Aufgabe") + " gewonnen!";
				// console.log((Date.now() - game.modified) * 0.001, (Date.now() - winnerHand.modified) * 0.001);
			}
		}
	}


	/**
	 * Recursive Game loop.
	 */
	async observeTableEvents () {
		if (!this.active) return;
		try {
			if (this.sessionOwner.tableReference) {
				const table = await this.#invokeQueryTable(this.sessionOwner.tableReference);
				if (table.currentGameReference)
					await this.#displayGame();
				else
					await this.#displayTable();
			} else {
				await this.#displayPokerTables();	
			}
			
		} catch (error) {
			this.messageOutput.value = error.message;
			console.error(error);
		} finally {
			window.setTimeout(() => this.observeTableEvents(), 5 * 1000);
		}
	}


	async processQuitPokerTable () {
		try {
			await this.#invokeOccupySeat(null);
			this.sessionOwner = await this.#invokeQueryPerson(this.sessionOwner.identity);

			await this.#displayPokerTables();
			this.pokerTableSection.remove();
			this.pokerTablesSection.classList.remove("hidden");

			this.messageOutput.value = "ok.";
		} catch (error) {
			this.messageOutput.value = error.message;
			console.error(error);
		}
	}


	async processStartNewGame () {
		try {
			if (this.sessionOwner.group !== "USER") throw new Error("Aktueller Benutzer darf nicht spielen!");

			const table = await this.#invokeQueryTable(this.sessionOwner.tableReference);
			const minCredits = 2 * table.entryBid;
			//??????????????????????????????????????????????????????????????????????????????????????????????1
			const players = table.seats.map(seat => seat.occupant).filter(person => person && person.credit >= minCredits);
			if (players.length < table.variant.minPlayerCount) throw new Error("Es gibt zu wenige Spieler!");

			if (table.currentGameReference) {
				const game = await this.#invokeQueryGame(table.currentGameReference);
				if (game.phase !== "SHOWDOWN") throw new Error("Es gibt aktuell ein aktives Spiel!");
			}

			table.currentGameReference = await this.#insertGame();
			await this.#displayGame();

			this.messageOutput.value = "ok.";
		} catch (error) {
			this.messageOutput.value = error.message;
			console.error(error);
		}
	}


	//=================================bieten=====
	async processBet () {
		try {
			this.pokerBetButton.disabled = true;
			const table = await this.#invokeQueryTable(this.sessionOwner.tableReference);
			const game = await this.#invokeQueryGame(table.currentGameReference);
			const sessionOwnerHand = game.hands.find(hand => hand.type === "PLAYER" && hand.playerReference === this.sessionOwner.identity);
			if (!game.phase.endsWith("_BID") || sessionOwnerHand.position !== game.activePosition) throw new Error();
			const bidAmount = window.parseFloat(this.pokerBidAmountInput.value) * 100;

			await this.#invokeBet(sessionOwnerHand.identity, bidAmount);
			await this.#displayGame();
			this.messageOutput.value = "ok.";
		} catch (error) {
			this.messageOutput.value = error.message;
			console.error(error);
		}
	}
	
	
	//===============================================================
	async processFold () {
		try {
			const table = await this.#invokeQueryTable(this.sessionOwner.tableReference);
			let game = await this.#invokeQueryGame(table.currentGameReference);
			const sessionOwnerHand = game.hands.find(hand => hand.type === "PLAYER" && hand.playerReference === this.sessionOwner.identity);
			if (!game.phase.endsWith("_BID") || sessionOwnerHand.position !== game.activePosition) throw new Error();

			await this.#invokeBet(sessionOwnerHand.identity, -1);
			await this.#displayGame();
			this.messageOutput.value = "ok.";
		} catch (error) {
			this.messageOutput.value = error.message;
			console.error(error);
		}
	}


	//===============================================================

	/**
	 * 
	 */
	async processExchangeCards () {
		try {
			const table = await this.#invokeQueryTable(this.sessionOwner.tableReference);
			const game = await this.#invokeQueryGame(table.currentGameReference);
			const sessionOwnerHand = game.hands.find(hand => hand.type === "PLAYER" && hand.playerReference === this.sessionOwner.identity);
			const playerHands = game.hands.filter(hand => hand.type === "PLAYER");

			const positionStyleClass = "p" + playerHands.length + sessionOwnerHand.position;
			const sessionOwnerHandSpan = this.pokerTableDiv.querySelector("span.hand." + positionStyleClass);
			const sessionOwnerCardViewers = Array.from(sessionOwnerHandSpan.querySelectorAll("img.card"));
			const sessionOwnerCards = await this.#invokeQueryCards(sessionOwnerHand.identity);

			const cardSelectionIndices = [];
			for (let cardIndex = 0; cardIndex < sessionOwnerCards.length; ++cardIndex) {
				let cardViewer = sessionOwnerCardViewers[cardIndex];
				if (cardViewer.classList.contains("selected")) {
					cardSelectionIndices.push(cardIndex);
					cardViewer.classList.remove("selected");
				}
			}

			const playerCardIdentities = cardSelectionIndices.map(index => sessionOwnerCards[index].identity);
			await this.#invokeExchangeCards(sessionOwnerHand.identity, playerCardIdentities);
			await this.#displayGame();

			this.messageOutput.value = "ok.";
		} catch (error) {
			this.messageOutput.value = error.message;
			console.error(error);
		}
	}


	//===========================================nochmal bitte======================================================
	async #occupySeat (table, seat = null) {
		if (seat && table.identity !== seat.tableReference) throw new RangeError();
		if (seat && seat.occupant && seat.occupant.identity !== this.sessionOwner.identity) throw new RangeError();
		
		if (!seat) {
			seat = table.seats.find(tableSeat => tableSeat.occupant && tableSeat.occupant.identity === this.sessionOwner.identity);
			if (!seat) seat = table.seats.find(tableSeat => !tableSeat.occupant);
			if (!seat) throw new RangeError();
		}

		if (seat.occupant && seat.occupant.identity === this.sessionOwner.identity) return;
		await this.#invokeOccupySeat(seat);
		seat.occupant = this.sessionOwner;
	}


	async #invokeQueryTables () {
		const resource = this.serviceOrigin + "/services/tables";
		const headers = { "Accept": "application/json" };
		const response = await fetch(resource, { method: "GET", headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

		const tables = await response.json();
		tables.forEach(table => table.seats.sort((left, right) => left.position - right.position));
		return tables;
	}


	async #invokeQueryTable (tableIdentity) {
		const resource = this.serviceOrigin + "/services/tables/" + tableIdentity;
		const headers = { "Accept": "application/json" };
		const response = await fetch(resource, { method: "GET", headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

		const table = await response.json();
		table.seats.sort((left, right) => left.position - right.position);
		return table;
	}


	async #invokeInsertOrUpdateTable (table) {
		const resource = this.serviceOrigin + "/services/tables";
		const headers = { "Accept": "text/plain", "Content-Type": "application/json" };

		const response = await fetch(resource, { method: "POST", headers: headers, body: JSON.stringify(table), credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return window.parseInt(await response.text());
	}
	
	
	async #invokeQueryAllGameVariants () {
		const resource = this.serviceOrigin + "/services/games/variants";
		const headers = { "Accept": "application/json" };
		const response = await fetch(resource, { method: "GET", headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		
		return /* await */ response.json();	
	}


	async #invokeQueryGame (gameIdentity) {
		const resource = this.serviceOrigin + "/services/games/" + gameIdentity;
		const headers = { "Accept": "application/json" };
		const response = await fetch(resource, { method: "GET", headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

		const game = await response.json();
		game.hands.sort((left, right) => left.type === right.type ? left.position - right.position : left.type.localeCompare(right.type));
		return game;	
	}
	
	
		//===========================================
	async #invokeBet (handIdentity, bid) {
		const resource = this.serviceOrigin + "/services/hands/" + handIdentity;
		const headers = { "Accept": "text/plain", "Content-Type": "text/plain" };

		const response = await fetch(resource, { method: "PATCH", headers: headers, body: bid.toString(), credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return window.parseInt(await response.text());	
	}
	
	//===========================================
	async #insertHands (Hand) {
		const resource = this.serviceOrigin + "/services/hands";
		const headers = { "Accept": "text/plain" };

		const response = await fetch(resource, { method: "PATCH", headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return window.parseInt(await response.text());	
	}
	
	
	async #invokeQueryHand() {
		const resource = this.serviceOrigin + "/services/hands/";
		const headers = { "Accept": "application/json" };
		const response = await fetch(resource, { method: "GET", headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		
		return /* await */ response.json();	
	}
	
	
	async #invokeQueryCards (playerHandIdentity) {
		const resource = this.serviceOrigin + "/services/hands/" + playerHandIdentity + "/cards";
		const headers = { "Accept": "application/json" };
		const response = await fetch(resource, { method: "GET", headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		
		return /* await */ response.json();	
	}


	async #invokeQueryPerson (personIdentity) {
		const resource = this.serviceOrigin + "/services/people/" + personIdentity;
		const headers = { "Accept": "application/json" };
		const response = await fetch(resource, { method: "GET", headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		
		return /* await */ response.json();	
	}


	async #insertGame () {
		const resource = this.serviceOrigin + "/services/games";
		const headers = { "Accept": "text/plain" };

		const response = await fetch(resource, { method: "PATCH", headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return window.parseInt(await response.text());
	}


	async #invokeExchangeCards (playerHandIdentity, cardReferences) {
		const resource = this.serviceOrigin + "/services/hands/" + playerHandIdentity + "/cards" ;
		const headers = { "Accept": "text/plain", "Content-Type": "application/json" };
		const body = JSON.stringify(cardReferences);

		const response = await fetch(resource, { method: "PATCH", headers: headers, body: body,  credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return window.parseInt(await response.text());
	}


	async #invokeInsertOrUpdateDocument (file) {
		const resource = this.serviceOrigin + "/services/documents";
		const headers = { "Accept": "text/plain", "Content-Type": file.type, "X-Content-Description": file.name };

		const response = await fetch(resource, { method: "POST", headers: headers, body: file, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

		return window.parseInt(await response.text());
	}
	
	
	async #invokeOccupySeat (seat = null) {
		const resource = this.serviceOrigin + "/services/people/" + this.sessionOwner.identity;
		const headers = { "Accept": "text/plain", "Content-Type": "text/plain" };
		const body = seat ? seat.identity.toString() : "0";

		const response = await fetch(resource, { method: "PATCH", headers: headers, body: body, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return window.parseInt(await response.text());
	}
}


/*
 * Registers an event listener for the browser window's load event.
 */
window.addEventListener("load", event => {
	const controller = new PokerTabController();
	console.log(controller);
});
