import type { AppAlert } from '$lib/types';

let _alert = $state<AppAlert | undefined>();
let _timeOut = $state<number>(2000);

export const appStatus = {
	get alert() {
		return _alert;
	},
	setTimeOut(timeOut: number) {
		_timeOut = timeOut;
	},
	addAlert(msg: AppAlert, timeOut?: number) {
		if (timeOut) {
			_timeOut = timeOut;
		}
		_alert = msg;
		setTimeout(() => {
			_alert = undefined;
		}, _timeOut);
	},
	remove() {
		_alert = undefined;
	}
};
