//import common app settings (shutdown etc.)
require("./core/sysSettings.js");
// require("./core/smart-tracker.js");
const axios = require('axios');
const fs = require('fs');
const request = require('request-promise-native');
const urlST = require('./core/config-ST.js')

//import log4j subsystem
const logger = require("./core/logger.js");
const moment = require('moment');

logger.info(`Launch application`);
logger.info(' urlST ' + urlST);

(async() => {
    let responseClientsArr;
    let responseСontracts;
    let attachmentsId = []; // массив id вложенных изображений

    async function globalLogin({ appUrl, username, password }) {
        if (!appUrl) {
            throw new Error("appUrl is not defined");
        } else if (!username) {
            throw new Error("username is not defined");
        } else if (!password) {
            throw new Error("password is not defined");
        }

        let loginData = await axios.post(appUrl + `rest/login`, { username, password }, {
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            }
        });
        let RawUserCookie = loginData.headers["set-cookie"][0],
            UserCookie = RawUserCookie.substring(0, RawUserCookie.indexOf(";"));

        return UserCookie;
    };

    let userCookie = await globalLogin({
        appUrl: urlST,
        username: 'aradionov',
        password: 'rgF732aMXs'
    });

    // по циклу гружу картинки на сервер
    async function getAttacmentDir(attachmentArr) {
        logger.info(' START getAttacmentDir ');

        for (let element of attachmentArr) {
            let formData = {};
            formData.attachments = fs.createReadStream(__dirname + `/attachments/${element.fileName}`);

            let attachment = await request.post({
                url: urlST + '/rest/file/upload',
                formData: formData,
                headers: {
                    "Cookie": userCookie,
                    "async": false
                }
            });

            logger.info('Upload successful!  Server responded with:' + attachment);
            attachmentsId.push(attachment);

        }
        logger.info(' FINISH getAttacmentDir ');
    };

    const emailMonitor = require("./core/email.js");
    emailMonitor.on("newMessage", async(parsedMessage, seqno, attributes) => {

        // logger.info(parsedMessage);
        //try to move message to a destination folder

        if (!!parsedMessage.attachments) {
            attachmentsId.length = 0;
            await getAttacmentDir(parsedMessage.attachments);
        };
        createAppeal(parsedMessage, attachmentsId);

    });

    //создаю обращение если выполняются условия
    async function createAppeal(parsedMessage, attachments) {
        logger.info(`START checkAppeal `);

        let autorId;
        let autorEmail;
        let organizathionId;
        let urlClient = urlST + 'rest/data/entity';

        responseClientsArr = await axios.post(urlClient, {
            "entityId": "e333d3ed-3ce3-fab3-33b3-b3fc3b3dd3a3",
            "attributes": ["username", "fio", "Post", "groupsOfUser", "groupsOfUser.groupId", "orgRolesOfUser.organizationrolename", "email", "UserSetting.customer.Org", "UserSetting.Client.Emails", "deleted"],
            "bindType": "entity",
            "gridObjectId": "e618eb4f-5216-75f2-e595-715752fae654",
        }, {
            headers: {
                "Content-Type": "application/json;charset=UTF-8",
                "Cookie": userCookie
            }
        });

        // перебираю массив сотрудников для сравнения пришедшей почты
        responseClientsArr.data.forEach(element => {
                if (!!element[5]) {
                    element[5].forEach(item => {
                        if (item == 'customer') {
                            // logger.info(' element[4] ' + element[4]);
                            // logger.info(' element[5] ' + element[5]);
                            // logger.info(' element[6] ' + element[6]);
                            // logger.info(' email ' + element[7]);
                            // logger.info('element[8] ' + element[8]);
                            // logger.info('element[9] ' + element[9]);
                            if (element[7].trim() === parsedMessage.from[0].address.trim()) {
                                autorEmail = parsedMessage.from[0].address;
                                organizathionId = element[8].objectId;
                                autorId = element[0];
                            }
                        }
                    })

                };
            })
            // logger.info(`autorId ${autorId}`);
            // logger.info(`organizathionId ${organizathionId}`);

        //теперь мы знаем, это точно письмо от нашего клиента
        if (autorId !== undefined && autorId !== false) {
            logger.info('Create appeal')
            let isAppeal = true; //это обращение
            let urlAppeal = urlST + 'rest/data/entity';

            //проверяем создана обращение с подобной темой и подобным автором
            let allAppeal = await axios.post(urlAppeal, {
                "entityId": "bdcd08c0-cae6-1e6e-3ab2-84d9e2f16ccd",
                "gridObjectId": "197595ce-9d83-fbed-0098-dab05e23996e",
                "attributes": ["Title", "Task.Status.Name", "NeedInfo", "InternalNumber"],
                "bindType": "entity"
            }, {
                headers: {
                    "Content-Type": "application/json;charset=UTF-8",
                    "Cookie": userCookie
                }
            });

            allAppeal.data.forEach(async element => {
                // logger.info(parsedMessage.subject)
                // logger.info(element[4]);
                let parsedTitle;
                if (parsedMessage.subject) {
                    // logger.info(parsedMessage.subject.indexOf(element[4]));
                    parsedTitle = parsedMessage.subject;
                } else {
                    parsedTitle = '';
                }
                if (autorEmail == parsedMessage.from[0].address && parsedTitle.indexOf(element[4]) >= 0 && element[4] !== false && element[4] !== '') {

                    // logger.info(`отправяю сообщение к обращению`);
                    // logger.info(`objectId: ${element[0]} "needInfo": ${element[3]} attachments ${attachments}`);
                    isAppeal = false;
                    let urlSentAppeal = urlST + 'rest/processes/createFast/0a5aa834-d443-27bc-e963-5820a75b5700';

                    let sentAppeal = await axios.post(urlSentAppeal, {
                        "order": element[0],
                        "text": parsedMessage.text,
                        "forClient": false,
                        "needInfo": element[3],
                        "file": attachments
                    }, {
                        headers: {
                            "Content-Type": "application/json",
                            "Cookie": userCookie
                        }
                    });
                }
            })

            if (!!isAppeal) {
                //var uuid = require('uuid'); 
                let myUUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0,
                        v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
                //var myUUID = v4uuid;
                let current_datetime = new Date();

                let formatted_date = () => {
                    return current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds()
                }
                let timestamp = formatted_date();

                let contractOrganizathion;
                let product;
                let modul;

                let pullContract = [];
                let pullProduct = [];
                let pullModul = [];

                //из контракта клиента набираем данные для обращения
                let urlContract = urlST + 'rest/data/entity';
                responseСontracts = await axios.post(urlContract, {
                    "entityId": "e053e584-d64a-e44f-af8c-7a79c540d594",
                    "limit": 35,
                    "offset": 0,
                    "attributes": ["customer.objectId", "MainProjectCode.Direction", "MainProjectCode.Product", "ProcessStarted", "Name", "InternalNumber", "Form", "Subform.Name", "Number", "ActingOn", "Creator", "Manager", "Deal", "Status.Name", "StageReconciliation.defaultLabel", "objectId", "deleted"],
                    "bindType": "entity",
                    "gridObjectId": "d869a231-e8a1-f8c5-51ca-c90a5fbf300b",
                }, {
                    headers: {
                        "Content-Type": "application/json;charset=UTF-8",
                        "Cookie": userCookie
                    }
                });
                responseСontracts.data.forEach(element => {
                    if (element[1] == organizathionId) {

                        for (key in element[1]) {};
                        pullContract.push(element[0]);
                        if (!!element[2].objectId) {
                            pullProduct.push(element[2].objectId);
                        };
                        if (!!element[3].objectId) {
                            pullModul.push(element[3].objectId);

                        };

                    }
                });

                if (pullContract.length == 1) {
                    contractOrganizathion = pullContract[0];
                } else {
                    contractOrganizathion = null;
                };

                if (pullProduct.length == 1) {
                    product = pullProduct[0];
                } else {
                    product = null;
                };

                if (pullModul.length == 1) {
                    modul = pullModul[0];
                } else {
                    modul = null;
                };

                logger.info(`орг: ${contractOrganizathion} продукт:${product} модуль:${modul} вложение: ${attachments}`)

                setTimeout(async() => {
                    // logger.info(`attachments ${attachments}`)
                    let urlAppealSent = urlST + `rest/data/entity/${myUUID}?formId=0446c743-85a8-4f29-638f-ecca73b02cda`;
                    let sentAppeal = await axios.post(urlAppealSent, {
                        "AnswerDate": "",
                        "CreateDate": `${timestamp}`,
                        "DateSLA": "",
                        "Descripthion": `${parsedMessage.text}`,
                        "FileST": attachments,
                        "JiraLink": "",
                        "ResponseDateDesired": "",
                        "Title": `${parsedMessage.subject}`,
                        "autor": `${autorId}`,
                        "contract": `${contractOrganizathion}`,
                        "entityId": "bdcd08c0-cae6-1e6e-3ab2-84d9e2f16ccd",
                        "modul": `${modul}`,
                        "objectId": `${myUUID}`,
                        "priority": "",
                        "product": `${product}`,
                        "purpose": ""
                    }, {
                        headers: {
                            "Content-Type": "application/json",
                            "Cookie": userCookie
                        }

                    });
                }, 2000);
            }
        };
        logger.info(`FINISH checkAppeal `);
    };
})();

async function isWorkTime() {
    let workTime, isWorkingDay = await digit.isWorkingDay();
    if (isWorkingDay) {
        let currentTime = moment(),
            startWorkDay = moment().set('hour', 9).set('minute', 30),
            finishWorkDay = moment().set('hour', 18).set('minute', 30);

        if (currentTime.isBetween(startWorkDay, finishWorkDay)) {
            workTime = true;
        } else {
            workTime = false;
        }
    } else {
        workTime = false;
    }
    return workTime;
}

//sleep function js analog
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}