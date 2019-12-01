const validHeader = 'Google-Dynamite';
const validate = require('./utils/validation');

// Integrations
const github = require('./integrations/github');
const freshdesk = require('./integrations/freshdesk');

// doesn't require on lambda
try {
  require('dotenv').config();
} catch(e) {
  // do nothing
}

// code revamp
const Bot = {
  // globals
  headers: null,
  body: null,
  callback: null,
  config: null,

  // lets execute
  init(headers, body, callback) {
    this.headers = headers;
    this.body = body;
    this.callback = callback;

    let userAgent = headers['User-Agent'] || headers['user-agent']; // camel cased is for lamda lambda
    if (userAgent === validHeader) { // via Google chat ?
      // setting config
      let [, space] = this.body.space.name.split('/');
      let spaceId = `space_${space}`;
      let config = process.env[spaceId];

      let { type } =  body;

      // added to space
      if (type === 'ADDED_TO_SPACE') {
        this.addedToSpace();
      }

      // check type config before other types
      else if (!config) {
        this.replayback({
          text: `Missing configurations for this room,`,
          "cards": [
            {
              "sections": [
                {
                  "widgets": [
                    this.showSpacename()
                  ]
                }
              ],
            }
          ]
        });
        return true;
      }

      // type message
      else if (type === 'MESSAGE') {
        this.config = JSON.parse(process.env[spaceId]);
        this.config.spaceId = spaceId;
        this.handleMessages();
      }

      else {
        this.replayback({ text: "Invalid request" }, 500);
      }
    } else {
      this.replayback({ text: "Invalid user agent" }, 500);
    }
  },

  // when added newly to a room
  addedToSpace() {
    this.replayback({
      text: `Hey <${this.body.user.name}>, Thanks for adding me into this room. \n Please add the necessary configurations for this room using the following room id,`,
      "cards": [
        {
          "sections": [
            {
              "widgets": [
                this.showSpacename()
              ]
            }
          ],
        }
      ]
    });
  },

  // displays space information for config
  showSpacename(reply = false) {
    let { name, displayName } = this.body.space;
    let [, space] = name.split('/');
    let spaceId = `space_${space}`;
    let spaceName = {
      keyValue: {
        content: `<b>${spaceId}</b>`,
        icon: 'MEMBERSHIP',
        bottomLabel: `${displayName}`
      }
    };

    return (reply) ? this.replayback({
      "cards": [
        {
          "sections": [
            {
              "widgets": [
                spaceName
              ]
            }
          ],
        }
      ]
    }) : spaceName; // reused in added msg
  },

  // handle messages
  handleMessages() {
    let msg = this.body.message.argumentText || null; // when no argument
    if (!msg) {
      this.showHelpCard();
      return true;
    }

    let cmd = (arg) => msg.toLowerCase().includes(arg);
    switch (true) {
      case cmd('help'):
        this.showHelpCard();
        break;

      case cmd('config'):
        this.showConfig();
        break;

      case cmd('room'):
        this.showSpacename(true)
        break;

      case cmd('github'):
        let isValid = validate.cmd(this.config, 'github')
        if (!isValid) {
          this.replayback({ text: '*Github* configurations missing' });
          return true;
        }
        github.checkForOPenPRS(this.config.spaceId, this.callback);
        break;

      case cmd('l2'):
        freshdesk.checkOpenL2Tickets(this.config, this.replayback.bind(this));
        break;

      default:
        this.showHelpCard(`Hi <${this.body.user.name}>, Looks like you could use little help?`);
        break;
    }
  },

  // message actions
  // help card
  showHelpCard(text = `The things I can do now.`) {
    let helps = [
      {
        label: 'L2',
        description: 'Displays the open L2 tickets'
      },
      {
        label: 'Github',
        description: 'Displays the Github PR statuses'
      },
      {
        label: 'Room',
        description: 'Displays the room id for configuration'
      },
      {
        label: 'Config',
        description: 'Displays the configs done for this room'
      },
      {
        label: 'Help',
        description: 'Displays the list of things which bot can do.'
      }
    ];

    let helpMessage = helps.map(help => {
      return {
        header: {
          title: help.label,
          subtitle: help.description
        }
      };
    });

    this.replayback({
      text,
      cards: helpMessage
    });
  },

  // show config
  showConfig() {
    let config = this.config;
    let { displayName: spaceName } = this.body.space;

    this.replayback({
      "cards": [
        {
          header: {
            title: `Configurations done for this space`,
            subtitle: spaceName,
          },
          "sections": [
            {
              "widgets": [
                {
                  keyValue: {
                    topLabel: 'Github repo`s',
                    content: config.git_repos.join(','),
                    contentMultiline: true
                  }
                },
                {
                  keyValue: {
                    topLabel: 'Github owner',
                    content: config.git_owner,
                    contentMultiline: true
                  }
                },
                {
                  keyValue: {
                    topLabel: 'Github labels',
                    content: config.git_labels,
                    contentMultiline: true
                  }
                },
                {
                  keyValue: {
                    topLabel: 'Github cron (every 6 hrs)',
                    content: 'off',
                    contentMultiline: false
                  }
                }
              ]
            }
          ],
        }
      ]
    })
  },

  // when remove from space
  removedFromSpace() {
    this.replayback({
      text: `<users/all> Bye bye! Looking forward to work back with you all guys.`,
    });
  },

  // execute callback
  replayback(msg, statusCode = 200) {
    this.callback(null, {
      statusCode,
      body: JSON.stringify(msg)
    });
  }
}

// endpoint hits here
exports.handler = function (event, context, callback) {
  let { body, headers } = event;

  // for request with invalid body
  let parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch (e) {
    callback(null, { statusCode: 500, body: JSON.stringify({ text: 'Something went wrong' }) });
    return;
  }

  // lets start
  Bot.init(headers, parsedBody, callback);
}