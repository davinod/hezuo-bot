// ***********
// describe-member
// ***********

const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();

const ACTIVITIES_LIMIT = 10;

function onActivityScan(err, data, params, deferred, response) {
    try {
        console.log("Inside onActivityScan Function");

        if (err) {
            console.log("Unable to query the table. Error JSON:", err);
            response['errors'].push("Unable to query the table. ", err.errorMessage);
            deferred.resolve()
        } else {
            console.log("Teams Scan succeeded" , data.Items);
            data.Items.forEach(function (activity) {
                if (typeof response['metadata'][activity.ceu_name] != "undefined") {
                    response['activities']['total_hezuo_points'] += response['metadata'][activity.ceu_name]['hezuo_points']
                    response['activities']['total_ceu_points'] += response['metadata'][activity.ceu_name]['ceu_points']
                    if (response['activities']['recent'].length < ACTIVITIES_LIMIT) {
                        response['activities']['recent'].push([activity.ceu_name, activity.teamname, activity.updated_at])
                    }
                }
            });
            if (typeof data.LastEvaluatedKey != "undefined") {
                console.log("Scanning for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.query(params, (err, data) => onActivityScan(err, data, params, deferred, response));
            } else {
                deferred.resolve()
            }
        }
    } catch (ex) {
        response['errors'].push("Exception while scanning records db " + ex.message);
        deferred.resolve()
    }
}

function getActivityReport(member_name, response) {

     console.log("Existing status : ", response);
     if (response['errors'].length > 0) {
       return
     }

    var params = {
        TableName: process.env.ACTIVITY_TABLE,
        Key: { username : member_name },
        ScanIndexForward: true,
        KeyConditionExpression: "username = :member_name",
        ExpressionAttributeValues: {
            ":member_name": member_name
        },
        ProjectionExpression: "ceu_name, updated_at, teamname"
    };

    var deferred = Promise.defer();
    docClient.query(params, (err, data) => onActivityScan(err, data, params, deferred, response));
    return deferred.promise;
}

function onMetadataScan(err, data, params, response, deferred) {
    try {
        console.log("Inside onMetadataScan Function ", params, response, deferred);

        if (err) {
            console.log("Unable to query the table. Error JSON:", err['errorMessage']);
            response['errors'].push("Unable to query ceu table. ", err.errorMessage);
            deferred.resolve()
        } else {
            console.log("Metadata Scan succeeded" , data.Items);
            data.Items.forEach(function (ceu) {
                response['metadata'][ceu.ceu_name] = {
                    hezuo_points: (ceu.hezuo_points > 0)?ceu.hezuo_points:0,
                    ceu_points: (ceu.ceu_points > 0)?ceu.ceu_points:0
                  }
            });
            if (typeof data.LastEvaluatedKey != "undefined") {
                console.log("Scanning for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, (err, data) => onMetadataScan(err, data, params, response, deferred));
            } else {
                deferred.resolve()
            }
        }
    } catch (ex) {
        response['errors'].push("Exception while scanning records db " + ex.message);
        deferred.resolve()
    }
}

function loadMetadata(response) {

     console.log("Existing status of Metadata : ", response);
     if (response['errors'].length > 0) {
       return
     }

    var params = {
      TableName: process.env.CEU_TABLE,
      ProjectionExpression: "ceu_name, hezuo_points, ceu_points"
    };

    var deferred = Promise.defer();
    docClient.scan(params, (err, data) => onMetadataScan(err, data, params, response, deferred));
    return deferred.promise;
}

function formatError(error) {
    console.log("Error occurred while updating member - " + error);
    return "Error occurred while updating member. Please make sure the member is not already added to the team"
}

function formatResponse(response, member_name) {
    if (response['errors'].length > 0) {
      return "Error while describing the member - " + response['errors'].join(" ")
    }
    console.log(response);
    var msg = "```";
    msg += "Member Name: " + member_name + "\n";
    msg += "Current Team Name: " + response['team_name'] + "\n";
    msg += "Total Hezuo Points (All Time): " + response['activities']['total_hezuo_points'] + "\n";
    msg += "Total CEU Points (All Time): " + response['activities']['total_ceu_points'] + "\n";
    msg += "\nRecent Activity:\n";
    msg += "-".repeat(93) + "\n";
    msg += "| Activity  " + " ".repeat(39) + " | "
    msg += "Team" + " ".repeat(4) + " | "
    msg += "Updated At" + " ".repeat(14) + " |\n"
    msg += "-".repeat(92) + "\n"

    response['activities']['recent'].forEach(function (activity) {
        padding = 50 - activity[0].length; // ceu_name
        msg += "| " + activity[0] + " ".repeat(padding)
        padding = 9 - activity[1].length; // team_name
        msg += "| " + activity[1] + " ".repeat(padding)
        padding = 30 - activity[2].length; // updated_at
        msg += "| " + activity[2] + " |\n"
    })
    msg += "-".repeat(93) + "\n```"
    return msg;
}

function memberExists(member_name, response) {
  var params = {
    TableName : process.env.MEMBERS_TABLE,
    Key: {
      username: member_name
    }
  };

  var deferred = Promise.defer();
  docClient.get(params, function(err, data) {
    if (err || typeof data.Item == 'undefined') {
      if (err) console.error(err);
      response['errors'].push("Couldn't get member information for ```" + member_name + "```. Check if member name is valid using ```list members```");
    } else {
        response['team_name'] = data.Item.teamname;
    }
    deferred.resolve()
  });
  return deferred.promise;
}

exports.handler = (event, context, callback) => {
    console.log(event);

    var member_name = event.params[0];

    var response = {
        member_name: member_name,
        metadata: {},
        team_name: null,
        activities: {
            total_hezuo_points: 0,
            total_ceu_points: 0,
            recent: []
        },
        errors: []
    }

    console.log("Describe member " + member_name + " in detail");

    return Promise.resolve()
        .then(() => memberExists(member_name, response))
        .then(() => loadMetadata(response))
        .then(() => getActivityReport(member_name, response), formatError)
        .then(() => formatResponse(response, member_name), formatError)
        .then((msg) => callback(null, msg))
        .catch(error => callback(error, null));
};
