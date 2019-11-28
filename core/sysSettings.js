//import log4j subsystem
const logger = require("./logger.js");

//application shutdown settings
process.stdin.resume();
process.on('exit', (code) => {
    logger.warn(`Shutdown application with code: ${code}`);
    logger.warn(`---------------------------------------`);
});
process.on('SIGINT', process.exit);
process.on('SIGUSR1', process.exit);
process.on('SIGUSR2', process.exit);

process.on('uncaughtException', (err, origin) => {
    logger.error(err);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: `, promise, ` reason: ${reason}`);
});

process.on('warning', (warning) => {
	logger.warn(warning.name);    // Print the warning name
	logger.warn(warning.message); // Print the warning message
	logger.warn(warning.stack);   // Print the stack trace
});