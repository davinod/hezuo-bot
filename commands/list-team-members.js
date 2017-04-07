console.log('Loading event');
var AWS = require('aws-sdk');
var docClient = new AWS.DynamoDB.DocumentClient();

function listTeamMembers(params, team_name, response) {
    var deferred = Promise.defer()

    docClient.query(params, function(err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            deferred.reject()
        } else {
            console.log("Query succeeded.");
            data.Items.forEach(function(item) {
                response["results"].push(item.username);
                console.log(" -", item.username + ": " + item.teamname);
            });
            console.log(response);
            response["results"] = "The team " + team_name + " has the members: " + response["results"].join(":");
            deferred.resolve()
        }
    });

    return deferred.promise;
}

exports.handler = function(event, context, callback) {
    var team_name = event.params[0]
    var params = {
        TableName: process.env.MEMBERS_TABLE,
        IndexName: process.env.MEMBERS_TEAM_INDEX,
        KeyConditionExpression: "teamname = :team1",
        ExpressionAttributeValues: {
            ":team1": team_name
        }
    };
    var response = {results: [], error: null}

    return Promise.resolve(params)
        .then((params) => listTeamMembers(params, team_name, response))
        .then(() => callback(null, response["results"]))
        .catch((error) => callback(error, null));
};