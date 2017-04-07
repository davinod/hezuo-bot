// ***********
// remove-team teamname
// ***********

const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();

function removeTeam(team_name, response) {

 if (response['members'] != null) {
   response['error'] = response['members'] + " are part of the team. Update them using `update member-team <username> NONE`. Use `list members` to verify."
   return Promise.resolve(response);
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
 return docClient.delete(params, function(err, data) {
   if (err) {
       response['error'] = err;
       console.log(err, err.stack);
   } else {
       response['results'] = ["Successfully removed team - " + team_name]
   }
 }).promise();
}

function checkTeamMembers(team_name, response) {
  var params = {
      TableName: process.env.MEMBERS_TABLE,
      IndexName: process.env.MEMBERS_TEAM_INDEX,
      KeyConditionExpression: "teamname = :team1",
      ExpressionAttributeValues: {
          ":team1": team_name
      },
      ProjectionExpression: "username"
  };

  return docClient.query(params, function(err, data) {
      if (err) {
          console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      } else if (data.Items.length > 0) {
        var members = [];
        data.Items.forEach(function (member) {
            members.push(member.username);
        });
        response['members'] = members.join(', ');
      }
  }).promise();
}

function formatError(error) {
    console.log("Error occurred while removing team - " + error);
    return "Error occurred while removing team. Please make sure the team name is valid by running `list teams` command"
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

    var response = {results: [], error: null, members: null}

    var team_name = event.params[0];

    console.log("Removing team - ", team_name);

    return Promise.resolve(team_name)
        .then(() => checkTeamMembers(team_name, response))
        .then(() => removeTeam(team_name, response))
        .then(() => formatResponse(response), formatError)
        .then((msg) => callback(null, msg))
        .catch(error => callback(error, null));
};
