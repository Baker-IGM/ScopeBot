const {
  App
} = require('@slack/bolt');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const fs = require('fs');

let rawdata;

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.BOT_TOKEN,
  socketMode: true,
  appToken: process.env.APP_TOKEN,
});

//  Start app
(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');

  fs.readFile('data.json', (err, data) => {
    if (err) throw err;
    rawdata = JSON.parse(data);
    console.log(JSON.stringify(rawdata));
  });
})();

function getQuote(usr)
{
  let quote = rawdata.scopebook[Math.floor(Math.random() * rawdata.scopebook.length)];
  console.log(quote);
  //  Add user's name to quote
  quote = quote.replace("$", "<@" + usr + ">");

  return quote;
}


// subscribe to 'app_mention' event in your App config
// need app_mentions:read and chat:write scopes
app.event('app_mention', async ({ event, context, client, say }) => {
  try {
    await say({"blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": getQuote(event.user)
        }
      }
    ]});
  }
  catch (error) {
    console.error(error);
  }
});
