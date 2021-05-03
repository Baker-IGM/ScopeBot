const {
  App
} = require('@slack/bolt');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const fs = require('fs');

let rawdata;
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

  fs.readFile('appHome.json', (err, data) => {
    if (err) throw err;
    homeView = JSON.parse(data);

    //  Add keywords
    for (var i = 0; i < rawdata.keywords.length; i++) {
      homeView.blocks.splice(3, 0, {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "- " + rawdata.keywords[i]
        }
      });
    }

    //  Add quotes
    for (var i = 0; i < rawdata.scopebook.length; i++) {
      var quote = rawdata.scopebook[i];

      //  Add user's name to quote
      quote = quote.replace("$", "<@username>");

      homeView.blocks.push({
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "- " + quote
        }
      });
    }
  });
})();

//  Get a random quote for the user
function getQuote(usr) {
  let quote = rawdata.scopebook[Math.floor(Math.random() * rawdata.scopebook.length)];

  //  Add user's name to quote
  quote = quote.replace("$", "<@" + usr + ">");

  return quote;
}

function containsKeyphase(msg) {

}

// Listens to incoming messages that contain "hello"
app.message(async ({
  message,
  say
}) => {
  try {
    fetch
    fs.readFile('data.json', async (err, data) => {
      if (err) throw err;
      rawdata = JSON.parse(data);

      keywordsRegExp = new RegExp(rawdata.keywords.join("|"), 'gim');

      if (message.text.test(keywordsRegExp)) {
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
      }
    });
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
