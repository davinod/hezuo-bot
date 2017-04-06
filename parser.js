const qs = require('querystring');
const fetch = require('node-fetch');

const log = event => console.log('Event', JSON.stringify(event, null, 2));

var rawCommand, command, response;

const getCommand = text => /^<@[A-X0-9]*>(.+)/.exec(text)[1].trim();

// ************************
// parseListMembers
// Author: Davi
// ************************

const parseListMembers = () => {

    //console.log('2 - command is ', command);

    //Assure that this is the right command
    const words = command.split(' ');
    const action = words[0];
    const resource = words[1];

    if (action !== "list" || resource !== 'members')
        throw new Error ('Bad implementation for command parseListTeams');

    response = {
        command: {
            commandLine: command,
            action: action,
            resource: resource,
            api: 'list-members',
            params: [],
            response: {
                success: "$output",
                error: "error to perform your command. Use list commands to see what I can do for ya.",
            }
        }
    };
};

// ************************
// parseListDevelopers
// Author: Davi
// ************************

const parseListDevelopers = () => {

    //console.log('2 - command is ', command);

    //Assure that this is the right command
    const words = command.split(' ');
    const action = words[0];
    const resource = words[1];

    if (action !== "list" || resource !== 'developers')
        throw new Error ('Bad implementation for command parseListTeams');

    response = {
        command: {
            commandLine: command,
            action: action,
            resource: resource,
            api: 'list-developers',
            params: [],
            response: {
                success: "$output",
                error: "error to perform your command. Use list commands to see what I can do for ya.",
            }
        }
    };
};

const apiProxy = () => {
  const words = command.split(' ');
  const action = words[0];
  const resource = words[1];
  var api = null;

  if (action == "list" && resource == 'teams') {
    api = "list-teams"
  } else if (action == "add" && resource == 'team') {
    api = "add-team"
  } else if (action == "update" && resource == 'member-team') {
    api = "update-member-team"
  } else if (action == "remove" && resource == 'team') {
    api = "remove-team"
  } else if (action == "remove" && resource == 'member') {
    api = "remove-member"
  } else {
    throw new Error ('Bad implementation for command parser - ' + command);
  }

  response = {
      command: {
          commandLine: command,
          action: action,
          resource: resource,
          api: api,
          params: words.slice(2),
          response: {
              success: "$output",
              error: "error to perform your command. Use list commands to see what I can do for ya.",
          }
      }
  };
}

// ********************************************
// Parser
//
// Desc  : Responsible to parse commands
// Author: Davi
//
// ********************************************

module.exports.handler = (event, context, callback) => {
    log(event);

    //console.log('0 - event.slack.event.text is ', event.slack.event.text);

    //Get the slack command issued
    rawCommand = event.slack.event.text;
    command = getCommand(rawCommand).trim();

    //console.log('1 - rawCommand is ', rawCommand);
    //console.log('1 - command is ', command);

    //Check if it is a 2 word command, by looking for a white space after trim()
    if (command.indexOf(' ') > 0){

        //Split the command and isolate the two first words (action and resource)
        const words = command.split(' ');
        const action = words[0].toLowerCase();
        const resource = words[1].toLowerCase();

        //console.log('words is ', words);
        //console.log('action is ', action);
        //console.log('resource is ', resource);

        //Check the action/resource and invoke the specific function
        //For new commands, please add another item to the case below resolving to your command
        //Please dont use synonyms. In order to make things simpler, parser only translate the exact command


        var resolver = null;

        if (action === 'list' && resource === 'members') {
          resolver = parseListMembers;
        } else if (action === 'list' && resource === 'teams') {
          resolver = apiProxy;
        } else if (action === 'add' && resource === 'team') {
          resolver = apiProxy;
        } else if (action === 'update' && resource === 'member-team') {
          resolver = apiProxy;
        } else if (action === 'remove' && resource === 'team') {
          resolver = apiProxy;
        } else if (action === 'remove' && resource === 'member') {
          resolver = apiProxy;
        } else {
            callback (new Error ("I dont understand this command `" + command + "`. Use `list commands` to get all valid command list"));
        }

        Promise.resolve()
                .then(resolver)
                .then(event = Object.assign(event, response))
                .then((event) => callback(null, response))  //Success
                .catch((err) =>  callback(sendResponse(null, err))); //Error
    } else {
        //console.log('1 word command found. But not supported.');
        //Later, we can develop other simple commands with one word
        callback (new Error('command ' + command + ' is not supported. Use list commands to see what I can do for ya.'));
    }
};
