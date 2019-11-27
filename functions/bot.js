const validHeader = 'Google-Dynamite';
const github = require('./github');
const freshdesk = require('./freshdesk');
const validate = require('./utils/validation');

// ALERT: Remove this line on lambda
require('dotenv').config();

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

      // missing config
      if (!config) {
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
      this.config = JSON.parse(process.env[spaceId]);
      this.config.spaceId = spaceId;


      switch (body.type) {
        case 'ADDED_TO_SPACE':
          this.addedToSpace();
          break;

        case 'MESSAGE':
          this.handleMessages();
          break;

        case 'REMOVED_FROM_SPACE':
          this.removedFromSpace();
          break;

        default:
          this.replayback({ text: "Invalid request" }, 500);
          break;
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
        label: 'l2',
        description: 'Displays the open L2 tickets'
      },
      {
        label: 'github',
        description: 'Displays the Github PR statuses'
      },
      {
        label: 'room',
        description: 'Displays the room(space) id for config purpose'
      },
      {
        label: 'config',
        description: 'Displays the configs done for this room'
      },
      {
        label: 'help',
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