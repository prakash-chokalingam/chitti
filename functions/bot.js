const validHeader = 'Google-Dynamite';

const Room = require('./room');
const DM = require('./dm');

// doesn't require on lambda
try {
  require('dotenv').config();
} catch(e) {
  // do nothing
}

// endpoint hits here
exports.handler = function (event, context, callback) {
  let throwError = () => callback(null, { statusCode: 500, body: JSON.stringify({ text: 'Something went wrong' }) });
  let { body, headers } = event;

  // validate client
  let userAgent = headers['User-Agent'] || headers['user-agent']; // camel cased is for aws lambda
  if (userAgent !== validHeader) { // via Google chat ?
    return throwError();
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(body);
    let { type } = parsedBody.space;

    if (type === 'ROOM') { // group conversation
      new Room(headers, parsedBody, callback);
    } else if (type === 'DM') { // direct chat with bot
      new DM(headers, parsedBody, callback);
    } else {
      throw new Error();
    }
  } catch (e) { // for request with invalid body
    console.log(e);
    throwError();
    return;
  }
};