module.exports = function (config, cmd) {
  let keys = Object.keys(config);
  let requiredKeys = [];

  switch (cmd) {
    // TODO: have to validate the required child keys inside the integration
    case 'github':
      requiredKeys = ['github'];
      break;

    case 'freshdesk':
      requiredKeys = ['freshdesk'];
      break;

    case 'freshrelease':
      requiredKeys = ['freshrelease'];
      break;
  }

  return requiredKeys.every(key => keys.includes(key));
};