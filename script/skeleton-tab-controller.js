import TabController from "../../../tool/tab-controller.js";


/**
 * Skeleton for tab controller type.
 */
class SkeletonTabController extends TabController {


	/**
	 * Initializes a new instance.
	 */
	constructor () {
		super("<style-class>");

		// register controller event listeners 
		this.addEventListener("activated", event => this.processActivated());
	}


	// HTML element getter operations
	get skeletonPane () { return this.center.querySelector("section.<style-class>"); }


	/**
	 * Handles that activity has changed from false to true.
	 */
	async processActivated () {
		this.messageOutput.value = "";

		// redefine center content
		const template = document.querySelector("head>template.<style-class>");
		while (this.center.lastElementChild) this.center.lastElementChild.remove();
		this.center.append(template.content.firstElementChild.cloneNode(true));

		// register basic event listeners
		// TODO
	}
}


/*
 * Registers an event listener for the browser window's load event.
 */
window.addEventListener("load", event => {
	const controller = new SkeletonTabController();
	console.log(controller);
});
