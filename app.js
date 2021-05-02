const {
  App
} = require('@slack/bolt');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const fs = require('fs');

let rawdata;

let keywords;

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

    keywords = new RegExp(rawdata.keywords.join("|"), 'gim');
    console.log(keywords);
  });
})();

//  Get a random quote for the user
function getQuote(usr) {
  let quote = rawdata.scopebook[Math.floor(Math.random() * rawdata.scopebook.length)];

  //  Add user's name to quote
  quote = quote.replace("$", "<@" + usr + ">");

  return quote;
}

// Listens to incoming messages that contain "hello"
app.message(keywords, async ({
  message,
  say
}) => {
  // say() sends a message to the channel where the event was triggered
  await say({
    "blocks": [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": getQuote(message.user)
      }
    }]
  });
});


// subscribe to 'app_mention' event in your App config
// need app_mentions:read and chat:write scopes
app.event('app_mention', async ({
  event,
  context,
  client,
  say
}) => {
  try {
    await say({
      "blocks": [{
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": getQuote(event.user)
        }
      }]
    });
  } catch (error) {
    console.error(error);
  }
});
