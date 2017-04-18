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

        console.log("tot number is ", number);

        var response = "```";

        response = response.concat("\n").concat("-".repeat(62)).concat("\n");
        response = response.concat("| Name (ceu_points) (hezuo_points)").concat(" ".repeat(27)).concat("|\n");
        response = response.concat("-".repeat(62));
                
        // print all members
        data.Items.forEach(function(ceu){
            
            response = response.concat("\n| ")
                               .concat(ceu.ceuname)
                               .concat(" ".repeat(50 - ceu.ceuname.length))
                               .concat(" (")
                               .concat(ceu.ceu_points)
                               .concat(") (")
                               .concat(ceu.hezuo_points)
                               .concat(") |");
        });

        response = response.concat("\n")
                           .concat("-".repeat(62) + "\n")
                           .concat("items found: ".concat(number.toString()))
                           .concat("```");
        

        console.log("response is ", response);

        callback(null,  response);

    });

};
