//import log4j subsystem
const logger = require("./logger.js");

const {emoji} = require('node-emoji');

const moment = require('moment');

module.exports.init = init;
module.exports.jira = {
	getTGBotData: getJiraTGBotData
}
module.exports.email = {
	getMailboxByMail,
	getTGBotData: getEmailTGBotData
}

function init() {

}

//=============================jira functions===============================
function getJiraTGBotData(issueData) {
    let prioritySign = getPrioritySign(issueData.priority);
    let priorityName = getPriorityName(issueData.priority);

    let tgBotGroup = "JIRA_ISSUE";
    let tgBotMessage = `${emoji.zap}*Новый инцидент в Jira*\n*Наименование:* ${issueData.title}\n*Приоритет:* ${priorityName + prioritySign}\n*Дата и время:* ${issueData.createDate}\n*Тикет:* ${issueData.url}`;

    return {tgBotGroup, tgBotMessage};
}
function getPriorityName(priorityId) {
	let priorityName;
	switch (priorityId) {
		case "1":
			priorityName = "блокирующий";
		break;
		case "2":
			priorityName = "критический";
		break;
		case "3":
			priorityName = "основной";
		break;
		case "4":
			priorityName = "минор";
		break;
		case "5":
			priorityName = "тривиальный";
		break;
		default:
			priorityName = "не определен";
		break;
	}
	return priorityName;
}
function getPrioritySign(priorityId) {
    let prioritySign;
    switch (priorityId) {
        //блокирующий
        case "1":
            prioritySign = emoji.no_entry_sign;
        break;
        //критический
        case "2":
            prioritySign = emoji.exclamation;
        break;
        //основной
        case "3":
            prioritySign = emoji.warning;
        break;
        //минор
        case "4":
            prioritySign = "";
        break;
        //тривиальный
        case "5":
            prioritySign = "";
        break;
        default:
            prioritySign = "";
        break;
    }
    return prioritySign;
}

//=============================email functions===============================
function getEmailTGBotData(parsedMessage) {
	let tgBotGroup, tgBotMessage,
        regionName = getRegionNameByMail(parsedMessage.from[0].address),
        eventTime = moment(parsedMessage.date).format("DD.MM.YYYY HH:mm:ss");

    if (parsedMessage.text) {
        if (parsedMessage.text.includes("Ошибка выполнения процесса")) {
            let processName = getProcessName(parsedMessage.text);
            tgBotMessage = `${emoji.fire}*Ошибка выполнения процесса*\n*Регион:* ${regionName}\n*Процесс:* ${processName}\n*Дата и время:* ${eventTime}`;
            tgBotGroup = "PROCESS_ERROR";
        } else if (parsedMessage.subject === "МВ-запрос не прошел валидацию") {
            tgBotMessage = `🧨*МВ-запрос не прошел валидацию*\n*Регион:* ${regionName}\n*Дата и время:* ${eventTime}`;
            tgBotGroup = "MV_ERROR";
        } else if (parsedMessage.subject === "Заявки с некорректным МВ запросом") {
        	tgBotMessage = `🚨*Сработал мониторинг МВ-запросов охоты*\n*Регион:* ${regionName}\n*Дата и время:* ${eventTime}`;
            tgBotGroup = "OHOTA_ERROR";
        }
    } else if (!parsedMessage.html) {
        throw new Error(`Mail without text: ${parsedMessage}`);
    }
    return {tgBotGroup, tgBotMessage};
}
//function for getting region's folder
function getMailboxByMail(eMail) {
    let mailBoxPath;
    switch (eMail) {
        case "vishunt@govrb.ru":
            mailBoxPath = "INBOX/03 - Бурятия";
        break;
        case "ohotbilet@rk08.ru":
        case "no-reply@rk08.ru":
            mailBoxPath = "INBOX/08 - Калмыкия";
        break;
        case "ohota@sakha.gov.ru":
            mailBoxPath = "INBOX/14 - Якутия";
        break;
        case "eis@oepak22.ru":
            mailBoxPath = "INBOX/22 - Алтайский край";
        break;
        case "mais@barnaul-adm.ru":
            mailBoxPath = "INBOX/22 - Барнаул";
        break;
        case "ohototvet@primorsky.ru":
        	mailBoxPath = "INBOX/25 - Владивосток";
        break;
        case "hunt@gov-murman.ru":
            mailBoxPath = "INBOX/51 - Мурманск";
        break;
        case "smartkit@nso.ru":
            mailBoxPath = "INBOX/54 - Новосибирск";
        break;
        case "pgu@gov67.ru":
            mailBoxPath = "INBOX/67 - Смоленская область";
        break;
        case "ohota.chukotka-gov.ru@yandex.ru":
            mailBoxPath = "INBOX/87 - ЧАО";
        break;
        case "pgu@gosuslugi92.ru":
            mailBoxPath = "INBOX/92 - Севастополь";
        break;
        //сделать папку "Нераспределенное"
        default:
            mailBoxPath = "INBOX/Нераспределенные";
        break;
    }
    return mailBoxPath;
}
//function for getting region's name
function getRegionNameByMail(eMail) {
    let regionName;
    switch (eMail) {
        case "vishunt@govrb.ru":
            regionName = "Республика Бурятия";
        break;
        case "hunt@gov-murman.ru":
            regionName = "Мурманская область";
        break;
        case "eis@oepak22.ru":
            regionName = "Алтайский край";
        break;
        case "mais@barnaul-adm.ru":
            regionName = "город Барнаул";
        break;
        case "pgu@gosuslugi92.ru":
            regionName = "город Севастополь";
        break;
        case "smartkit@nso.ru":
            regionName = "Новосибирская область";
        break;
        case "pgu@gov67.ru":
            regionName = "Смоленская область";
        break;
        case "ohotbilet@rk08.ru":
        case "no-reply@rk08.ru":
            regionName = "Республика Калмыкия";
        break;
        case "ohota@sakha.gov.ru":
            regionName = "Республика Саха (Якутия)";
        break;
        case "ohototvet@primorsky.ru":
            regionName = "Приморский край";
        break;
        case "ohota.chukotka-gov.ru@yandex.ru":
            regionName = "ЧАО";
        break;
        default:
            regionName = "не определен";
        break;
    }
    return regionName;
}
function getProcessName(emailText) {
    let processName;
    let failData = emailText.match(/({.{1,}})/gs)[0];
    if (failData) {
        try {
            let parsedFailData = JSON.parse(failData);
            processName = parsedFailData.processName;
        } catch (err) {
            processName = "не определен";
        }
    } else {
        processName = "не определен";
    }
    return processName;
}