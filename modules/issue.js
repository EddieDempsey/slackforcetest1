"use strict";

let auth = require("./slack-salesforce-auth"),
    force = require("./force"),

    SECRET = process.env.SLACK_TOKEN;

exports.execute = (req, res) => {

    if (req.body.token != SECRET) {
        res.send("Invalid token");
        return;
    }

    let slackUserId = req.body.user_id,
        oauthObj = auth.getOAuthObject(slackUserId),
        params = req.body.text.split(":"),
        name = params[0],
        subject = params[1],
        description = params[2],
        q = "SELECT Id FROM FF__Incident__c where Name LIKE '%" + name + "%' LIMIT 1";
    var incid;
    
    //function query() {
        force.query(oauthObj,q)
        .then(data => {
            let incident = JSON.parse(data).records;
            if (incident && incident.length > 0) {
                incident.forEach( function(incident){
                    incid = incident.Id;
                    console.log(incid);
                });
            } else {
                res.send("No records");
            }
        })
        .catch(error => {
            if (error.code == 401) {
                res.send(`Visit this URL to login to Fusion: https://${req.hostname}/login/` + slackUserId);
            } else {
                console.log(error);
                res.send("An error as occurred");
            }
        });
    //}

    //function create() {
        force.create(oauthObj, "FF__Incident_Activity__c",
        {
            FF__Incident__c: incid,
            FF__Subject__c: subject,
            FF__Description__c: description,
            RecordTypeId: "0120b000000ttK5AAI",
        })
        .then(data => {
            let fields = [];
            fields.push({title: "Subject", value: subject, short:false});
            fields.push({title: "Description", value: description, short:false});
            fields.push({title: "Open in Fusion", value: oauthObj.instance_url + "/" + data.id, short:false});
            let message = {
                text: "A new Issue has been created:",
                attachments: [
                    {color: "#F2CF5B", fields: fields}
                ]
            };
            res.json(message);
        })
        .catch((error) => {
            if (error.code == 401) {
                res.send(`Visit this URL to login to Fusion: https://${req.hostname}/login/` + slackUserId);
            } else {
                res.send("An error as occurred");
            }
        });
    //}

   /*  async function run() {
        console.log('starting run..');
        await query();
        console.log('finished query.. starting create..');
        create();
        console.log('created issue');
    }
    run(); */
};