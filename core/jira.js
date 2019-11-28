//import log4j subsystem
const logger = require('./logger.js');

const config = require('config');

const {EventEmitter} = require('events'); 
const jiraMonitor = new EventEmitter();

const jiraState = config.get("jira.enabled");

if (jiraState === true) {
	logger.info("JiraMonitor enabled");

	const axios = require('axios');

	const moment = require('moment');

	const fs = require('fs');

	const lastCheckDateFilePath = config.get("jira.lastCheckDateFilePath");

	const getLastCheckDateFromFile = () => {
		let fileContent = fs.readFileSync(lastCheckDateFilePath, "utf-8");
		logger.info(`Last jira check date is ${fileContent}`);
		
		let lastCheckDateMs = Number(fileContent), 
			lastCheckDate;
		if (fileContent && !Number.isNaN(lastCheckDateMs) && (lastCheckDateMs < new Date().getTime())) {
			lastCheckDate = new Date(lastCheckDateMs);
		} else {
			logger.warn(`Unusual situation. Set last jira check date as current time`);
			lastCheckDate = new Date();
			updateLastCheckDateToFile(lastCheckDate.getTime());
		}
		return lastCheckDate;
	}
	const updateLastCheckDateToFile = (newTimestamp) => {
		fs.writeFileSync(lastCheckDateFilePath, newTimestamp);
	}

	const jiraURL = config.get("jira.commonURL");
	
	const knownIssues = new Set();
	let lastCheckDate = getLastCheckDateFromFile();

	//call function and check new jira incident
	(async function checkJiraIncident() {
		try {
			//logger.info("Send request to jira");
			let jqlQuery = `project = SK AND issuetype = Incident AND "Epic Link" = SK-4455 AND created >= "${moment(lastCheckDate).format("YYYY/MM/DD HH:mm")}"`;
			if (knownIssues.size > 0) {
				jqlQuery += ` AND id not in (${[...knownIssues].join(',')})`;
			}
			let issuesData = await axios.get(jiraURL + `/rest/api/2/search?jql=${jqlQuery}`, {
				headers: {
					"Authorization": config.get("jira.auth")
				}
			});
			//logger.info("Get response from jira");
			for (let issue of issuesData.data.issues) {
				if (knownIssues.has(issue.key)) {
					continue;
				} else {
					knownIssues.add(issue.key);
					jiraMonitor.emit('newIssue', {
						key: issue.key,
						title: issue.fields.summary,
						priority: issue.fields.priority.id,
						url: jiraURL + "/browse/" + issue.key,
						createDate: moment(issue.fields.created).format("DD.MM.YYYY HH:mm:ss")
					});
				}
			}
			updateLastCheckDateToFile(new Date().getTime());
		} catch (err) {
			throw new Error(err);
		} finally {
			setTimeout(checkJiraIncident, 10000);
		}
	})();


} else {
	logger.warn("JiraMonitor is disabled");
}

module.exports.on = jiraMonitor.on.bind(jiraMonitor);