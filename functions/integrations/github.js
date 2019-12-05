const fetch = require("node-fetch").default; // https://github.com/bitinn/node-fetch/issues/450

class Github {
  async checkForOPenPRS(config, callback) {
    let { owner, repos, labels, token } =  config.github;

    let response = { cards: [] }

    async function getAllRepoInfo(array, callback) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index])
      }
    }


    await getAllRepoInfo(repos, async (repo) => {
      let url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&labels=${labels.join(',')}`;


      // fetch issues
      let issues = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }).then(res => res.json());

      //  pulls (hitting PR url's to get pending reviewers)
      let pullUrls = issues.map(issue => issue.pull_request.url);

      // repo info
      let sections = [];
      sections.push({
        widgets: [
          {
            keyValue: {
              topLabel: 'Repo',
              content: `${repo} (${pullUrls.length})`,
              iconUrl: 'https://user-images.githubusercontent.com/14071264/69827313-d17a1c80-123c-11ea-826c-624df01d4794.png'
            }
          }
        ]
      });

      // fetch Pulls
      let pulls = await Promise.all(pullUrls.map(async (pull) => { // find PR's
        return await fetch(pull, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        }).then(res => res.json());
      }));

      pulls.forEach(async (pull) => {
        let { number, html_url: url, title, user: { login: creator, avatar_url: avatar }, requested_reviewers: requestReviewers, review_comments: comments } = pull;

        let reviewers = requestReviewers.map(reviewer => reviewer.login);
        title = (title.length > 60) ? `${title.substr(0, 60)}...` : title;

        let msg = `Status: <font color=\"#2cbe4e\">✓ All caught up</font>`;
        if (reviewers.length) {
          msg = `<font color=\"#808080\">pending reviewers: ${reviewers.join(',')}</font>`;
        } else if (comments) {
          msg = `<font color=\"#dbab08\">Has review comments</font>`
        }


        sections.push({
          widgets: [
            {
              textParagraph: {
                text: `<b>#${number}</b> - ${title}`
              }
            },
            {
              textParagraph: {
                text: `<font color=\"#808080\">owner: ${creator}</font>`
              }
            },
            {
              textParagraph: {
                text: msg
              }
            },
            {
              buttons: [
                {
                  imageButton: {
                    iconUrl: avatar,
                    onClick: {
                      openLink: {
                        url
                      }
                    }
                  }
                },
                {
                  textButton: {
                    text: `OPEN PULL REQUEST`,
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
        });
      });

      response.cards.push({ sections });
    });

    // callback
    callback(response)
  }
}

module.exports = Github;