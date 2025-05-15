import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SnackBarService {

  constructor() { }

  showSnackBar(message) {
		let snackbar = document.getElementById("snackbar");
		snackbar.innerHTML = message;
		snackbar.className = "show";
		setTimeout(function() {
			snackbar.className = snackbar.className.replace("show", "");
		}, 4000);
	}
}
