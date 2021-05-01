const {
  App
} = require('@slack/bolt');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.BOT_TOKEN,
  socketMode: true,
  appToken: process.env.APP_TOKEN,
});

// Listens to incoming messages that contain "hello"
app.message('hey', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  console.log('hey');

  await say(`Hello, <@${message.user}>`);
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();
