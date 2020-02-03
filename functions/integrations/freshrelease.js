/* eslint-disable no-useless-escape */
const fetch = require("node-fetch").default;
const moment = require('moment');

class Freshrelease {
  async getSprintData(config, callback, args = null) {
    let { squads } = config.freshrelease;
    if (args.length) {
      squads = args;  // specified squad
    }

    // fetch squads
    let allSquads = await this.fetch('sub_projects', config.freshrelease);
    let requiredSquads = allSquads.sub_projects.filter(squad => squads.includes(squad.name));

    let fetchActiveSprints = requiredSquads.map(async (squad) => {
      return await this.fetch(`sprints?primary_workspace_id=${squad.id}&state=2`, config.freshrelease).then(async (result) => {
        let sprint = result.sprints[0];
        return await this.fetch(`sprints/${sprint.id}`, config.freshrelease).then(res => res.sprint);
      });
    });

    let activeSprints = await Promise.all(fetchActiveSprints);
    let response = { cards: [] };
    let { domain, key } = config.freshrelease;

    // construct card
    activeSprints.forEach(sprint => {
      let squad = requiredSquads.find(squad => squad.id === sprint.primary_workspace_id);
      let { count_by_status_category: items, story_points_count_by_status: points } = sprint.meta;
      let boardUrl = `https://${domain}.freshrelease.com/${key}/sprints/${sprint.id}`;

      // unplanned items
      let totalItems = items.in_progress + items.todo + items.done;
      let totalPoints = points.in_progress + points.todo + points.done;
      let hasAdoc, addocItems, addocPoints;
      if (totalItems > sprint.planned_work_items) {
        addocItems = totalItems - sprint.planned_work_items;
        addocPoints = totalPoints - sprint.planned_story_points;
        hasAdoc = `Unplanned: <b>${addocItems} items</b>  <font color=\"#808080\">|</font> <b>${addocPoints} points</b>`;
      }

      let sections = [];
      sections.push(
        {
          widgets: [
            {
              keyValue: {
                content: squad.name,
                icon: 'MULTIPLE_PEOPLE'
              }
            }
          ]
        },
        {
          widgets: [
            {
              textParagraph: {
                "text": sprint.name
              }
            },
            {
              textParagraph: {
                text: `Ends on: <b>${moment(sprint.planned_end_date).utcOffset("+05:30").format('Do MMM YYYY')} (${moment(sprint.planned_end_date).utcOffset("+05:30").fromNow()}) </b>`
              }
            }
          ]
        },
        {
          widgets: [
            {
              textParagraph: {
                text: `Planned: <b>${sprint.planned_work_items} items </b> <font color=\"#808080\">|</font> <b>${sprint.planned_story_points} points</b>${hasAdoc ? `<br>${hasAdoc}`: ''} <br><br> Todo:  <b>${items.todo} items</bb> <font color=\"#808080\">|</font> <b>${points.todo} points</b><br> In Progress: <b>${items.in_progress} items</b> <font color=\"#808080\">|</font> <b>${points.in_progress} points</b><br> <font color=\"#2cbe4e\">Done: <b>${items.done} items</b></font> <font color=\"#808080\">|</font> <font color=\"#2cbe4e\"><b>${points.done} points ✓ </b></font>`
              }
            },
          ]
        },
        {
          widgets: [
            {
              textParagraph: {
                text: `Average velocity: <b>${sprint.average_velocity}</b>`
              }
            },
            {
              buttons: [
                {
                  textButton: {
                    text: "GO TO SPRINT BOARD",
                    onClick: {
                      openLink: {
                        url: boardUrl
                      }
                    }
                  }
                }
              ]
            }
          ]
        }
      );
      response.cards.push({ sections });
    });

    // callback
    callback(response);
  }

  async fetch(path, freshrelease) {
    let { domain, token, key } = freshrelease;
    let url = `https://${domain}.freshrelease.com/${key}/${path}`;
    return await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
        'Accept': 'application/json'
      }
    }).then(res => res.json());
  }
}

module.exports = Freshrelease;