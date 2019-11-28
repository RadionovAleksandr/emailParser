//import log4j subsystem
const logger = require('./logger.js');

const config = require('config');

const fs = require('fs');

const {EventEmitter} = require('events'); 
const tgbotMonitor = new EventEmitter();

const TelegramBot = require('node-telegram-bot-api');
const token = config.get("Telegram.token");
const bot = new TelegramBot(token, {polling: true});

logger.info("TelegramBot enabled");


let recipientsMap = new Map();
//const recipientsFilePath = config.get("Telegram.recipientsFilePath");
//const chatIds = new Set();
//getRecipientsListFormFile();

/*
bot.on("message", async (msg) => {
    logger.info("Got new message");
    logger.info(msg);
    await bot.sendMessage(-1001393980822, `Тест`, {
        parse_mode: "Markdown"
    });
    
});
*/

// Matches "/sendToAll [whatever]"
bot.onText(/\/sendToAll (.+)/, async (msg, match) => {
    try {
        let chatId = msg.chat.id;
        //dmitry patray chatId
        if (chatId === 301643737) {
            for (chatId of recipientsMap.values()) {
                logger.info(`Send message to ${chatId}`);
                try {
                    await bot.sendMessage(chatId, match[1], {
                        parse_mode: "Markdown"
                    });
                } catch (err) {
                    logger.error(err);
                }
            }
        }
    } catch (err) {
        logger.error(err);
    }
});

// Matches "/subscribe"
bot.onText(/\/subscribe(.*)/, async (msg, match) => {
    try {
        let chatId = msg.chat.id;
        let removeResult = addRecipient(chatId);
        if (removeResult === true) {
            await bot.sendMessage(chatId, "Вы успешно подписались на рассылку");
        } else {
            await bot.sendMessage(chatId, "Вы были ранее подписаны на рассылку");
        }
    } catch (err) {
        logger.error(err);
    }
});

// Matches "/unsubscribe"
bot.onText(/\/unsubscribe/, async (msg, match) => {
    try {
        let chatId = msg.chat.id;
        let removeResult = removeRecipient(chatId);
        if (removeResult) {
            await bot.sendMessage(chatId, "Вы успешно отписались от рассылки");
        } else {
            await bot.sendMessage(chatId, "Вы не были подписаны на рассылку");
        }
    } catch (err) {
        logger.error(err);
    }
});

// Matches "/makeTestUser [whatever]"
bot.onText(/\/makeTestUser ([a-zA-Z0-9]+) {1}([а-яА-Яa-zA-Z0-9 ]+)$/, async (msg, match) => {
    try {
        let chatId = msg.chat.id;
        //dmitry patray chatId
        if (chatId === 301643737 || chatId === 271878857) {
            let userFio = match[2].trim();
            if (userFio) {
                tgbotMonitor.emit("userCreateRequest", {
                    username: match[1],
                    fio: userFio,
                    chatId: chatId
                });
            } else {
                logger.info(`Send message to ${chatId}`);
                await bot.sendMessage(chatId, `Пожалуйста, укажите ФИО пользователя`, {
                    parse_mode: "Markdown"
                });
            }
        }
    } catch (err) {
        logger.error(err);
    }
});

bot.on('callback_query', async (msg) => {
    try {
        logger.info(`Receive new cb query from ${msg.message.chat.id}`);
        await bot.answerCallbackQuery(msg.id);
        //logger.info(msg);
        if (msg.message) {
            let newText = msg.message.text;
            newText = "✅" + newText.substring(2);
            newText = newText.replace(/\[/g, "\\\[");
            await bot.editMessageText(newText, {
                parse_mode: "Markdown", 
                chat_id: msg.message.chat.id,
                message_id: msg.message.message_id
            });
        }
    } catch (err) {
        logger.error(err);
    }
});

/*
function addRecipient(chatId) {
    let chatIdString = String(chatId);
    if (!chatIds.has(chatIdString)) {
        //chatIds.add(chatIdString);
        //logger.info(`New recipient Array: ${Array.from(chatIds)}`);
        //updateRecipientsListToFile(chatIds);
        return true;
    } else {
        return false;
    }
}

function removeRecipient(chatId) {
    let chatIdString = String(chatId);
    if (chatIds.has(chatIdString)) {
        chatIds.delete(chatIdString);
        logger.info(`New recipient Array: ${Array.from(chatIds)}`);
        updateRecipientsListToFile(chatIds);
        return true;
    } else {
        return false;
    }
}

function getRecipientsListFormFile() {
	let fileContent = fs.readFileSync(recipientsFilePath, "utf-8");
	logger.info(`Current recipients are: ${fileContent}`);
	let idsArray = (fileContent ? fileContent.split(',') : []);
	for (let chatId of idsArray) {
		chatIds.add(chatId);
	}
}

function updateRecipientsListToFile(chatIds) {
	fs.writeFileSync(recipientsFilePath, String(Array.from(chatIds)));
}
*/

module.exports.sendMessages = async (sendData, options) => {
	sendData.text = sendData.text.replace(/\[/g, "\\\[");
    for (chatId of recipientsMap.values()) {
		try {
			if (options && options.silent) {
				logger.info(`Send silent message to ${chatId}`);
				await bot.sendMessage(chatId, sendData.text, {
		            parse_mode: "Markdown",
		            disable_notification: true
		        });
			} else {
				logger.info(`Send message to ${chatId}`);
				await bot.sendMessage(chatId, sendData.text, {
	                parse_mode: "Markdown"//,
	                //reply_markup: JSON.stringify({
	                //    inline_keyboard: [
	                //        [{"text": "Исправлено","callback_data": "Fixed"}]
	                //    ]
	                //})
	            });
			}
        } catch (err) {
            logger.error(err);
        }
	}
}
module.exports.sendMessageToChat = async (chatId, sendData, options) => {
    sendData.text = sendData.text.replace(/\[/g, "\\\[");
    try {
    	if (options && options.silent) {
    		logger.info(`Send silent message to ${chatId}`);
    		await bot.sendMessage(chatId, sendData.text, {
	            parse_mode: "Markdown",
	            disable_notification: true
	        });
    	} else {
    		logger.info(`Send message to ${chatId}`);
    		await bot.sendMessage(chatId, sendData.text, {
	            parse_mode: "Markdown"
	        });
    	}
    } catch (err) {
        logger.error(err);
    }
}
module.exports.on = tgbotMonitor.on.bind(tgbotMonitor);
module.exports.recipientsMap = recipientsMap;