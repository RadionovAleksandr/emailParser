//import log4j subsystem
const logger = require("./logger.js");

const config = require('config');

const archiveServiceState = config.get("archiveService.enabled");

if (archiveServiceState === true) {
	logger.info("ArchiveService is starting");
} else {
	logger.warn("ArchiveService is disabled");
}