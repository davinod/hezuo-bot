const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

// ********************************************
// list-members
//
// Desc  : Return the Hezuo-bot Members
// Author: Davi
//
// Usage: @hezuo list members
//
// ********************************************

exports.handler = (event, context, callback) => {

    var params = {
            TableName: process.env.MEMBERS_TABLE,
    };

    console.log("Scanning ", process.env.MEMBERS_TABLE);

    dynamodb.scan(params, function(err, data) {
        if (err)
            throw new Error (err);

        console.log("Scan succeeded. data is ", data);

        //Get the total of members found
        number = Object.keys(data.Items).length;

        var response = "```";

        response = response.concat("\n").concat("-".repeat(65)).concat("\n");
        response = response.concat("| Member").concat(" ".repeat(24)).concat("| Team").concat(" ".repeat(26)).concat("|\n")
        response = response.concat("-".repeat(65));
        
        // print all members
        data.Items.forEach(function(member){
           response = response.concat("\n| ")
                              .concat(member.username)
                              .concat(" ".repeat(30 - member.username.length))
                              .concat("| ")
                              .concat(member.teamname)
                              .concat(" ".repeat(30 - member.teamname.length))
                              .concat("|");
        });

        response = response.concat("\n")
                           .concat("-".repeat(65) + "\n")
                           .concat("Hezuo members found: ".concat(number.toString()))
                           .concat("```");
        

        console.log("response is ", response);

        callback(null,  response);

    });

};
