"use strict";
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region: 'ap-southeast-2'});
let response;
let activity;
let comment = 'NA';
let members;

const hasError = function(evt) {
	console.log(evt.params);
	if (evt.params === []) {
		response = "Parameters are required for this command";
	    return true;	
	}
	if (evt.params.activity === '') {
		response = "A valid activity is required";
	    return true;	
	}
	return false;
}

const putItem = (callback) => {

	console.log("putting item");

	const d = new Date();
	const currentTime = `${d.getFullYear()}${d.getMonth()+1}${d.getDate()}_${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}UTC`;

	const dbTable = process.env.ACTIVITY_TABLE;

	let items = [];

	members.forEach((member) => {
		items.push({
	        PutRequest: {
	          Item: {
	              username: member, 
			      updated_at: currentTime,
			      ceu_name: activity,
			      team_name: "a",
			      comment: comment
	          }
	        }
	      });
	});

	let requestItems = {};
	requestItems[dbTable] = items;

	var params = {
	  RequestItems: requestItems
	};

	docClient.batchWrite(params, (err, data) => {
	  if (err) {
	  	console.log(err);
	  	callback(err, null);
	  }
	  else {
	  	console.log(data);
	  	callback(null, `Successfully added the activity: ${activity}`);
	  } 
	});
}

const verifyActivity = (act) => {
	return new Promise((resolve, reject) => {
		var params = {
		  TableName : process.env.CEU_TABLE,
		  Key: {
		    ceu_name: act
		  }
		};

		docClient.get(params, (err, data) => {
		  if (err) {
		  	console.log(err);
		  	reject(err);
		  }
		  else {
		  	if (data.Item) {
		      resolve(data);	
		  	} else {
		  	  reject(`${act} is not a valid activity`);
		  	}
		  }
		});
	})
}

const memberNotExists = (username, memberArray) => {
	for (var i=0; i<memberArray.length; i++) {
		if (username === memberArray[i].username) {
			console.log(`member ${username} exists`);
			return false;
		}
	}
	console.log(`member ${username} does not exist`);
	return true;
}

const verifyMembers = (mems) => {
	return new Promise((resolve, reject) => {

		var params = {
		  TableName : process.env.MEMBERS_TABLE
		};

		docClient.scan(params, (err, data) => {
		   if (err) {
		   	console.log(err);
		   	reject(err);
		   } 
		   else {
		   	console.log(data);
		   	console.log(mems);
		   	for (var m=0; m<mems.length; m++) {
		   		if (memberNotExists(mems[m], data.Items)) {
		   			console.log(`user ${mems[m]} does not exist`);
		   			reject(`user ${mems[m]} does not exist`);
		   		}
		   	}
		   }
		});

	})
}

const handleError = (err) => {
	console.log('error from handleError');
	return Promise.reject(err);
};

exports.handler = (event, context, callback) => {
    if (hasError(event)) {
    	callback(response, null);
    }
    activity = event.params.activity;
    comment = event.params.comment || 'NA';
    members = event.params.members;
    Promise.all([verifyActivity(activity), verifyMembers(members)])
      .then(
    	putItem(callback)
      )
      .catch((err) => {callback(err, null)})
};