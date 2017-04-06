// ***********
// add-team-member
// ***********

const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();

function addTeamMember(team_name, member_name, response) {

 console.log("Existing status : ", response);
 if (response['team_exists'] == false || response['member_exists'] == false) {
   response['error'] = "Invalid member or team name mentioned. Use `list teams` and `list members` to verify."
   return Promise.resolve(response);
 }

 console.log("both user ane member exist ");

 var params = {
  Item: {
   "teamname": team_name,
   "username": member_name
  },
  TableName: process.env.MEMBER_TEAM_MAP_TABLE,
  ConditionExpression: 'attribute_not_exists(teamname) AND attribute_not_exists(username)'
 };

 console.log("Trying to map " + team_name + " - " + member_name);
 return docClient.put(params, function(err, data) {
   if (err) {
       response['error'] = err;
       console.log(err, err.stack);
   } else {
       response['results'] = ["Successfully added `" + member_name + "` to `" + team_name + "`"]
   }
 }).promise();
}

function formatError(error) {
    console.log("Error occurred while adding member - " + error);
    return "Error occurred while adding member. Please make sure the member is not already added to the team"
}

function formatResponse(response) {
    if (response['error']) {
      return "Error while adding the member to team - " + response['error']
    }
    console.log("Successfully added member to team " + response);
    return response['results'].join(". ") + ". Run `list members` or `list teams` to get updated information"
}

function memberExists(member_name, response) {
  var params = {
    TableName : process.env.MEMBERS_TABLE,
    Key: {
      username: member_name
    }
  };

  return docClient.get(params, function(err, data) {
    if (err || typeof data.Item == 'undefined') {
      if (err) console.error(err);
      response['member_exists'] = false;
    }
  }).promise();
}

function teamExists(team_name, response) {
  var params = {
    TableName : process.env.TEAMS_TABLE,
    Key: {
      team_name: team_name,
      username: "placeholder"
    }
  };

  return docClient.get(params, function(err, data) {
    if (err || typeof data.Item == 'undefined') {
      if (err) console.error(err);
      response['team_exists'] = false;
    }
  }).promise();
}

function testFunction() {
  console.log("Running test function");
}

exports.handler = (event, context, callback) => {
    console.log(event);

    var response = {results: [], error: null, team_exists: true, member_exists: true}

    var team_name = event.params[0];
    var member_name = event.params[1];
    //
    // var team_name = "abcmnl123";
    // var member_name = "something2";

    console.log("Adding member " + member_name + " to team " + team_name);

    return Promise.resolve()
        .then(() => teamExists(team_name, response))
        .then(() => memberExists(member_name, response))
        .then(() => addTeamMember(team_name, member_name, response), formatError)
        .then(() => formatResponse(response), formatError)
        .then((msg) => callback(null, msg))
        .catch(error => callback(error, null));
};
