// ***********
// add-team teamname
// ***********

const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();

function addTeam(team_name, response) {
 var deferred = Promise.defer();

 var params = {
  Item: {
   "teamname": team_name
  },
  TableName: process.env.TEAMS_TABLE,
  Expected: {
      teamname: {
          Exists: false
      }
  }
 };

 console.log("Trying to create team ", team_name);
 docClient.put(params, function(err, data) {
   if (err) {
       response['error'] = err;
       console.log(err, err.stack);
   } else {
       response['results'] = ["Successfully created team - " + team_name]
   }
   deferred.resolve()
 });
 return deferred.promise;
}

function formatError(error) {
    console.log("Error occurred while creating team - " + error);
    return "Error occurred while creating team. Please make sure the team doesn't exist already by running `list teams` command"
}

function formatResponse(response) {
    if (response['error']) {
      return "Error while creating team - " + response['error']
    }
    console.log("Successfully created team " + response);
    return response['results'].join(". ") + ". Run `list teams` to get updated information"
}

exports.handler = (event, context, callback) => {
    console.log(event);

    var response = {results: [], error: null}

    var new_team = event.params[0];

    console.log("Adding new team - ", new_team);

    return Promise.resolve(new_team)
        .then((new_team) => addTeam(new_team, response))
        .then(() => formatResponse(response), formatError)
        .then((msg) => callback(null, msg))
        .catch(error => callback(error, null));
};
