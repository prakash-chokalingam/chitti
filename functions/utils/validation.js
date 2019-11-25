const Validate = {
  cmd(config, cmd) {
    let keys = Object.keys(config);
    let requiredKeys = [];

    switch (cmd) {
      case 'github':
        requiredKeys = ['git_owner', 'git_token', 'git_repos'];
        break;

      default:
        break;
    }

    return requiredKeys.every(key => keys.includes(key));
  }
};

module.exports = Validate;