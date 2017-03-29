const qs = require('querystring');
const fetch = require('node-fetch');

const log = (event) => {
    console.log('Event', JSON.stringify(event, null, 2));
    return Promise.resolve(event);
};

module.exports.handler = (event, context, callback) => {
    log(event);
    
    //const tags = command.match(/\[(.*?)\]/);
    //const words = command.split(' ');
    //const action = words[0];
    //const resource = words[1];


    const response = {
        command: {
            commandLine: "add activity <activity name> to tony;davidiog ",
            action: "add",
            resource: "activity",
            api: "add-activity",
            params: {
                activityName: "activity name",
                username: ["tony","davidiog"]
            },
            response: {
                success: "Activity added",
                error: "error on add-activity",
            }
        }
    };

    event = Object.assign(event, response);

    callback(null, event);
};
