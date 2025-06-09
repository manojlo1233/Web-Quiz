import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class SnackBarService {

	constructor() { }

	timeoutId = null;

	showSnackBar(message) {
		let snackbar = document.getElementById("snackbar");
		snackbar.className = snackbar.className.replace("show", "");
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
		}
		snackbar.innerHTML = message;
		snackbar.className = "show";
		this.timeoutId = setTimeout(function () {
			snackbar.className = snackbar.className.replace("show", "");
		}, 4000);
	}
}
