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
};

const putItem = (memberList, callback) => {

	console.log("putting item");

	const d = new Date();
	const currentTime = d.toISOString();

	const dbTable = process.env.ACTIVITY_TABLE;

	let items = [];

	console.log('memberList: ', memberList);

	for (var item of memberList) {
		if (item.username) {
			items.push({
	        PutRequest: {
	          Item: {
	              username: item.username, 
			      updated_at: currentTime,
			      ceuname: activity,
			      teamname: item.teamname,
			      comment: comment
	          }
	        }
	      });
		}
	}

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
	  	callback(null, `Successfully added the activity: ${activity} for ${members.join(',')}`);
	  } 
	});
};

const verifyActivity = (act, callback) => {
	var params = {
	  TableName : process.env.CEU_TABLE,
	  Key: {
	    ceuname: act
	  }
	};

	docClient.get(params, (err, data) => {
	  if (err) {
	  	console.log(err);
	  	callback(err.message, null);
	  }
	  else {
	  	if (data.Item) {
	  		callback(null, data);
	  	} else {
	  		callback(`${act} is not a valid activity`, null);
	  	}
	  }
	});
};

const memberNotExists = (username, memberArray) => {
	for (var i=0; i<memberArray.length; i++) {
		if (username === memberArray[i].username) {
			console.log(`member ${username} exists`);
			return false;
		}
	}
	console.log(`member ${username} does not exist`);
	return true;
};

const getMemberItem = (username, memberItems) => {
	for (var item of memberItems) {
		if (item.username === username) {
			return item;
		}
	}
};

const verifyMembers = (mems, callback) => {

	let memberList = [];

	var params = {
	  TableName : process.env.MEMBERS_TABLE
	};

	docClient.scan(params, (err, data) => {
	   if (err) {
	   	console.log(err);
	   	callback(err, null);
	   } 
	   else {
	   	console.log(data);
	   	console.log(mems);
	   	for (var m of mems) {
	   		if (memberNotExists(m, data.Items)) {
	   			console.log(`user ${m} does not exist`);
	   			callback(`user ${m} does not exist`, null);
	   			return;
	   		}
	   		memberList.push(getMemberItem(m, data.Items));
	   	}
	   	console.log('memberList: ', memberList);
	   	callback(null, memberList);
	   }
	});

};

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
    verifyActivity(activity, (verifyActivityError, data) => {
    	if (verifyActivityError) {
    		callback(verifyActivityError, null);
    	} else {
    		verifyMembers(members, (verifyMembersError, memberList) => {
	    		if (verifyMembersError) {
	    			callback(verifyMembersError, null);
	    		} else {
	    			putItem(memberList, callback);
	    		}
	    	});
    	}
    });

};