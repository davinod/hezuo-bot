console.log('Loading event');
var AWS = require('aws-sdk');
var docClient = new AWS.DynamoDB.DocumentClient();

const checkTeam = (team_name, callback) => {

    console.log('team name received is ', team_name);

    var params = {
        TableName: process.env.TEAMS_TABLE,
        Key: {
            teamname: team_name,
        }
    };

    console.log('params is ', params);

    docClient.get(params, callback);
};

exports.handler = function(event, context, callback) {
    
    console.log('event params is ', event.params);
    
    const team_name = event.params.teamname;
    const user_name = event.params.username;

    checkTeam(team_name, function(err, data){
        if(err){
            callback(err, null);
        }

        const params = {
            TableName: process.env.MEMBERS_TABLE,
            Item: {
                "username": user_name,
                "teamname": team_name
            },
        };

        docClient.put(params, function(err, data) {
            callback(err, "Member " + user_name  + " created in " + team_name + " successfully.");
        });
    });
};