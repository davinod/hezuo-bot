// ***********
// remove-team teamname
// ***********

const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();

function removeMember(member_name, response) {

 var params = {
  Key: {
   username: member_name
  },
  TableName: process.env.MEMBERS_TABLE,
  ConditionExpression:"username = :member",
  ExpressionAttributeValues: {
    ":member": member_name
  }
 };

 console.log("Trying to remove member ", member_name);
 return docClient.delete(params, function(err, data) {
   if (err) {
       response['error'] = err;
       console.log(err, err.stack);
   } else {
       response['results'] = ["Successfully removed member - " + member_name]
   }
 }).promise();
}

function formatError(error) {
    console.log("Error occurred while removing member - " + error);
    return "Error occurred while removing member. Please make sure the member name is valid by running `list members` command"
}

function formatResponse(response) {
    if (response['error']) {
      return "Error while removing member - " + response['error']
    }
    console.log("Successfully removed member " + response);
    return response['results'].join(". ") + ". Run `list members` to get updated information"
}

exports.handler = (event, context, callback) => {
    console.log(event);

    var response = {results: [], error: null, members: null}

    var member_name = event.params[0];
    console.log("Removing member - ", member_name);

    return Promise.resolve(member_name)
        .then(() => removeMember(member_name, response))
        .then(() => formatResponse(response), formatError)
        .then((msg) => callback(null, msg))
        .catch(error => callback(error, null));
};
