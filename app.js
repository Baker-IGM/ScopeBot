const {
  App
} = require('@slack/bolt');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const fs = require('fs');

let rawdata;

let keywordsRegExp;

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

    keywordsRegExp = new RegExp(rawdata.keywords.join("|"), 'gim');
  });
})();

//  Get a random quote for the user
function getQuote(usr) {
  let quote = rawdata.scopebook[Math.floor(Math.random() * rawdata.scopebook.length)];

  //  Add user's name to quote
  quote = quote.replace("$", "<@" + usr + ">");

  return quote;
}

function getKeywords() {
  keywords = {};

  for (i in rawdata.keywords) {
    keywords += {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "- " + rawdata.keywords[i]
      }
    }
  }

  return keywords;
}

function getQuotes() {
  quotes = {};

  for (i in rawdata.scopebook) {
    quotes += {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "- " + rawdata.scopebook[i]
      }
    }
  }
  console.log(JSON.stringify(quotes));
  return quotes;
}

// Listens to incoming messages that contain "hello"
app.message(/feature|it would be cool if|idea|let's make|let's add|what if|project|i had a thought|i was thinking|talking about|new/gim, async ({
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
      view: {
        // Home tabs must be enabled in your app configuration page under "App Home"
        "type": "home",
        "blocks": [{
            "type": "header",
            "text": {
              "type": "plain_text",
              "text": "ScopeBot Home",
              "emoji": true
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Keywords:* \nThese are the phases that can trigger an out of scope error."
            }
          },
          getKeywords(),
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Quotes:* \nThese are the out of scope error messasges."
            }
          },
          getQuotes(),
          {
            "type": "divider"
          }
        ]
      }
    });
  } catch (error) {
    console.error(error);
  }
});
