import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {

  constructor() { }

  showCustomConfirm(message: string, yesCallback, noCallback = () => {}) {

		const background = document.getElementById("confirm-bg");
		const yesButton = document.getElementById("confirm-yes");
		const noButton = document.getElementById("confirm-no");
		const dialogMessage = background.querySelector("p");

		dialogMessage.textContent = message;
		background.style.display = "block";

		const dialog = document.getElementById("confirm-box");
		dialog.className = "show";

		yesButton.onclick = () => {
			dialog.className = dialog.className.replace("show", "");
			background.style.display = "none";
			yesCallback();
		};

		noButton.onclick = () => {
			dialog.className = dialog.className.replace("show", "");
			background.style.display = "none";
			noCallback();
		};

	}

}