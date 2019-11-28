smartTracker = async function(parsedMessage, seqno, attributes) {
    info(2)
    logger.info(`Found message from:` + parsedMessage.from[0].address);
    logger.info(parsedMessage);
    //try to move message to a destination folder

    logger.info(`Текст сообщения` + parsedMessage.text);
    logger.info(`Адрес отправителя` + parsedMessage.from[0].address);

    logger.info(`Отправитель сообщения` + parsedMessage.from[0].name);;

    //!!
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
    }


    let userCookie = await globalLogin({
        appUrl: `http://erp.point.smart-consulting.ru/`,
        username: 'aradionov',
        password: 'aradionov'
    });


    const ClientsArr = await axios.post(`http://erp.point.smart-consulting.ru/rest/data/entity`, {
        "entityId": "e333d3ed-3ce3-fab3-33b3-b3fc3b3dd3a3",
        "attributes": ["username", "fio", "Post", "groupsOfUser", "groupsOfUser.groupId", "orgRolesOfUser.organizationrolename", "email", "UserSetting.customer.Org", "deleted"],
        "bindType": "entity",
        "gridObjectId": "e618eb4f-5216-75f2-e595-715752fae654",
    }, {
        headers: {
            "Content-Type": "application/json;charset=UTF-8",
            "Cookie": userCookie
        }
    });

    const contracts = await axios.post(`http://erp.point.smart-consulting.ru/rest/data/entity`, {
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

    let autorId;
    let organizathionId;
    ClientsArr.data.forEach(element => {
        if (!!element[5]) {
            element[5].forEach(item => {
                if (item == 'customer') {
                    if (element[7] == parsedMessage.from[0].address) {
                        organizathionId = element[8].objectId;
                        autorId = element[0];
                    }
                }
            })

        };
    })
    logger.info(`autorId ${autorId}`);
    logger.info(`organizathionId ${organizathionId}`);

    if (!!autorId) {

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

        contracts.data.forEach(element => {
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


        logger.info(`орг: ${contractOrganizathion} продукт:${product} модуль:${modul}`)

        let createAppeal = await axios.post(`http://erp.point.smart-consulting.ru/rest/data/entity/${myUUID}?formId=0446c743-85a8-4f29-638f-ecca73b02cda`, {
            "AnswerDate": "",
            "CreateDate": `${timestamp}`,
            "DateSLA": "",
            "Descripthion": `${parsedMessage.text}`,
            "FileST": "",
            "JiraLink": "",
            "ResponseDateDesired": "",
            "Title": "Сгенерировано по email",
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
    }
    //!!
}