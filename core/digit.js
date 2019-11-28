//import log4j subsystem
const logger = require('./logger.js');

const config = require('config');

const getGuid = require('uuid/v4');

const axios = require('axios');

async function globalCreateObject({appUrl, userCookie, newObjectData}) {
	if (!userCookie) {
		throw new Error("userCookie is not defined");
	} else if (!appUrl) {
		throw new Error("appUrl is not defined");
	} else if (!newObjectData) {
		throw new Error("newObjectData is not defined");
	} else if (!newObjectData.entityId) {
		throw new Error("newObjectData.entityId is not defined");
	}

	let newObjId = getGuid();
	await axios.post(appUrl + `rest/data/entity/` + newObjId, newObjectData, {
		headers: {
			"Content-Type": "application/json;charset=UTF-8",
			"Cookie": userCookie
		}
	});
}

async function globalLogin({appUrl, username, password}) {
	if (!appUrl) {
		throw new Error("appUrl is not defined");
	} else if (!username) {
		throw new Error("username is not defined");
	} else if (!password) {
		throw new Error("password is not defined");
	}

	let loginData = await axios.post(appUrl + `rest/login`, {username, password}, {
		headers: {
			"Content-Type": "application/json;charset=UTF-8"
		}
	});
	let RawUserCookie = loginData.headers["set-cookie"][0],
		UserCookie = RawUserCookie.substring(0, RawUserCookie.indexOf(";"));

	return UserCookie;
}

const DevApp = (function(){
	const devAppUrl = config.get("devDigitApp.url"),
	      username = config.get("devDigitApp.username"),
	      password = config.get("devDigitApp.password");

	const login = async function(){
		userCookie = await globalLogin({
			appUrl: devAppUrl,
			username,
			password
		});
	}
	const createObject = async function(newObjectData) {
		return globalCreateObject({
			appUrl: devAppUrl,
			userCookie, 
			newObjectData
		});
	}
	//varible to store user p1 cookie
	let userCookie;

	const ERROR_TYPES = [
		"process",
		"MV_monitoring",
		"hunt_monitoring",
		"order_monitoring",
		"jira_issue"
	];

	return {
		getCurrentTGRecipients: async () => {

		},
		createErrorRecord: async function({type, regionCode, text, options}) {
			if (!type) {
				throw new Error("type is not defined");
			} else if (!regionCode) {
				throw new Error("regionCode is not defined");
			} else if (!text) {
				throw new Error("text is not defined");
			}

			//const ERROR_RECORD_ENTITY_ID
		},
		isWorkingDay: async function(timestamp) {
			if (!timestamp) {
				throw new Error(`timestamp is not defined`);
			}
			let workingDay = true;

			if (!userCookie) {
				await login();
			}
			try {
				let {data: responseData} = await axios.post(devAppUrl + `api/SKCalendar/isWorkingDay`, {
					date: timestamp
				}, {
					headers: {
						"Content-Type": "application/json;charset=UTF-8",
						"Cookie": userCookie
					}
				});
				if (responseData.code === 200) {
					if (typeof responseData.result === "boolean") {
						workingDay = responseData.result;
					} else {
						throw new Error(`Working day response type is not boolean`);
					}
				} else {
					throw new Error(`Get ${responseData.code} code from DevApp`);
				}
			} catch (err) {
				logger.error(err);

				//try to get new cookie
				await login();
				try {
					let {data: responseData} = await axios.post(devAppUrl + `api/SKCalendar/isWorkingDay`, {
						date: timestamp
					}, {
						headers: {
							"Content-Type": "application/json;charset=UTF-8",
							"Cookie": userCookie
						}
					});
					if (responseData.code === 200) {
						if (typeof responseData.result === "boolean") {
							workingDay = responseData.result;
						} else {
							throw new Error(`Working day response type is not boolean`);
						}
					} else {
						throw new Error(`Get ${responseData.code} code from DevApp`);
					}
				} catch (err) {
					logger.error(err);
				}
			}
			return workingDay;
		}
	}
})();

const TestApp = (function() {
	const testAppUrl = config.get("testDigitApp.url"),
	      username = config.get("testDigitApp.username"),
	      password = config.get("testDigitApp.password");

	const login = async function(){
		userCookie = await globalLogin({
			appUrl: testAppUrl,
			username,
			password
		});
	}
	const createObject = async function(newObjectData) {
		return globalCreateObject({
			appUrl: testAppUrl,
			userCookie, 
			newObjectData
		});
	}
	//varible to store user p3 cookie
	let userCookie;

	return {
		//func to create test user on trainee.point3
		createTestUser: async function ({username, fio}) {
			const USER_ENTITY_ID = "e333d3ed-3ce3-fab3-33b3-b3fc3b3dd3a3";
			if (!userCookie) {
				await login();
			}
			try {
				await createObject({
					"entityId": USER_ENTITY_ID,
					"username": username,
					"password": username,
					"needChangePassword": true,
					"fio": fio,
					"email": "test@mail.ru",
					"groupsOfUser": ["GROUP_ADMIN"]
				});
				logger.info(`User "${username}" has been created`);
			} catch (err) {
				logger.error(err);

				//try to get new cookie
				await login();
				await createObject({
					"entityId": USER_ENTITY_ID,
					"username": username,
					"password": username,
					"needChangePassword": true,
					"fio": fio,
					"email": "test@mail.ru",
					"groupsOfUser": ["GROUP_ADMIN"]
				});
				logger.info(`User "${username}" has been created`);
			}
		}
	}
})();

module.exports.createTestUser = TestApp.createTestUser;
module.exports.createErrorRecord = DevApp.createErrorRecord;
module.exports.isWorkingDay = function() {
	let timestamp = new Date().getTime();
	return DevApp.isWorkingDay(timestamp);
}
module.exports.createRecipient = function(){

}
module.exports.removeRecipient = function(){
	
}