// utils
const validateConfig = require('./utils/validate-config');
const getArguments = require('./utils/get-arguments');

// Integrations
const Github = require('./integrations/github');
const Freshdesk = require('./integrations/freshdesk');
const Freshrelease = require('./integrations/freshrelease');

// initiates a room conversation
class Room {
  constructor(header, body, callback) {
    // globals
    this.header = header;
    this.body = body;
    this.callback = callback;

    // config
    let [, space] = this.body.space.name.split('/');
    let spaceId = `space_${space}`;
    let config = process.env[spaceId];

    // message type
    let { type } = body;

    // added to space
    if (type === 'ADDED_TO_SPACE') {
      this.addedToSpace();
      return true;
    }

    // check for config
    if (!config) {
      this.missingConfiguration();
      return true; // stops further execution
    }

    // set config
    this.config = JSON.parse(config);

    // conversation
    if (type === 'MESSAGE') {
      this.handleMessages();
    }
  }

  handleMessages() {
    let msg = this.body.message.argumentText || null; // when no argument | empty mentions
    if (!msg) {
      this.showHelpCard();
      return true;
    }

    let args = getArguments(msg);

    let [, cmd] = msg.split(' ');
    let hasValidConfig;

    switch (cmd.toLowerCase()) {
      case 'help':
        this.showHelpCard();
        break;

      case 'config':
        this.showConfig();
        break;

      case 'room':
        this.showSpacename(true);
        break;

      case 'github':
        hasValidConfig = validateConfig(this.config, 'github');
        if (!hasValidConfig) {
          this.missingConfiguration('*Github* configurations missing for this room');
          return true;
        }
        new Github().checkForOPenPRS(this.config, this.replayback.bind(this));
        break;

      case 'l2':
        hasValidConfig = validateConfig(this.config, 'freshdesk');
         if (!hasValidConfig) {
          this.missingConfiguration('*Freshdesk* configurations missing for this room');
          return true;
        }
        new Freshdesk().checkOpenL2Tickets(this.config, this.replayback.bind(this));
        break;

      case 'sprint':
        hasValidConfig = validateConfig(this.config, 'freshrelease');
        if (!hasValidConfig) {
           this.missingConfiguration('*Freshrelease* configurations missing for this room');
          return true;
        }
        new Freshrelease().getSprintData(this.config, this.replayback.bind(this), args);
        break;

      default:
        this.showHelpCard(`Hi <${this.body.user.name}>, Looks like you could use little help?`);
        break;
    }
  }


  showConfig() {
    let { github } = this.config;
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
                    content: github.repos.join(','),
                    contentMultiline: true
                  }
                },
                {
                  keyValue: {
                    topLabel: 'Github owner',
                    content: github.owner,
                    contentMultiline: true
                  }
                },
                {
                  keyValue: {
                    topLabel: 'Github labels',
                    content: github.labels,
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
    });
  }


  showHelpCard(text = `The things I can do now.`) {
    let helps = [
      {
        label: 'L2',
        description: 'Displays the open L2 tickets'
      },
      {
        label: 'Sprint or Sprint "squad-name" ',
        description: 'Displays the current sprint status'
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
  }

  // space name
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
  }

  // missing config
  missingConfiguration(text = null) {
    this.replayback({
      text: text || `Missing configurations for this room,`,
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
  }

  // added to space(group)
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
  }

  // execute callback
  replayback(msg, statusCode = 200) {
    this.callback(null, {
      statusCode,
      body: JSON.stringify(msg)
    });
  }
}

module.exports = Room;