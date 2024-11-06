import TabController from "../../../tool/tab-controller.js";

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
	get tablesViewRowTemplate () { return document.querySelector("head>template.poker-tables-view"); } 
	get viewsTableRowTemplate() {return document.querySelector("head>template.poker-tables-view-row"); }
	get tablesViewSection () { return this.center.querySelector("section.poker-tables-view"); }
	get tablesViewViewsTableBody () { return this.tablesViewSection.querySelector("tbody"); }
	get tableVariant () { return this.tablesViewSection.querySelector("div.main>div.control>div>select.variant"); }
	get tableName () {return this.tablesViewSection.querySelector("div.main>div.control>div>input.alias"); } 
	get tableSeatNumber () { return this.tablesViewSection.querySelector("div.main>div.control>div>input.seat-count"); }
	get tableEntryBid () { return this.tablesViewSection.querySelector("div.main>div.control>div>input.entry-bid"); }
	get insertNewPokerGame () { return this.tablesViewSection.querySelector("div.main>div.control>button.create"); }

 	get tableViewGameSection () { return this.center.querySelector("section.poker-table-view"); }
	get tableViewDataDivision () { return this.tableViewGameSection.querySelector("div.data"); }
	
	/**
	 * Handles that activity has changed from false to true.
	 */
	async processActivated () {
		this.messageOutput.value = "";
		const sessionOwner = this.sharedProperties["session-owner"];
		// redefine center content
		const template = document.querySelector("head>template.poker-tables-view");
		while (this.center.lastElementChild) this.center.lastElementChild.remove();
		this.center.append(template.content.firstElementChild.cloneNode(true));

		await this.#displayAllPokerTables(sessionOwner);
		this.insertNewPokerGame.addEventListener("click", event => this.processSaveTable());
		if (sessionOwner.group === "ADMIN") {

		}
		// register basic event listeners

	}
	
	
	async validateImageTransfer (dataTransfer) {
		const primaryItem = dataTransfer.items[0];
		dataTransfer.dropEffect = primaryItem.kind === "file" && primaryItem.type && primaryItem.type.startsWith("image/") ? "copy" : "none";
	}


	async processSubmitTableAvatar	(table, coverFile, accessButton) {
		try {
			table.avatar.identity = await this.#invokeInsertOrUpdateDocument(coverFile);
			accessButton.querySelector("img").src = this.sharedProperties["service-origin"] + "/services/documents/" + table.avatar.identity;
			
			this.#invokeInsertOrUpdateTable(table);
			table.version += 1;
			
			this.messageOutput.value = "ok.";
		} catch (error) {
			this.messageOutput.value = error.message || error.toString();
			console.error(error);
		}
	}
	
	
	async processSaveTable (table = {}) {
		try {	
			table.alias = this.tableName.value.trim() || null;
			table.entryBid = window.parseInt(this.tableEntryBid.value || "0");
			table.variant = { identity: window.parseInt(this.tableVariant.value || "0") };
			table.seats = [];			
			const seatCount = window.parseInt(this.tableSeatNumber.value || "0");
			for (let position = 0; position < seatCount; position++) {
				table.seats.push({ position: position });
			}
			
			table.identity = await this.#invokeInsertOrUpdateTable(table);
			table.version = (table.version || 0) + 1;
			this.#displayAllPokerTables ();
			this.messageOutput.value = "ok.";
		} catch (error) {
			this.messageOutput.value = error.message || error.toString();
			console.error(error);
		}
	}
	
	
	async #displayAllPokerTables (sessionOwner) {
		try {	
			const tables = await this.#invokeQueryAllPokerTables();
			this.tablesViewViewsTableBody.innerHTML = "";
			
			for (const table of tables) {
				const tableRow = this.viewsTableRowTemplate.content.firstElementChild.cloneNode(true);
				this.tablesViewViewsTableBody.append(tableRow);	
				
				const accessButton = tableRow.querySelector("td.table>button");
				accessButton.querySelector("img").src = this.sharedProperties["service-origin"] + "/services/documents/" + table.avatar.identity;
				if (sessionOwner.group === "ADMIN") {
					accessButton.addEventListener("dragover", event => this.validateImageTransfer(event.dataTransfer));
					accessButton.addEventListener("drop", event => this.processSubmitTableAvatar(table, event.dataTransfer.files[0], accessButton));

				}
				

				console.log("table is",table);
				tableRow.querySelector("td.variant").innerText = table.variant.alias || "";
				
				for ( const seat of table.seats) {
					const td = document.createElement("td");
					td.classList.add("seat");
					const button = document.createElement("button");

					button.addEventListener("click", event => this.processDisplayTableEditor(table, seat));
					const img = document.createElement("img");
					img.src = "./image/seat/seat-available.png";
					img.setAttribute("width","50px");
					img.setAttribute("height","50px");
					button.append(img);
					td.append(button);
					tableRow.append(td);
				}
				
				this.messageOutput.value = "";
			}
			
			if (sessionOwner.group === "ADMIN") {
				const tableOverviewControl = this.tablesViewSection.querySelector("div.main>div.control");
				tableOverviewControl.classList.remove("hidden");
				
				const variants_all = await this.#invokeVariants();
				console.log("all variants are:",variants_all);
				for (const variant_name of variants_all) {						
					const option = document.createElement("option");
					option.innerText = variant_name.alias;
					option.value = variant_name.identity.toString();
					this.tableVariant.append(option);
				};
			}
		} catch (error) {
			this.messageOutput.value = error.message || error.toString();
			console.error(error);
		}	
	}
	
	
	async processDisplayTableEditor (table, seat) {
		console.log("table seat number", table, seat.identity);
		
		this.tablesViewSection.classList.add("hidden");
		const template = document.querySelector("head>template.poker-table-view");
		while (this.center.lastElementChild) this.center.lastElementChild.remove();
		this.center.append(template.content.firstElementChild.cloneNode(true));

		for (const tableSeat of table.seats) {
			const span = document.createElement("span");
			this.tableViewDataDivision.append(span);	
			span.innerHTML = "Player number: " + tableSeat.identity;
			span.setAttribute("width", 100);
			span.setAttribute("height", 30);
			span.classList.add("seat", "p" + table.seats.length + tableSeat.position);
			
			const avatarViewer = document.createElement("img");
			span.append(avatarViewer);
			avatarViewer.classList.add("avatar");
			avatarViewer.src = "image/seat/seat-available.png";
			avatarViewer.setAttribute("width", "50px");
			avatarViewer.setAttribute("height", "50px");
		}
	}
	
	
	async #invokeInsertOrUpdateDocument (file) {
		const headers = { "Accept": "text/plain", "Content-Type": file.type, "X-Content-Description": file.name };
		const resource = this.sharedProperties["service-origin"] + "/services/documents";

		const response = await fetch(resource, { method: "POST" , headers: headers, body: file, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return window.parseInt(await response.text());
	}


	async #invokeQueryAllPokerTables () {
		const resource = this.sharedProperties["service-origin"] + "/services/tables";
		const headers = { "Accept": "application/json" };

		const response = await fetch(resource, { method: "GET" , headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return response.json();
	}


	async #invokeVariants () {
		const resource = this.sharedProperties["service-origin"] + "/services/games/variants";
		const headers = { "Accept": "application/json" };
		
		const response = await fetch(resource, { method: "GET" , headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return response.json();
	}
		
		
	async #invokeInsertOrUpdateTable (table) {
		const resource = this.sharedProperties["service-origin"] + "/services/tables";
		const headers = { "Accept": "text/plain", "Content-Type": "application/json" };
		
		const response = await fetch(resource, { method: "POST" , headers: headers, body: JSON.stringify(table), credentials: "include" });
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