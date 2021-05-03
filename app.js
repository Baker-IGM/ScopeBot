const {
  App
} = require('@slack/bolt');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const fs = require('fs');

let homeView;

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
})();

//  Get a random quote for the user
function getQuote(usr, quoteBook) {
  let quote = quoteBook[Math.floor(Math.random() * quoteBook.length)];

  //  Add user's name to quote
  quote = quote.replace("$", "<@" + usr + ">");

  return quote;
}

async function checkKeywords(message) {
  try {
    fs.readFile('data.json', async (err, data) => {
      if (err) throw err;

      let rawdata = JSON.parse(data);

      keywordsRegExp = new RegExp(rawdata.keywords.join("|"), 'gim');
      console.log(keywordsRegExp);

      if(keywordsRegExp.test(message.text))
      {
        // say() sends a message to the channel where the event was triggered
        await say({
          "blocks": [{
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": getQuote(message.user, rawdata.scopebook)
            }
          }]
        });
      }
    });
  } catch (e) {
    console.log(e);
  }
}

// Listens to incoming messages that contain "hello"
app.message(async ({
  message,
  say
}) => {
  try {
    await checkKeywords(message);
  } catch (error) {
    console.error(error);
  }
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


// Listen for users opening your App Home
app.event('app_home_opened', async ({
  event,
  client
}) => {
  try {
    // Call views.publish with the built-in client
    const result = await client.views.publish({
      // Use the user ID associated with the event
      user_id: event.user,
      view: homeView
    });
  } catch (error) {
    console.error(error);
  }
});
