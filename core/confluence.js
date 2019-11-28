//import log4j subsystem
const logger = require('./logger.js');

const config = require('config');

const {EventEmitter} = require('events'); 
const confMonitor = new EventEmitter();

const confState = config.get("confluence.enabled");

if (confState === true) {
	logger.info("ConfluenceMonitor enabled");
		
	const fs = require('fs');

	const RSSParser = require('rss-parser');

	const parser = new RSSParser({
		headers: {
			'Authorization': config.get("confluence.auth")
		},
		timeout: 8000,
		customFields: {
			item: ['summary']
		}
	});

	const confRSSLink = config.get("confluence.RSSLink");

	const lastCheckDateFilePath = config.get("confluence.lastCheckDateFilePath");

	const getLastCheckDateFromFile = () => {
		let fileContent = fs.readFileSync(lastCheckDateFilePath, "utf-8");
		logger.info(`Last confluence check date is ${fileContent}`);
		
		let lastCheckDateMs = Number(fileContent), 
			lastCheckDate;
		if (fileContent && !Number.isNaN(lastCheckDateMs) && (lastCheckDateMs < new Date().getTime())) {
			lastCheckDate = new Date(lastCheckDateMs);
		} else {
			logger.warn(`Unusual situation. Set last confluence check date as current time`);
			lastCheckDate = new Date();
			updateLastCheckDateToFile(lastCheckDate.getTime());
		}
		return lastCheckDate;
	}
	const updateLastCheckDateToFile = (newTimestamp) => {
		fs.writeFileSync(lastCheckDateFilePath, newTimestamp);
	}

	let lastCheckDate = getLastCheckDateFromFile();
	const knownPosts = new Set();

	(async () => {
		//getting already published posts
		let feed = await parser.parseURL(confRSSLink);
		for (let post of feed.items) {
			if (new Date(post.pubDate) <= lastCheckDate) {
				knownPosts.add(post.id);
			} else {
				continue;
			}
		}
		logger.info(`Known blog posts: ${[...knownPosts]}`);
		//checking new posts
		(async function checkNewPosts() {
			try {
				let feed = await parser.parseURL(confRSSLink);
				for (let post of feed.items) {
					if (knownPosts.has(post.id)) {
						continue;
					} else {
						knownPosts.add(post.id);
						confMonitor.emit('newPost', {
							title: post.title,
							author: post.author,
							link: post.link
						});
					}
				}
				updateLastCheckDateToFile(new Date().getTime());
			} catch (err) {
				throw new Error(err);
			} finally {
				setTimeout(checkNewPosts, 10000);
			}
		})();
	})();
} else {
	logger.warn("ConfluenceMonitor is disabled");
}

module.exports.on = confMonitor.on.bind(confMonitor);