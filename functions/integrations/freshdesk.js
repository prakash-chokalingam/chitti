const fetch = require("node-fetch").default; // https://github.com/bitinn/node-fetch/issues/450

const Freshdesk = {
  async checkOpenL2Tickets (config, callback) {
    let { freshdesk: { domain, group, key } } = config;
    let buff = new Buffer.from(`${key}:X`).toString('base64');
    let url = `https://${domain}.freshdesk.com/api/v2/search/tickets?query="group_id:${group} AND status:2"`;
    let tickets = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${buff}`
        }
      }).then(res => res.json());

    let results = tickets.results || [];
    let response = { cards: [] }
    let total = results.length;

    if (!total) {
      response.text = '<users/all> Hurray! great work folks 🎉'
    }

    // tickets info
    response.cards.push({
      sections: [{
        widgets: [
          {
            keyValue: {
              topLabel: '',
              content: `L2 tickets (${total})`,
              icon: 'TICKET'
            }
          },
        ]
      }]
    });


    results.forEach(ticket => {
      let { id, subject, is_escalated } = ticket;
      let url =  `${domain}.freshdesk.com/a/tickets/${id}`;
      subject = (subject.length > 60) ? `${subject.substring(0, 60)}...` : subject;
      let isOverdue = (is_escalated) ? '<font color=\"#ff0000\"><b>(overdue)</b></font>': '';

      response.cards[0].sections.push({
        widgets: [{
          textParagraph: {
            text: `${isOverdue} <b>#${id}</b> - ${subject}`
          },
          buttons: [
            {
              textButton: {
                text: `OPEN TICKET`,
                onClick: {
                  openLink: {
                    url
                  }
                }
              }
            }
          ]
        }]
      })
    });


    // consolidated
    let overdued = results.filter(ticket => ticket.is_escalated).length;
    if (overdued) {
      response.cards[0].sections.push({
        widgets: [{
            textParagraph: {
            text: `<font color=\"#ff0000\">Total overdue tickets: <b>${overdued}</b></font>`
          }
        }]
      });
    }

    callback(response)
  }
};

module.exports = Freshdesk;