# chitti <img src="https://user-images.githubusercontent.com/14071264/69639773-270ac980-1083-11ea-88a2-61675321cb4a.png" height="50px" width="50px">
The **Internal** google chat bot

[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/prakash-chokalingam/chitti/issues)
[![node version](https://img.shields.io/badge/node-%3E=12-brightgreen.svg?style=flat)](https://github.com/prakash-chokalingam/chitti/issues)
![Test Build](https://github.com/prakash-chokalingam/chitti/workflows/Test%20Build/badge.svg?branch=master)



# Ideas
The chitti bot is an internal bot, built with the motive to automate the day-to-day tasks to improve the productivity across the squads.

# Configuration
This bot is hosted on aws lambda

## space(room) config
when you add the bot in a chat room, it will
display the space(room) id for configuration purpose (or) you can get the space id with the bot command `@botname room`.

<img width="406" alt="Screenshot 2020-01-25 at 12 11 36 PM" src="https://user-images.githubusercontent.com/14071264/73117471-189a3a80-3f6c-11ea-97e5-4b63ad2b8b75.png">

we can use the space id to add the configurations in the aws lambda enviroment.

Each space will have its own configuration.

# Development

### Simulating functions in local with [netlify-lambda](https://github.com/netlify/netlify-lambda)

    npm install && npm start

Should serve the functions locally 🚀

### Uploading code to lambda or other function provider
    npm run build

  > will generate a build.zip, Happily upload the zip file to your provider.

Happy contributing 🎉
