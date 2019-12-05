const Validation = require('../../functions/utils/validate-config');

it('Validates Github', () => {
  let config = {};
  // When required config is not passed
  let result  = Validation.cmd(config, 'github');
  expect(result).toBeFalsy();

  // When required config is  passed
  config = {'git_owner': 'abc', 'git_token': 'mno', 'git_repos': 'xx'};
  result  = Validation.cmd(config, 'github');
  expect(result).toBeTruthy();
});