const fetch = require("node-fetch").default; // https://github.com/bitinn/node-fetch/issues/450
const Github = {
  async checkForOPenPRS(spaceId, callback) {
    let config = JSON.parse(process.env[spaceId]);
    let response = { cards: [] }

    async function getAllRepoInfo(array, callback) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index])
      }
    }


    await getAllRepoInfo(config.git_repos, async (repo) => {
      let url = `https://api.github.com/repos/${config.git_owner}/${repo}/issues?state=open&labels=${config.git_labels}`;


      // fetch issues
      let issues = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.git_token}`
        }
      }).then(res => res.json());

      //  pulls (hitting PR url's to get pending reviewers)
      let pullUrls = issues.map(issue => issue.pull_request.url);


      // repo info
      response.cards.push({
        sections: [{
          widgets: [
            {
              keyValue: {
                topLabel: 'Repo',
                content: `${repo} (${pullUrls.length})`,
                icon: 'BOOKMARK'
              }
            }
          ]
        }]
      });

      // fetch Pulls
      let pulls = await Promise.all(pullUrls.map(async (pull) => { // find PR's
        return await fetch(pull, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.git_token}`
          },
        }).then(res => res.json());
      }));

      pulls.forEach(async (pull) => {
        let { number, html_url: url, title, user: { login: creator, avatar_url: avatar }, requested_reviewers: requestReviewers } = pull;
        let reviewers = requestReviewers.map(reviewer => reviewer.login);
        let prCard = {
          header: {
            title: `#${number} - ${creator}`,
            imageUrl: avatar
          },
          sections: [
            {
              widgets: [
                {
                  textParagraph: {
                    text: `<font color=\"#808080\">${title}</font>`
                  }
                },
                {
                  keyValue: {
                    topLabel: 'Pending reviewers',
                    content: reviewers.length ? reviewers.join(',') : '--',
                    contentMultiline: true,
                    icon: 'MULTIPLE_PEOPLE'
                  }
                },
                {
                  buttons: [
                    {
                      textButton: {
                        text: `REVIEW PR #${number}`,
                        onClick: {
                          openLink: {
                            url
                          }
                        }
                      }
                    }
                  ]
                }
              ]
            }
          ]
        };
        response.cards.push(prCard);
      });
    });

    // callback
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(response)
    })
  }
}

module.exports = Github;