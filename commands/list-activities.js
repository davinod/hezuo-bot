'use strict'; // eslint-disable-line strict

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

const USERNAME_FIELD = 'username';
const ACTIVITY_FIELD = 'ceu_name';
const MODIFIED_FIELD = 'updated_at';
const TEAMNAME_FIELD = 'teamname';
const MONTHS = {
  january: '01',
  feburary: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
};

function onScan(err, data, teamName) {
  return Promise.resolve().then(() => {
    const response = { results: [], error: null };
    if (err) {
      console.log('Unable to query the table. Error JSON:', err.errorMessage);
      response.error = ('Unable to query the table. ', err.errorMessage);
    } else {
      data.Items.forEach((activity) => {
        if (activity[TEAMNAME_FIELD] === teamName) {
          response.results.push(activity);
        }
      });
      if (typeof data.LastEvaluatedKey !== 'undefined') {
        const params = {};
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        return docClient.scan(params, (err, data) => // eslint-disable-line no-shadow
          onScan(err, data, response)).promise();
      }
    }
    return response;
  });
}

function scanTeamActivities(params, teamName) {
  return new Promise((resolve) =>
    docClient.scan(params, (err, data) =>
      resolve(onScan(err, data, teamName))));
}

function formatError(error) {
  console.log(`Error occurred while scanning database - ${error}`);
  return 'Error occurred while scanning database';
}

function formatResponse(res) {
  const response = res.results;
  let padding = '';
  let msg = '```';
  /* eslint-disable prefer-template */
  if (response.length > 0) {
    msg += '\nTeam Name: ' + response[0][TEAMNAME_FIELD] + '\n';
    msg += '\nTeam Activities:\n';
    msg += '-'.repeat(93) + '\n';
    msg += '| Activity  ' + ' '.repeat(39) + ' | ';
    msg += 'Name' + ' '.repeat(4) + ' | ';
    msg += 'Date Added' + ' '.repeat(14) + ' |\n';
    msg += '-'.repeat(92) + '\n';

    response.forEach((activity) => {
      padding = 50 - activity[ACTIVITY_FIELD].length; // ceu_name
      msg += '| ' + activity[ACTIVITY_FIELD] + ' '.repeat(padding);
      padding = 9 - activity[USERNAME_FIELD].length; // team_name
      msg += '| ' + activity[USERNAME_FIELD] + ' '.repeat(padding);
      padding = 30 - activity[MODIFIED_FIELD].length; // updated_at
      msg += '| ' + activity[MODIFIED_FIELD] + ' |\n';
    });
    msg += '-'.repeat(93) + '\n```';
    /* eslint-enable prefer-template */
  } else {
    msg = 'No data for this team during the month specified!';
  }
  return msg;
}

exports.handler = (event, context, callback) => {
  const teamName = event.params.teamName;
  const month = event.params.month || new Date()
    .toLocaleString('en-us', { month: 'long' })
    .toLowerCase();

  const params = {
    TableName: process.env.ACTIVITY_TABLE,
    // eslint-disable-next-line max-len
    ProjectionExpression: `${USERNAME_FIELD}, ${TEAMNAME_FIELD}, ${ACTIVITY_FIELD}, ${MODIFIED_FIELD}`,
    FilterExpression: `${MODIFIED_FIELD} between :som and :eom`,
    ExpressionAttributeValues: {
      ':som' : `2017-${MONTHS[month]}-01`,
      ':eom' : `2017-${MONTHS[month]}-31`,
    },
  };

  scanTeamActivities(params, teamName)
    .then((response) => formatResponse(response), formatError)
    .then((msg) => callback(null, msg))
    .catch(error => callback(error, null));
};
