const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

// ********************************************
// list-commands
//
// Desc  : Return the records of command table
// Author: Davi
//
// Usage: @hezuo list commands
//
// ********************************************

exports.handler = (event, context, callback) => {

    var params = {
            TableName: process.env.COMMAND_TABLE,
    };

    console.log("Scanning ", process.env.COMMAND_TABLE);

    dynamodb.scan(params, function(err, data) {
        if (err)
            throw new Error (err);

        console.log("Scan succeeded. data is ", data);

        //Get the total of commands found
        number = Object.keys(data.Items).length;

        console.log("tot number is ", number);

        var response = "```";

        response = response.concat("\n").concat("-".repeat(26)).concat("\n");
        response = response.concat("| List of Hezuo Commands |\n");
        response = response.concat("-".repeat(26)).concat("\n\n");
                
        // print all members
        data.Items.forEach(function(command){
            
            response = response.concat("Command: ")
                               .concat(command.commandname)
                               .concat("\nSample:\n")
                               .concat(command.sample)
                               .concat("\n\n");
        });

        response = response.concat("\n")
                           .concat("-".repeat(26) + "\n")
                           .concat("Commands found: ".concat(number.toString()))
                           .concat("```");
        
        console.log("response is ", response);

        callback(null,  response);

    });

};
