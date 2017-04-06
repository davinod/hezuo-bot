// ***********
// list-members
// ***********

const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();

function onScan(err, data, response) {
    console.log("Inside onScan Function");

    if (err) {
        console.log("Unable to query the table. Error JSON:", err['errorMessage']);
        response['error'] = "Unable to query the table. ", err.errorMessage;
    } else {
        console.log("Teams Scan succeeded" , data.Items);
        data.Items.forEach(function (team) {
            response['results'].push(team.teamname);
        });
        if (typeof data.LastEvaluatedKey != "undefined") {
            console.log("Scanning for more...");
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            return docClient.scan(params, (err, data) => onScan(err, data, response)).promise();
        }
    }
    return response;
}

const scanTeams = (params, response) => {
    return docClient.scan(params, (err, data) => onScan(err, data, response)).promise();
}

function formatError(error) {
    console.log("Error occurred while scanning database - " + error);
    return "Error occurred while scanning database"
}

function formatResponse(response) {
    console.log("Got messages " + response);
    return "```Hezuo Teams List: " + response['results'].join(", ") + "```";
}

exports.handler = (event, context, callback) => {
    var params = {
        TableName: process.env.TEAMS_TABLE,
        ProjectionExpression: "teamname"
    };

    var response = {results: [], error: null}
    console.log("Scanning Teams table.");

    return Promise.resolve(params)
        .then((params) => scanTeams(params, response))
        .then(() => formatResponse(response), formatError)
        .then((msg) => callback(null, msg))
        .catch(error => callback(error, null));
};
