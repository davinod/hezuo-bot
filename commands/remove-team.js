// ***********
// remove-team teamname
// ***********

const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();

function removeTeam(team_name, response) {
 if (response['error'] != null) {
    return;
 }

 var params = {
  Key: {
   teamname: team_name
  },
  TableName: process.env.TEAMS_TABLE,
  ConditionExpression:"teamname = :team",
  ExpressionAttributeValues: {
    ":team": team_name
  }
 };

 console.log("Trying to remove team ", team_name);
 var deferred = Promise.defer();
 docClient.delete(params, function(err, data) {
   if (err) {
       response['error'] = err;
       console.log(err, err.stack);
   } else {
       response['results'] = ["Successfully removed team - " + team_name]
   }
   deferred.resolve()
 });
 return deferred.promise;
}

function checkTeamMembers(team_name, response) {
  var deferred = Promise.defer()
  var params = {
      TableName: process.env.MEMBERS_TABLE,
      IndexName: process.env.MEMBERS_TEAM_INDEX,
      KeyConditionExpression: "teamname = :team1",
      ExpressionAttributeValues: {
          ":team1": team_name
      },
      ProjectionExpression: "username"
  };

  docClient.query(params, function(err, data) {
      if (err) {
          response['error'] = "Error while querying existing members";
          console.error("Error while querying existing members. Error:", JSON.stringify(err, null, 2));
          defered.reject();
      } else if (data.Items.length > 0) {
        var members = [];
        data.Items.forEach(function (member) {
            members.push(member.username);
        });
        if (members.length > 0) {
          response['error'] = members.join(", ") + " are part of the team. Update them using `update member-team <username> NONE`. Use `list members` to verify."
        }
      }
      deferred.resolve()
  });
  return deferred.promise;
}

function formatError(error, response) {
    console.log("Error occurred while removing team - " + error);
    return "Error occurred while removing team. Please make sure the team name is valid by running `list teams` command";
}

function formatResponse(response) {
    if (response['error']) {
      return "Error while removing team - " + response['error']
    }
    console.log("Successfully removed team " + response);
    return response['results'].join(". ") + ". Run `list teams` to get updated information"
}

exports.handler = (event, context, callback) => {
    console.log(event);

    var response = {results: [], error: null}

    var team_name = event.params[0];

    console.log("Removing team - ", team_name);

    return Promise.resolve(team_name)
        .then(() => checkTeamMembers(team_name, response))
        .then(() => removeTeam(team_name, response), null)
        .then(() => formatResponse(response), formatError)
        .then((msg) => callback(null, msg))
        .catch(error => callback(error, null));
};
