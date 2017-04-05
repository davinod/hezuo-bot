const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// *****************
// list-members
//
// Author: davinod
// *****************

exports.handler = (event, context, callback) => {

    var params = {
            TableName: process.env.MEMBERS_TABLE,
    };

    console.log("Scanning ", process.env.MEMBERS_TABLE);
    
    dynamodb.scan(params, function(err, data) {
        if (err)
            throw new Error (err);
    

        console.log("Scan succeeded.");

        //Get the total of members found
        number = Object.keys(data.Items).length;

        response = number.toString() + " Hezuo members found:\n" ;

        // print all members
        data.Items.forEach(function(member){
           response = response + member.username + "; " ;
        });

        console.log('response is ', response);

        callback(null,  response);

    });

};
