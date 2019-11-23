// https://chitti-the-bot.netlify.com/.netlify/functions/bot

const validHeader = 'Google-Dynamite';

exports.handler = function(event, context, callback) {
  let { headers, body } = event;
  console.log(body);
  console.log('---')
  console.log(event)

  // internal methods
  let replayback = (status, msg) => {
    callback(null, {
      statusCode: 500,
      body: "Invalid user agent"
    });
  };

  let addedToSpace = () => {
    console.log('Added to the space');
    console.log('x')
    replayback(200, {
      "text": "Your pizza delivery *has arrived*!\nThank you for using _Pizza Bot!_"
    });
  };



  // lets execute
  if (headers['user-agent'] === validHeader) { // via Google chat ?
    switch (body.type) {
      case 'ADDED_TO_SPACE':
        console.log('Added to the space');
        addedToSpace();
        break;

      default:
        replayback(500, "Invalid request");
        break;
    }
    // callback(null, {
    //   statusCode: 200,
    //   body: {
    //     text: 'Thanks for adding me'
    //   }
    // });
  } else {
    replayback(500, "Invalid user agent");
  }
}