// https://chitti-the-bot.netlify.com/.netlify/functions/bot

exports.handler = function(event, context, callback) {
  console.log('#################')
  console.log(event)
  console.log(context)
  console.log('#################')
  callback(null, {
    statusCode: 200,
    body: "Hello, World"
  });
}