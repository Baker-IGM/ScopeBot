const {
  App
} = require('@slack/bolt');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const {
  promisify
} = require("util");
const fs = require("fs");
const readFile = promisify(fs.readFile);

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

//  Check if any of the key word phrases are in the message
async function checkKeywords(message, keywords) {
  try {
    const keywordsRegExp = new RegExp(keywords.join("|"), 'gim');

    return await keywordsRegExp.test(message);
  } catch (e) {
    console.log(e);
  }
}

//  Load JSON data from a file
async function loadData(file) {
  try {
    const data = await readFile(file);

    return await JSON.parse(data);
  } catch (e) {
    console.log(e);
  }
}

// Listens to incoming messages that contain "hello"
app.message(async ({
  message,
  client,
  say
}) => {
  try {
    const userData = await client.users.info({
      user: message.user
    });

    console.log(userData);
    if (!userData.is_bot) {
      const data = await loadData('data.json');

      const result = await checkKeywords(message.text, data.keywords);

      if (!isUser && result) {
        // say() sends a message to the channel where the event was triggered
        await say({
          "blocks": [{
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": getQuote(message.user, data.scopebook)
            }
          }]
        });
      }
    }
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
    const data = await loadData('data.json');

    let homeView = await loadData('appHome.json');

    //  Add keywords
    for (let i = 0; i < data.keywords.length; i++) {
      homeView.blocks.splice(3, 0, {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "- " + data.keywords[i]
        }
      });
    }

    //  Add quotes
    for (let i = 0; i < data.scopebook.length; i++) {
      let quote = data.scopebook[i];

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
