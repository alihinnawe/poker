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
	get pokerEditorRowTemplate () { return document.querySelector("head>template.poker-tables-view"); } 
	get pokerEditorSection () { return this.center.querySelector("section.poker-tables-view"); }
	get pokerEditorViewsTableBody () { return this.pokerEditorSection.querySelector("tbody"); }
	get viewsTableRowTemplate() {return document.querySelector("head>template.poker-tables-view-row"); }
	get pokerNewTable () {return document.querySelector("head>template.poker-tables-view-row"); }
	get tableVariant () { return this.pokerEditorSection.querySelector("div.main>div.control>div>select.variant"); }
	get tableName () {return this.pokerEditorSection.querySelector("div.main>div.control>div>input.alias"); } 
	get tableSeatNumber () { return this.pokerEditorSection.querySelector("div.main>div.control>div>input.seat-count"); }
	get tableEntryBid () { return this.pokerEditorSection.querySelector("div.main>div.control>div>input.entry-bid"); }

 	/**
	 * Handles that activity has changed from false to true.
	 */
	async processActivated () {
		this.messageOutput.value = "";

		// redefine center content
		const template = document.querySelector("head>template.poker-tables-view");
		while (this.center.lastElementChild) this.center.lastElementChild.remove();
		this.center.append(template.content.firstElementChild.cloneNode(true));

		await this.#displayAllPokerTables();
		//this.addEventListener("click", this.processSaveTable(table = {}));
		// register basic event listeners
		// TODO
	}
	
	async #displayAllPokerTables () {
			try {
				const sessionOwner = this.sharedProperties["session-owner"];
				const tables = await this.#invokeQueryAllPokerTables();
				//const viewsTableBody = this.pokerEditorViewsTableBody;
				this.pokerEditorViewsTableBody.innerHTML = "";
				for (const table of tables) {
					const tableRow = this.viewsTableRowTemplate.content.firstElementChild.cloneNode(true);
					this.pokerEditorViewsTableBody.append(tableRow);	
					
					const accessButton = tableRow.querySelector("td.table>button");
					accessButton.addEventListener("click", event => this.processDisplayTableEditor(table));
					accessButton.querySelector("img").src = this.sharedProperties["service-origin"] + "/services/documents/" + table.avatar.identity;
					console.log("table is",table);
					tableRow.querySelector("td.variant").innerText = table.variant.alias || "";
					
					for ( const seat of table.seats) {
						const td = document.createElement("td");
						td.classList.add("seat");
						const button = document.createElement("button");
						const img = document.createElement("img");
						img.src = "./image/seat/seat-available.png";
						img.setAttribute("width","50px");
						img.setAttribute("height","50px");
						console.log("img",img);
						button.append(img);
						td.append(button);
						tableRow.append(td);	
					}
					
				this.messageOutput.value = "";
			}
				if (sessionOwner.group === "ADMIN") {
					const tableOverviewControl = this.pokerEditorSection.querySelector("div.main>div.control");
					tableOverviewControl.classList.remove("hidden");
					
					const variants_all = await this.#invokeVariants();
					console.log("all variants are:",variants_all);
					for (const variant_name of variants_all) {						
						const option = document.createElement("option");
						option.innerText = variant_name.alias;
						option.value = variant_name.identity.toString();
						this.tableVariant.append(option);
					};

					this.processSaveTable();
					
			
			} } catch (error) {
				this.messageOutput.value = error.message || error.toString();
				console.error(error);
			}
			
		
	}
	
	async #invokeQueryAllPokerTables () {
		const resource = this.sharedProperties["service-origin"] + "/services/tables";
		const headers = { "Accept": "application/json" };

		const response = await fetch(resource, { method: "GET" , headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return /* await */ response.json();
	}

	async processSaveTable(table = {}) {
		
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
			this.pokerEditorSection.classList.remove("hidden");
			this.messageOutput.value = "ok.";
		} catch (error) {
			this.messageOutput.value = error.message || error.toString();
			console.error(error);
		}
	}
	
	async #invokeVariants() {
		
		const resource = this.sharedProperties["service-origin"] + "/services/games/variants";
		const headers = { "Accept": "application/json" };

		const response = await fetch(resource, { method: "GET" , headers: headers, credentials: "include" });
		if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
		return /* await */ response.json();
	}
		
	async #invokeInsertOrUpdateTable() {
		
		
		
		
	}
	

}


/*
 * Registers an event listener for the browser window's load event.
 */
window.addEventListener("load", event => {
	const controller = new PokerTabController();
	console.log(controller);
});