// ***********
// list-teams
// ***********

const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();

function onScan(err, data, params, deferred, response) {
    try {
        console.log("Inside onScan Function");

        if (err) {
            console.log("Unable to query the table. Error JSON:", err['errorMessage']);
            response['error'] = "Unable to query the table. ", err.errorMessage;
            deferred.resolve()
        } else {
            console.log("Teams Scan succeeded" , data.Items);
            data.Items.forEach(function (team) {
                response['results'].push(team.teamname);
            });
            if (typeof data.LastEvaluatedKey != "undefined") {
                console.log("Scanning for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                return docClient.scan(params, (err, data) => onScan(err, data, params, deferred, response)).promise();
            } else {
                deferred.resolve()
            }
        }
    } catch (ex) {
        response['error'] = "Exception while scanning records db " + ex.message;
        deferred.resolve()
    }
}

const scanTeams = (params, response) => {
    console.log("Inside scanTeams");
    var deferred = Promise.defer();
    docClient.scan(params, (err, data) => onScan(err, data, params, deferred, response));
    return deferred.promise;
}

function formatError(error) {
    console.log("Error occurred while scanning database - " + error);
    return "Error occurred while scanning database"
}

function formatResponse(response) {
    console.log("Got messages " + response);
    return "```Hezuo Teams List: " + response['results'].sort().join(", ") + "```";
}

exports.handler = (event, context, callback) => {
    var params = {
        TableName: process.env.TEAMS_TABLE,
        ProjectionExpression: "teamname"
    };

    var response = {results: [], error: null}
    console.log("Scanning Teams table.");

    return Promise.resolve(params)
        .then((params) => scanTeams(params, response), null)
        .then(() => formatResponse(response), formatError)
        .then((msg) => callback(null, msg))
        .catch(error => callback(error, null));
};
