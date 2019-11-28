//import log4j subsystem
const logger = require("./logger.js");

const config = require('config');

const MailListener = require("mail-listener2");

const { EventEmitter } = require('events');
const emailMonitor = new EventEmitter();
logger.info('e2');
const mailListener = new MailListener({
    username: config.get("Email.user"),
    password: config.get("Email.password"),
    host: config.get("Email.host"),
    port: config.get("Email.port"), // imap port
    tls: config.get("Email.secureConnection"),
    connTimeout: 10000, // Default by node-imap
    authTimeout: 5000, // Default by node-imap,
    //debug: logger.info, // Or your custom function with only one incoming argument. Default: null
    tlsOptions: { rejectUnauthorized: false },
    mailbox: "INBOX", // mailbox to monitor
    searchFilter: ["UNSEEN"], // the search filter being used after an IDLE notification has been retrieved
    markSeen: true, // all fetched email willbe marked as seen and not fetched next time
    fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
    mailParserOptions: { streamAttachments: false }, // options to be passed to mailParser lib.
    attachments: true, // download attachments as they are encountered to the project directory

    attachmentOptions: {
        directory: 'attachments/'
    } // specify a download directory for attachments

});
logger.info('e3');
let ServerStatus = "disconnected";

// start listening
mailListener.start();

mailListener.on("server:connected", function() {
    logger.info(`Connected to ${config.get("Email.host")} successfully`);

    ServerStatus = "connected";
});

mailListener.on("error", function(err) {
    logger.error(`There are troubles communicating with ${config.get("Email.host")}\n${err}`);
});

mailListener.on("mail", function(mail, seqno, attributes) {
    emailMonitor.emit("newMessage", mail, seqno, attributes);
});

mailListener.on("attachment", function(attachment) {
    logger.info(`attachment.path ${attachment.path}`);
});

mailListener.on("server:disconnected", function() {
    logger.warn(`Disconnected from ${config.get("Email.host")}`);

    ServerStatus = "disconnected";

    const connectInterval = 10000;
    logger.info(`Next connection attempt in ${connectInterval/1000}s`);
    setTimeout(function() {
        connectToEmailServer({
            checkConnectionInterval: connectInterval
        });
    }, connectInterval);
});
//func to connect email server
function connectToEmailServer({ checkConnectionInterval }) {
    logger.info(`Try to connect email server`);
    mailListener.start();

    setTimeout(function() {
        if (ServerStatus === "disconnected") {
            connectToEmailServer({
                checkConnectionInterval
            });
        }
    }, checkConnectionInterval);
}

const moveMessage = async({ msgUid, mailboxName }) => {
    return new Promise((resolve, reject) => {
        mailListener.imap.move(msgUid, mailboxName, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

const deleteMessage = function() {

}

module.exports.on = emailMonitor.on.bind(emailMonitor);
module.exports.moveMessage = moveMessage;
module.exports.deleteMessage = deleteMessage;
//выделить функцию для удаления сообщения (при получении от прода списка упавших процессов)