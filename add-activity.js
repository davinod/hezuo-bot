function function2() {
    // all the stuff you want to happen after that pause
    console.log('Blah blah blah blah extra-blah');
}

exports.handler = (event, context, callback) => {
    // TODO implement
    setTimeout(function2, 500);
    console.log('event is ', event);
    var response = event.response.success;
    event = Object.assign(event, response);
    console.log('response is ', response);
    callback(null, response);
};