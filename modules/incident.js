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
        limit = req.body.text,
        q = "SELECT Id, Name FROM FF__Incident__c where FF__Status__c != Closed ORDER BY Name DESC";


    force.query(oauthObj, q)
        .then(data => {
            let incident = JSON.parse(data).records;
            if (incident && incident.length > 0) {
                let attachments = [];
                incident.forEach(function (incident) {
                    let fields = [];
                    fields.push({title: "Incident", value: FF__Incident__c.Name, short: true});
                    fields.push({title: "Id", value: FF__Incident__c.Incident.Id, short: true});
                    fields.push({title: "Open in Salesforce:", value: oauthObj.instance_url + "/" + FF__Incident__c.Id, short:false});
                    attachments.push({
                        color: "#FCB95B",
                        fields: fields
                    });
                });
                res.json({
                    text: "A list of Activive Incidents",
                    attachments: attachments
                });
            } else {
                res.send("No records");
            }
        })
        .catch(error => {
            if (error.code == 401) {
                res.send(`Visit this URL to login to Salesforce: https://${req.hostname}/login/` + slackUserId);
            } else {
                console.log(error);
                res.send("An error as occurred");
            }
        });
};