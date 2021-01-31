'use strict';

// The adapter-core module gives you access to the core ioBroker functions
const utils = require('@iobroker/adapter-core');
const mytools = require('./lib/mytools');
const notification = require('./lib/notification');

const Device_SecurityAlert  = 'AlertSystem';
const Channel_AlertSettings = 'settings';
const Channel_Messages      = 'messages';

const Alert_off             = 'alert_off';
const Alert_temp_off        = 'alert_temp_off';
const Alert_Hazard_off      = 'alert_hazard_off';

const Alert_type_sensors    = 'sensors';
const Alert_type_hazard     = 'hazard';

const Message_short         = 'short_text';
const Message_long          = 'long_text';

//notifications
const NoticeTypeLong        = 'longNotice';
const ErrorNotification     = 'Error';
//const InfoNotification      = 'Info';
const WarningNotification   = 'Warn';

// Load your modules here, e.g.:
// const fs = require("fs");

class SecurityAlert extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: 'security-alert',
		});
		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		// this.on('objectChange', this.onObjectChange.bind(this));
		// this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
		this.ArrayAlert = [];
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		//Check adapter configuration
		if (!this.config.enumAlarm || !this.config.sensors) {
			this.log.error('*** Adapter deactivated, missing adaper configuration !!! ***');
			this.setForeignState('system.adapter.' + this.namespace + '.alive', false);
		}
		//Global settings
		await this.getForeignObject('system.config', (err, obj) => {
			this.systemLang = obj.common.language;
		});
		await this._initAdapter(this.systemLang);
		await this._createAdapterSettings();
		this._startAdapter();
	}

	// Start initialization adapter
	_initAdapter(systemLang) {
		// define global constants
		this.globalDevice              = this.namespace + '.' + Device_SecurityAlert;
		this.globalAlertChannel        = this.namespace + '.' + Device_SecurityAlert + '.' + Channel_AlertSettings;
		this.globalMessageChannel      = this.namespace + '.' + Device_SecurityAlert + '.' + Channel_Messages;

		this.telegram = {
			type: 'message',
			instance: this.config.telegramInstance,
			SilentNotice: this.config.telegramSilentNotice,
			User: this.config.telegramUser,
			systemLang
		};

		this.whatsapp = {
			type: 'message',
			instance: this.config.whatsappInstance,
			systemLang
		};

		this.pushover = {
			type: 'message',
			instance: this.config.pushoverInstance,
			SilentNotice: this.config.pushoverSilentNotice,
			deviceID: this.config.pushoverDeviceID,
			Sound: this.config.pushoverSound,
			Priority: this.config.pushoverPriority,
			systemLang
		};

		this.email = {
			type: 'message',
			instance: this.config.emailInstance,
			emailReceiver: this.config.emailReceiver,
			emailSender: this.config.emailSender,
			systemLang
		};
	}

	// Create adapter settings
	async _createAdapterSettings() {
		// Device Alarm system
		await this.createMyDevice(this.globalDevice, 'Alarm settings');

		// Channel settings
		// id, object_name, value, ack, role, write, read, list, norefresh, forced
		await this.createMyChannel(this.globalAlertChannel, 'Switches');
		await this.createAdapterStructure(this.globalAlertChannel + '.' + Alert_off, 'alert off', false, true, 'indicator', true, true, '', false, true);
		await this.subscribeStates(this.globalAPIChannel + '.' + Alert_off);
		await this.createAdapterStructure(this.globalAlertChannel + '.' + Alert_temp_off, 'hazard alert temporary disabled', false, true, 'indicator', true, true, '', false, true);
		await this.subscribeStates(this.globalAPIChannel + '.' + Alert_temp_off);
		await this.createAdapterStructure(this.globalAlertChannel + '.' + Alert_Hazard_off, 'hazard alert disabled', false, true, 'indicator', true, true, '', false, true);
		await this.subscribeStates(this.globalAPIChannel + '.' + Alert_Hazard_off);

		// Channel Messages
		await this.createMyChannel(this.globalMessageChannel, 'Messages');
		await this.createAdapterStructure(this.globalMessageChannel + '.' + Message_short, 'long message', '', true, 'text', false, true, '', false, true);
		await this.createAdapterStructure(this.globalMessageChannel + '.' + Message_long, 'short message', '', true, 'text', false, true, '', false, true);

	}

	//Start adapter
	async _startAdapter() {
		//get all enum members
		await this.getAlertEnumerations(this.config.enumAlarm)
			.then(alert => {
				this.ArrayAlert = alert;
				alert.forEach(alert_attributes => {
					//this.log.debug('Alert attributes: ' + alert_attributes[0] + ' | ' + alert_attributes[1] + ' | ' + alert_attributes[2] + ' | ' + alert_attributes[3] + ' | ' + alert_attributes[4] + ' | ' + alert_attributes[5] + ' | ' + alert_attributes[6] + ' | ' + alert_attributes[7] + ' | ' + alert_attributes[8] + ' | ' + alert_attributes[9] + ' | ' + alert_attributes[10] + ' | ' + alert_attributes[11]);
					this.subscribeForeignStates(alert_attributes[2]); //subscribe OID of sensor
					this.log.debug('Subscribe ' + alert_attributes[2]);
				});
			})
			.catch(() => {
				this.log.error('*** Adapter deactivated. No sensors assigned !!! ***');
				this.setForeignState('system.adapter.' + this.namespace + '.alive', false);
			});
	}

	//get array of sensors
	_getArraySensors(enum_search) {
		return new Promise((resolve,reject) => {
			let array_found = -1;
			for (let count = 0; count < this.config.sensors.length; count++) {
				if(this.config.sensors[count].alert_enum == enum_search) {
					array_found = count;
					break;
				}
			}
			if(array_found >= 0){
				resolve(this.config.sensors[array_found]);
			} else {
				reject(false);
			}
		});
	}

	//get all objects from enumerationa
	async getAlertEnumerations(enum_alert) {
		const alert_array = [];
		return new Promise((resolve,reject) => {
			this.getEnums(enum_alert, (err, res) => {
				if (res) {
					const _alert = res['enum.' + enum_alert];
					for ( const group in _alert) {
						const alert_enum = _alert[group]._id.substring(_alert[group]._id.lastIndexOf('.') + 1);
						this._getArraySensors(alert_enum)
							.then(sensors => {
								for (const alert_trigger in _alert[group].common.members) {
									const alert_id          = _alert[group]._id;
									const alert_member      = _alert[group].common.members[alert_trigger];
									const alert_member_name = this.getObject(alert_member).name;
									alert_array.push(
										new Array(
											alert_enum,               //0 - group of enumeration
											alert_id,                 //1 - ID of enumeration
											alert_member,							//2 - member of enumeration groups
											alert_member_name,				//3 - name of alert_member
											sensors.alert_value,			//4 - value to check after onChange
											sensors.alert_type,			  //5 - type of alert (hazard/sensors)
											sensors.alert_category,   //6 - category of sensor (window,door,fire...)
											sensors.alert_message,		//7 - own message text
											sensors.alert_notif,			//8 - send notification (eMail,Telegram,WhatsApp,Pushover)
											sensors.alert_alexa,			//9 - send messge to alexa (speak)
											sensors.alert_awtrix,		  //10 - send message to AWTRIX
											sensors.alert_siren)			//11 - activate siren
									);
								}
								resolve(alert_array);
							})
							.catch(() => {
								this.log.debug('Enumeration ' + alert_enum + ' not assigned!');
								reject(true);
							});
					}
				} else if (err) {
					this.log.debug('Nothing found');
					reject(false);
				}
			});
		});
	}

	// Create Device
	async createMyDevice(path, name) {
		await this.setObjectNotExists(path, {
			type: 'device',
			common: {
				name: name,
			},
			native: {},
		});
	}

	// Create Channel
	async createMyChannel(path, name) {
		await this.setObjectNotExists(path, {
			type: 'channel',
			common: {
				name: name,
			},
			native: {},
		});
	}

	//dynamic creation of datapoints
	async createAdapterStructure (id,object_name,value, ack, role, write, read, list, norefresh, forced) {
		//const macadress = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i;

		if (!role) {
			if (typeof value === 'boolean') {
				role = 'indicator';
			} else if (typeof value === 'string') {
				role = 'text';
			} else {
				role = 'state';
			}
		}
		if (!list) {
			list = '';
		}

		if (forced) {
			await this.setObjectAsync(id, {
				type: 'state',
				common: {
					name: object_name,
					role: role,
					type: typeof value,
					read: read,
					write: write,
					states: list
				},
				native: {},
			});
			if (!norefresh) {
				await this.setState(id, value, ack);
			}
		} else {
			await this.setObjectNotExistsAsync(id, {
				type: 'state',
				common: {
					name: object_name,
					role: role,
					type: typeof value,
					read: read,
					write: write,
					states: list
				},
				native: {},
			});
			if (!norefresh) {
				await this.setState(id, value, ack);
			}
		}
	}

	//activate siren
	_setAlarmSiren(array_state, state, value) {
		if(array_state[11] && state && value) {  //set alarm siren
			this.setState(state, value, true);
		}
	}

	//message text & siren
	_getMessageText(array_state, add_oid_name) {
		let message_text = '';
		if(array_state[7] && array_state[7] != '') {  //Text for message
			message_text = array_state[7];
		} else {
			switch (array_state[6]) {  //category
				case 'fire':
					message_text = 'Fire in the house! Leave your home immediately!';
					break;
				case 'gas':
					message_text = 'Gas leak in the house! Leave your home immediately!';
					break;
				case 'co':
					message_text = 'Carbon monoxide in the house! Leave your home immediately!';
					break;
				case 'water':
					message_text = 'Water ingress in the house! Close the main tap immediately!';
					break;
				case 'vibration':
					message_text = 'Vibration alarm triggered! Check immediately!';
					break;
				case 'window':
					message_text = 'Someone is trying to break into the window! Check immediately and call the police!';
					break;
				case 'door':
					message_text = 'Someone is trying to break in through the doors! Check immediately and call the police!';
					break;
				case 'others_contacts':
					message_text = 'Someone is trying to break in! Check immediately and call the police!';
					break;
				case 'others_hazard':
					message_text = 'A hazard alarm has struck. Leave your house immediately!';
					break;
			}
		}
		return (add_oid_name) ? (array_state[3] +  '\n\n' + message_text) : (message_text);
	}

	//send to Alexa
	async _sendToAlexa(send_alexa, alexa_message) {
		await this.setState(send_alexa.alexa_volume_oid, this.config.Alexa_volume_up, true);

		let alexa_message_repeate = alexa_message;
		for (let x = 1; x < send_alexa.alexa_repeate; x++) {
			alexa_message_repeate += alexa_message;
		}

		setTimeout(async function () {
			await this.setState(send_alexa.alexa_oid, '', true);
			await this.setState(send_alexa.alexa_oid, alexa_message_repeate, true);
		}, 1000);
		setTimeout(async function () {
			await this.setState(send_alexa.alexa_volume_oid, this.config.Alexa_volume_no, true);
		}, 10000);
	}

	//create Alexa message
	_sendAlexaMessage(array_state, alexa_message) {
		if (!this.config.alexa || array_state[9]) return; //do not send to alexa
		this.config.alexa.forEach(send_alexa => {
			if (send_alexa.alexa_oid) {
				this._sendToAlexa(send_alexa, alexa_message);
			}
		});
	}

	//send to AWTRIX
	async _sendToAWTRIX(awtrix_oid, awtrix_message) {
		await this.setState(awtrix_oid, '', true);
		await this.setState(awtrix_oid, awtrix_message, true);
	}

	//create AWTRIX String
	_sendAWTRIXMessage(array_state, text, repeatIcon, repeat, duration, rainbow, progress, progressColor, progressBackground, scrollSpeed) {
		if (!this.config.awtrix || !array_state[10]) return; //do not send to AWTRIX
		this.config.awtrix.forEach(send_awtrix => {
			if (send_awtrix.awtrix_oid) {
				let awtrix_message = '';
				awtrix_message = this._addValue(awtrix_message, (send_awtrix.awtrix_force) ? ('"force":true')  : (''));
				awtrix_message = this._addValue(awtrix_message, ('"name":"' + array_state[0].toUpperCase() + '"'));
				awtrix_message = this._addValue(awtrix_message, (send_awtrix.awtrix_lifetime > 0) ? ('"lifetime":' + send_awtrix.awtrix_lifetime.toString())  : ('"lifetime":10'));
				awtrix_message = this._addValue(awtrix_message, (send_awtrix.awtrix_icon > 0) ? ('"icon":' + send_awtrix.awtrix_icon.toString())  : ('"icon":60'));
				awtrix_message = this._addValue(awtrix_message, text);
				awtrix_message = this._addValue(awtrix_message, (send_awtrix.awtrix_sound) ? ('"soundfile":' + send_awtrix.awtrix_sound.toString())  : (''));
				awtrix_message = this._addValue(awtrix_message, (send_awtrix.awtrix_moveicon) ? ('"soundfile":' + send_awtrix.awtrix_moveicon.toString())  : (''));
				awtrix_message = this._addValue(awtrix_message, repeatIcon);
				awtrix_message = this._addValue(awtrix_message, repeat);
				awtrix_message = this._addValue(awtrix_message, duration);
				awtrix_message = this._addValue(awtrix_message, (send_awtrix.awtrix_color) ? ('"color":' + send_awtrix.awtrix_color)  : ('"color":[255,0,0]'));
				awtrix_message = this._addValue(awtrix_message, rainbow);
				awtrix_message = this._addValue(awtrix_message, progress);
				awtrix_message = this._addValue(awtrix_message, progressColor);
				awtrix_message = this._addValue(awtrix_message, progressBackground);
				awtrix_message = this._addValue(awtrix_message, scrollSpeed);
				awtrix_message = '{' + awtrix_message + '}';
				this._sendToAWTRIX(send_awtrix.awtrix_oid, awtrix_message);
			}

		});
	}

	//add new value
	_addValue(text, newEntry) {
		if (newEntry === '') {
			return text;
		} else {
			if (text.length != 0) {
				return text + ',' + newEntry;
			} else {
				return newEntry;
			}
		}
	}

	//format JSON string
	_formatTextValueJSON(wert) {
		let regexp = new RegExp('"', 'g');
		wert = wert.replace(regexp, "'");
		regexp = new RegExp('{', 'g');
		wert = wert.replace(regexp, '(');
		regexp = new RegExp('{', 'g');
		wert = wert.replace(regexp, ')');
		return wert;
	}

	//create Messages to receivers
	_createMessages(array_state) {
		const short_message_text = mytools.tl(this._getMessageText(array_state, false), this.systemLang);
		const long_message_text = ((this.config.NoticeType == NoticeTypeLong) ? mytools.tl('Call security organization and leave the house', this.systemLang) : '');

		//send notification
		if(array_state[8]) {
			notification.sendNotification(this, ErrorNotification, short_message_text + ((this.config.NoticeType == NoticeTypeLong) ? ('\n' + long_message_text) : ('')));
		}
		//Alarm siren
		this._setAlarmSiren(array_state, this.config.AlarmSiren, this.config.AlarmSirenIntruderOn);
		//AWTRIX - force, name, lifetime, icon, text, soundfile, moveicon, repeatIcon, repeat, duration, color, rainbow, progress, progressColor, progressBackground, scrollSpeed
		this._sendAWTRIXMessage(array_state, '"text":"' + short_message_text + '! "', '', '', '', '', '', '', '', '');
		//Alexa
		this._sendAlexaMessage(array_state, short_message_text, this.systemLang);
	}

	//send notification
	async _sendNotification(array_state) {
		const alert_off        = await this.getStateAsync(this.globalAPIChannel + '.' + Alert_off);
		const alert_temp_off   = await this.getStateAsync(this.globalAPIChannel + '.' + Alert_temp_off);
		const alert_hazard_off = await this.getStateAsync(this.globalAPIChannel + '.' + Alert_Hazard_off);

		if (!alert_off && !alert_temp_off) { //security alert active
			switch(array_state[5]) { //send different messages depending on type
				case Alert_type_sensors:
					this._createMessages(array_state);
					break;
				case Alert_type_hazard:
					if(!alert_hazard_off) {
						this._createMessages(array_state);
					}
					break;
			}
		}
	}

	//get array of state
	_getStateArray(id) {
		return new Promise(resolve => {
			for (let count = 0; count < this.ArrayAlert.length; count++) {
				if(this.ArrayAlert[count][2] == id) { //get array depending on subscribed OID's
					resolve(this.ArrayAlert[count]);
					break;
				}
			}
		});
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			if (state.ack === false) {
				// The state was changed
				//this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
				this._getStateArray(id)
					.then(array_state => {
						if (String(state.val) == String(array_state[4])) { //check value of OID
							this.log.debug('State changed: ' + id + ' | ' + state + ' | ' + state.val);
							this._sendNotification(array_state);
						}
					});
			}
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === 'object' && obj.message) {
	// 		if (obj.command === 'send') {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info('send command');

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
	// 		}
	// 	}
	// }

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new SecurityAlert(options);
} else {
	// otherwise start the instance directly
	new SecurityAlert();
}
