# chitti
The **Internal** google chat bot

# Idea
The chitti bot is an internal bot, built with the motive to automate the day-to-day tasks to improve the productivity across the squads.

# Configuration
The bot is hosted in [aws lambda (staging stack)](https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/chitti-the-bot?tab=configuration)

## space(room) config
when you add the bot in a chat room, it will
display the space(room) id for configuration purpose (or) you can get the space id with the bot command `@botname room`.

<img width="413" alt="Screenshot 2019-11-26 at 1 02 58 AM" src="https://user-images.githubusercontent.com/14071264/69571638-85369e80-0fe8-11ea-8caf-56dc665f82b7.png">

we can use the space id to add the configurations in the aws lambda enviroment.

Each space will have its own configuration.

# [Development](https://github.com/prakash-chokalingam/chitti/tree/netlify-lambda)

To simulate the functions in local environment you can use the branch [netlify-lambda#branch](https://github.com/prakash-chokalingam/chitti/tree/netlify-lambda), which is configured with the [netlify-lambda devtool](https://github.com/netlify/netlify-lambda).

https://github.com/netlify/netlify-lambda

> Note: make sure you not uploading the node_modules with `netlify-lambda` and its dependences to the `aws-lambda`.


