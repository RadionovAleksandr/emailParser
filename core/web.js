//import log4j subsystem
const logger = require("./logger.js");

const config = require('config');

const webState = config.get("web.enabled");

const express = require('express');
const app = express();

if (webState === true) {
	logger.info("WebModule enabled");

	app.use(express.json()) // for parsing application/json
	app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

	const port = config.get("web.port");
	app.listen(port);
} else {
	logger.warn("WebModule is disabled");
}

module.exports.onPost = app.post.bind(app);