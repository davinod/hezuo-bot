const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

// ********************************************
// list-ceus
//
// Desc  : Return the records of ceu table
// Author: Davi
//
// Usage: @hezuo list ceus
//
// ********************************************

exports.handler = (event, context, callback) => {

    var params = {
            TableName: process.env.CEU_TABLE,
    };

    console.log("Scanning ", process.env.CEU_TABLE);

    dynamodb.scan(params, function(err, data) {
        if (err)
            throw new Error (err);

        console.log("Scan succeeded. data is ", data);

        //Get the total of ceus found
        number = Object.keys(data.Items).length;

        var response = "```";

        response = response.concat("\n").concat("-".repeat(65)).concat("\n");
        response = response.concat("| Name").concat(" ".repeat(24)).concat("| CEU_POINTS").concat(" ".repeat(26)).concat("|\n")
        response = response.concat("-".repeat(65));
        
        // print all members
        data.Items.forEach(function(ceu){
           response = response.concat("\n| ")
                              .concat(ceu.ceuname)
                              .concat(" ".repeat(30 - ceu.ceuname.length))
                              .concat("| ")
                              .concat(ceu.hezuo_points)
                              .concat(" ".repeat(30 - ceu.hezuo_points.length))
                              .concat("|");
        });

        response = response.concat("\n")
                           .concat("-".repeat(65) + "\n")
                           .concat("items found: ".concat(number.toString()))
                           .concat("```");
        

        console.log("response is ", response);

        callback(null,  response);

    });

};
