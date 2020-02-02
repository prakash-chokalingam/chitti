const fetch = require("node-fetch").default; // https://github.com/bitinn/node-fetch/issues/450
const moment = require('moment');

class Freshdesk {
  constructor () {
    this.overdueTicketsCount = 0;
  }
  
  async checkOpenL2Tickets (config, callback) {
    let { domain, group, key } = config.freshdesk;

    let buff = new Buffer.from(`${key}:X`).toString('base64');
    let matter = 1

    let openTicketResult = await this.fetchTickets(domain, group, 2, buff)
    let pendingTicketResult = await this.fetchTickets(domain, group, 3, buff)
    let response = { cards: [] }
    let openTicketsCount = openTicketResult.length;
    let pendingTicketsCount = pendingTicketResult.length;

    let total = openTicketsCount + pendingTicketsCount;

    if (!total) {
      response.text = '<users/all> Hurray! great work folks 🎉'
    }

    this.appendTicketsToCard(response, openTicketResult, domain, `L2 Open Tickets (${openTicketsCount})`)
    this.appendTicketsToCard(response, pendingTicketResult, domain, `L2 Pending Tickets (${pendingTicketsCount})`)

    if (this.overdueTicketsCount) {
      response.cards.push({
        sections: [{
          widgets: [{
              textParagraph: {
              text: `<font color=\"#ff0000\">Total overdue tickets: <b>${this.overdueTicketsCount}</b></font>`
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

  // creates card
  appendTicketsToCard(response, result, domain, message) {   
      let sections = [{
        widgets: [
          {
            keyValue: {
              topLabel: '',
              content: `<b>${message}</b>`,
              icon: 'TICKET'
            }
          },
        ]
      }]

    result.forEach(ticket => {
      let { id, subject, due_by } = ticket;
      let url =  `${domain}.freshdesk.com/a/tickets/${id}`;
      subject = (subject.length > 60) ? `${subject.substring(0, 60)}...` : subject;

      let isEscalated = moment().diff(moment(due_by)) > 0;
      isEscalated && this.overdueTicketsCount++;
      
      let isOverdue = (isEscalated) ? '<font color=\"#ff0000\"><b>(overdue)</b></font>': '';
      let dueBy = moment(due_by).fromNow(true);
      let deadLineText = (isEscalated) ? `<b>Overdue by: ${dueBy}</b>` : `<b>Due in: ${dueBy}</b>`

      sections.push({
        widgets: [{
          textParagraph: {
            text: `${isOverdue} <b>#${id}</b> - ${this.cleanupHtml(subject)} <br>${deadLineText}`
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

    response.cards.push({ sections });
  };

  cleanupHtml(content) {
    return content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

module.exports = Freshdesk;