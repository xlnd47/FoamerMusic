require("dotenv").config();
const { Client } = require("discord.js");
const { registerCommands, registerEvents } = require("./utils/registry");
const client = new Client();
const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://thefoamer:Dagmaalhof22@discordbot.bypfh.gcp.mongodb.net/botmusic?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

(async () => {
  client.commands = new Map();
  client.events = new Map();
  client.prefix = process.env.DISCORD_BOT_PREFIX;
  client.queue = new Map();
  await registerCommands(client, "../commands");
  await registerEvents(client, "../events");
  await client.login(process.env.DISCORD_BOT_TOKEN);
})();
