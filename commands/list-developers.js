const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// ********************************************
// list-developers
// 
// Desc  : Return the Hezuo-bot Contributors
// Author: Davi
//
// Usage: @hezuo list developers
//
// ********************************************

exports.handler = (event, context, callback) => {

    var params = {
            TableName: process.env.DEVELOPERS_TABLE,
    };

    console.log("Scanning ", process.env.DEVELOPERS_TABLE);
    
    dynamodb.scan(params, function(err, data) {
        if (err)
            throw new Error (err);
    

        console.log("Scan succeeded.");

        //Get the total of members found
        number = Object.keys(data.Items).length;

        response = number.toString() + " Hezuo developers found: " ;

        // print all members
        data.Items.forEach(function(developer){
           response = response + developer.username + "; " ;
        });

        console.log('response is ', response);

        callback(null,  response);

    });

};
