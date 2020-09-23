const { MessageEmbed } = require("discord.js");
const YouTube = require("simple-youtube-api");
const BaseCommand = require("../../utils/structures/BaseCommand");

const youtube = new YouTube(process.env.YOUTUBE_API_KEY);

module.exports = class SearchCommand extends BaseCommand {
  constructor() {
    super("search", "searching", []);
  }

  async run(client, message, args) {
    if (!args.length)
      return message
        .reply(`Usage: ${message.client.prefix}search <Video Name>`)
        .catch(console.error);

    if (message.channel.activeCollector)
      return message.reply(
        "A message collector is already active in this channel."
      );
    if (!message.member.voice.channel)
      return message
        .reply("You need to join a voice channel first!")
        .catch(console.error);

    const search = args.join(" ");

    let resultsEmbed = new MessageEmbed()
      .setTitle(`**Reply with the song number you want to play**`)
      .setDescription(`Results for: ${search}`)
      .setColor("#F8AA2A");

    try {
      const results = await youtube.searchVideos(search);
      //   console.log(results.length);
      results.map((video, index) =>
        resultsEmbed.addField(video.shortURL, `${index + 1}. ${video.title}`)
      );

      var resultsMessage = await message.channel.send(resultsEmbed);

      let react = [];
      react[0] = resultsMessage.react("1️⃣");
      react[1] = resultsMessage.react("2️⃣");
      react[2] = resultsMessage.react("3️⃣");
      react[3] = resultsMessage.react("4️⃣");
      react[4] = resultsMessage.react("5️⃣");
      await Promise.all(react);
    } catch (error) {
      console.error(error);
      //message.channel.activeCollector = false;
    }

    const filter = (reaction, user) => user.id !== message.client.user.id;
    var collector = resultsMessage.createReactionCollector(filter, {
      time: 30000,
    });

    var choice = "";

    collector.on("collect", (reaction, user) => {
      const member = message.guild.member(user);
      switch (reaction.emoji.name) {
        case "1️⃣":
          choice = resultsEmbed.fields[parseInt(0)].name;
          client.commands.get("play").run(client, message, [choice, " "]);
          resultsMessage.delete().catch(console.error);
          break;
        case "2️⃣":
          choice = resultsEmbed.fields[parseInt(1)].name;
          client.commands.get("play").run(client, message, [choice, " "]);
          resultsMessage.delete().catch(console.error);

          break;
        case "3️⃣":
          choice = resultsEmbed.fields[parseInt(2)].name;
          client.commands.get("play").run(client, message, [choice, " "]);
          resultsMessage.delete().catch(console.error);

          break;
        case "4️⃣":
          choice = resultsEmbed.fields[parseInt(3)].name;
          client.commands.get("play").run(client, message, [choice, " "]);
          resultsMessage.delete().catch(console.error);

          break;
        case "5️⃣":
          choice = resultsEmbed.fields[parseInt(4)].name;
          client.commands.get("play").run(client, message, [choice, " "]);
          resultsMessage.delete().catch(console.error);

          break;
        default:
          reaction.users.remove(user).catch(console.error);
          break;
      }
    });

    collector.on("end", () => {
      resultsMessage.reactions.removeAll().catch();
      resultsMessage.delete().catch();
      message.delete().catch();
    });
  }
};
