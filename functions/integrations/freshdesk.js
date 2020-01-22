const fetch = require("node-fetch").default; // https://github.com/bitinn/node-fetch/issues/450
const moment = require('moment');

class Freshdesk {
  async checkOpenL2Tickets (config, callback) {
    let { domain, group, key } = config.freshdesk;

    let buff = new Buffer.from(`${key}:X`).toString('base64');

    let openTicketResult = await this.fetchTickets(domain, group, 2, buff)
    let pendingTicketResult = await this.fetchTickets(domain, group, 3, buff)
    let response = { cards: [] }
    let total = openTicketResult.length + pendingTicketResult.length;

    if (!total) {
      response.text = '<users/all> Hurray! great work folks 🎉'
    }

    this.appendTicketsToCard(response, openTicketResult, domain, `L2 Open Tickets (${openTicketResult.length})`)
    this.appendTicketsToCard(response, pendingTicketResult, domain, `L2 Pending Tickets (${pendingTicketResult.length})`)

    let results = openTicketResult.concat(pendingTicketResult);
    // consolidated
    let overdued = results.filter(ticket => ticket.is_escalated).length;
    if (overdued) {
      response.cards.push({
        sections: [{
          widgets: [{
              textParagraph: {
              text: `<font color=\"#ff0000\">Total overdue tickets: <b>${overdued}</b></font>`
            }
          }]
        }]
      });
    }

    callback(response)

  }

  async fetchTickets(domain, group, status, buff) {
    let url = `https://${domain}.freshdesk.com/api/v2/search/tickets?query="group_id:${group} AND status:${status}"`;
    let tickets = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${buff}`
      }
    }).then(res => res.json());
    let ticketResults = tickets.results || [];
    return ticketResults;
  };

  appendTicketsToCard(response, result, domain, message) {
    
    // create card
    response.cards.push({
      sections: [{
        widgets: [
          {
            keyValue: {
              topLabel: '',
              content: message,
              icon: 'TICKET'
            }
          },
        ]
      }]
    });

    let index = response.cards.length - 1;

    result.forEach(ticket => {
      let { id, subject, due_by } = ticket;
      let url =  `${domain}.freshdesk.com/a/tickets/${id}`;
      subject = (subject.length > 60) ? `${subject.substring(0, 60)}...` : subject;

      let isEscalated = moment().diff(moment(due_by)) > 0
      let isOverdue = (isEscalated) ? '<font color=\"#ff0000\"><b>(overdue)</b></font>': '';
      let dueBy = moment(due_by).fromNow(true);
      let deadLineText = (moment().diff(moment(due_by)) > 0) ? `<b>Overdue by: ${dueBy}</b>` : `<b>Due in: ${dueBy}</b>`

      response.cards[index].sections.push({
        widgets: [{
          textParagraph: {
            text: `${isOverdue} <b>#${id}</b> - ${subject} \n${deadLineText}`
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
  };
}

module.exports = Freshdesk;