// https://chitti-the-bot.netlify.com/.netlify/functions/bot

const validateHeader = 'Google-Dynamite';

exports.handler = function(event, context, callback) {
  let { headers } = event;
  if (headers['user-agent'] === validateHeader) { // via Google chat ?
    callback(null, {
      statusCode: 200,
      body: {
        text: 'Thanks for adding me'
      }
    });
  } else {
    callback(null, {
      statusCode: 500,
      body: "Invalid user agent"
    });
  }
  console.log('#################')
  console.log(event)
  console.log(context)
  console.log('#################')
}