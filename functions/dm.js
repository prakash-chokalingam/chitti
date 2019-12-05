class DM {
  header = null;
  body = null;
  callback = null;

  constructor(header, body, callback) {
    this.header = header;
    this.body = body;
    this.callback = callback;

    return this.replayback({
      "cards": [
        {
          "sections": [
            {
              "widgets": [
                {
                  textParagraph: {
                    text: 'Chitti DM blocked 🚫'
                  }
                },
                {
                  "image": {
                    "imageUrl": "https://user-images.githubusercontent.com/14071264/69639369-65ec4f80-1082-11ea-93cb-f9639527760c.png",
                  }
                }
              ]
            }
          ]
        }
      ]
    })
  }

  // execute callback
  replayback(msg, statusCode = 200) {
    this.callback(null, {
      statusCode,
      body: JSON.stringify(msg)
    });
  }
}


module.exports = DM;