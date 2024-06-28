# TypeScript Temporary Channels Discord Bot

This bot creates a temporary channel for users upon joining a designated channel. The bot will create a new channel and move them to it automatically, the user can modify their channel name, user limit, and toggle between locking and unlocking the channel using the bot's panel that is created once the setup command has been ran.

## How to use it?

### Prerequisite

Install the required dependencies by running:
```sh
npm install
```
Create an .env file in the root directory and add the neccesary information to it:
```sh
DISCORD_TOKEN="YOUR_BOT_TOKEN"
DATABASE_URL="YOUR_MONGODB_CONNECTION_STRING"
```

### Development

You can run the bot with `tsc-watch` to watch the files and automatically restart your bot.

```sh
npm run watch:start
```

## License

Built using sapphire framework.
Dedicated to the public domain via the [Unlicense], courtesy of the Sapphire Community and its contributors.

[sapphire]: https://github.com/sapphiredev/framework
[unlicense]: https://github.com/sapphiredev/examples/blob/main/LICENSE.md
