// ***********
// add-team-member
// ***********

const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();

function updateMemberTeam(team_name, member_name, response) {

     console.log("Existing status : ", response);
     if (response['errors'].length > 0) {
       return
     }

    var params = {
      TableName: process.env.MEMBERS_TABLE,
      Key: { username : member_name },
      UpdateExpression: 'set teamname = :team',
      ConditionExpression: 'teamname <> :team',
      ExpressionAttributeValues: {
        ':team' : team_name
      }
    };

    var deferred = Promise.defer();
    docClient.update(params, function(err, data) {
       if (err) {
           response['error'] = err;
           console.log(err, err.stack);
       } else {
           response['results'] = ["Successfully updated team as `" + team_name + "` for user `" + member_name + "`"]
       }
       deferred.resolve()
    });
    return deferred.promise;
}

function formatError(error) {
    console.log("Error occurred while updating member - " + error);
    return "Error occurred while updating member. Please make sure the member is not already added to the team"
}

function formatResponse(response, member_name, team_name) {
    if (response['errors'].length > 0) {
      return "Error while adding the member to team - " + response['errors'].join(" ")
    }
    console.log("Successfully added member to team - ", response['results']);
    return response['results'].join(". ") + ". Run `describe user " + member_name + "` to get updated information"
}

function memberExists(member_name, team_name, response) {
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
      response['errors'].push("Invalid member ```" + member_name + "```.");
    } else if (data.Item.teamname == team_name) {
      response['errors'].push("```" + member_name + "``` is already part of ```" + team_name + "```");
    }
    deferred.resolve()
  });
  return deferred.promise;
}

function teamExists(team_name, response) {

  if (team_name == "NONE") {
      return Promise.resolve().then(function (){})
  }

  var params = {
    TableName : process.env.TEAMS_TABLE,
    Key: {
      teamname: team_name
    }
  };

  var deferred = Promise.defer()
  docClient.get(params, function(err, data) {
    if (err || typeof data.Item == 'undefined') {
      if (err) console.error(err);
      response['errors'].push("Invalid team ```" + team_name + "```.");
    }
    deferred.resolve()
  });
  return deferred.promise;
}

exports.handler = (event, context, callback) => {
    console.log(event);

    var response = {results: [], errors: [], team_exists: true, member_exists: true}

    var team_name = event.params[1];
    var member_name = event.params[0];

    console.log("Adding member " + member_name + " to team " + team_name);

    return Promise.resolve()
        .then(() => teamExists(team_name, response))
        .then(() => memberExists(member_name, team_name, response))
        .then(() => updateMemberTeam(team_name, member_name, response), formatError)
        .then(() => formatResponse(response, member_name, team_name), formatError)
        .then((msg) => callback(null, msg))
        .catch(error => callback(error, null));
};
