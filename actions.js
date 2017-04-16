const qs = require('querystring');
const fetch = require('node-fetch');
const parserFunctionName = `${process.env.NAMESPACE}-parser`;
var AWS = require('aws-sdk');
var lambda = new AWS.Lambda();
var slackRequest ;

const log = event => console.log('Event', JSON.stringify(event, null, 2));

// *************************************************************** //
//  Function to invoke the parser to evaluate the command received //
// *************************************************************** //
const invokeParser = (event, err) => {
    if (!event) return null;

    console.log('============ invokeParser start ==============');
    console.log(`Parsing ${parserFunctionName} with request `, event);

    const lambdaParams = {
        FunctionName: parserFunctionName,
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(event),
    };

    //Return a promise of the parser lambda invoked
    return lambda.invoke(lambdaParams, function(error, data) {

        console.log('parser invoked.');
        console.log('data is ', data);
        console.log('error is ', error);

        if (error){
            console.log('lambda actions detected problem in the parser.');
            throw new Error(error);
        }

    }).promise();
};

// ************************************************************** //
//  Function to invoke the dynamic lambda returned by the parser  //
// ************************************************************** //
const invokeAction = (event) => {
    console.log('============  invokeAction start ==============');
    //console.log('event is ', event);
    //console.log('payload is ', event.Payload);
    //console.log('errorMessage is ', JSON.parse(event.Payload).errorMessage);

    if (!event) return null;

    //It may happen that the parser had an exception because the command was not parsed, this is to
    //ensure the command is not invoked. Somehow, the catch in the main function is not being triggered
    //Just keep this if for now
    if (JSON.parse(event.Payload).errorMessage) throw new Error (JSON.parse(event.Payload).errorMessage);

    var command = JSON.parse(event.Payload).command;
    console.log('Invoking Api ',  `${process.env.NAMESPACE}-` + command.api  + 'with payload ', event);

    //Return a promise of the lambda command invoked
    return lambda.invoke({
        FunctionName: `${process.env.NAMESPACE}-` + command.api,
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(command),
    }).promise();
};

// ********************************************************************************** //
//  Function to send a HTTP post to Slack in order to give an answer for the command  //
// ********************************************************************************** //
const sendResponse = (event, err) => {

    console.log('============ sendResponse ==============');
    //console.log('event is ', event);
    //console.log('err is ', err);
    var command = slackRequest.slack.event.text;

    const params = {
        mrkdwn: true,
        token: slackRequest.team.bot.bot_access_token,
        channel: slackRequest.slack.event.channel,
        text: err ? err.message : "Hey <@" + slackRequest.slack.event.user + ">, Your response to command `" + command + "`:\n" + JSON.parse(event.Payload) + "\n"
        // text: err ? err.message : `Hey <@" + slackRequest.slack.event.user + ">, Your response to command ${command}: ${JSON.parse(event.Payload).errorMessage}`
    };

    console.log('message is ', params.text, typeof(params.text));

    const url = `https://slack.com/api/chat.postMessage?${qs.stringify(params)}`;
    console.log(`Requesting ${url}`);
    fetch(url)
        .then(response => response.json())
        .then((response) => {
            if (!response.ok) throw new Error('SlackAPIError');
            return Object.assign(event, { response });
        });

    //Return the message itself to be output by this actions lambda
    return params.text;
}

// ******************************* //
//  Lambda handler - Entry Point   //
// ******************************* //
module.exports.handler = (event, context, callback) => {

    log(event);

    // Save the original slack request to be used for sendResponse
    // thus we can use the event itself to work with invokeParser and invokeAction
    // More experienced JS scripts developers will find better ways to control the request/response payloads

    slackRequest = event;

    Promise.resolve(event)
        .then(invokeParser)
        .then(invokeAction)
        .then(sendResponse)
        .then((event) => callback(null, event))  //Success
        .catch((err) =>  callback(sendResponse(null, err))); //Error

};
