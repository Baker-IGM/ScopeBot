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

const {
  Client
} = require('pg');
const pgClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
pgClient.connect();

// Initializes your app with your bot token and signing secret
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.STATE_SECRET,
  scopes: ['channels:history', 'groups:history', 'app_mentions:read', 'chat:write', 'users:read'],
  installationStore: {
    storeInstallation: async (installation) => {
      console.log("Store: " + JSON.stringify(installation));
      // change the line below so it saves to your database
      if (installation.isEnterpriseInstall) {
        // support for org wide app installation
        return await sendQuery('INSERT INTO installs (id, install) VALUES (' + installation.enterprise.id + ', ' + installation + ')') //pgClient.set(installation.enterprise.id, installation);
      } else {
        // single team app installation
        return await sendQuery('INSERT INTO installs (id, install) VALUES (' + installation.team.id + ', ' + installation + ')') //pgClient.set(installation.team.id, installation);
      }
      throw new Error('Failed saving installation data to installationStore');
    },
    fetchInstallation: async (installQuery) => {
      console.log("fetch: " + JSON.stringify(installQuery));
      // change the line below so it fetches from your database
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        // org wide app installation lookup
        return await pgClient.get(installQuery.enterpriseId);
      }
      if (installQuery.teamId !== undefined) {
        // single team app installation lookup
        return await pgClient.get(installQuery.teamId);
      }
      throw new Error('Failed fetching installation');
    },
  },
});

//  Start app
(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  //await sendQuery(createQuery);

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

//  Finds all the matches of the key word phrases in the message
async function getRegExMatches(message, keywords) {
  try {
    const keywordsRegExp = new RegExp(keywords.join("|"), 'gim');

    return await message.match(keywordsRegExp);
  } catch (e) {
    console.log(e);
  }
}

function getRndInteger(max) {
  return Math.floor(Math.random() * (max));
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
  say,
  payload
}) => {
  try {
    if (message.user !== undefined) {
      const userData = await client.users.info({
        user: message.user
      });

      //  match sure this is a message from a human user
      if (!userData.is_bot) {
        const data = await loadData('data.json');

        let scopeValue = getRndInteger(data.randomValues.max);

        const matches = await getRegExMatches(message.text, data.keywords);

        //  check of any matches were found in the message
        if (matches !== null) {
          scopeValue -= matches.length * data.randomValues.matchIncrease;
        }

        //console.log("Amount of over scope: " + scopeValue);

        if (scopeValue <= data.randomValues.limit) {
          let sayPost = {
            "blocks": [{
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": getQuote(message.user, data.scopebook)
              }
            }]
          };

          if ("thread_ts" in payload) {
            sayPost.thread_ts = payload.thread_ts;
          }
        }
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


// Listen for an event from the Events API
app.event('url_verification', async ({
  event
}) => {
  try {
    console.log(event);
  } catch (e) {
    console.error(e);
  } finally {

  }
});

// Listen for an event from the Events API
app.event('oauth_redirect', async ({
  event
}) => {
  try {
    console.log(event);
  } catch (e) {
    console.error(e);
  } finally {

  }
});
