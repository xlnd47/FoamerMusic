const BaseCommand = require("../../utils/structures/BaseCommand");
const { play } = require("./include/play");
const ytdl = require("ytdl-core");
// const YouTubeAPI = require("simple-youtube-api");
// const youtube = new YouTubeAPI(YOUTUBE_API_KEY);
const scdl = require("soundcloud-downloader");

module.exports = class PlayCommand extends BaseCommand {
  constructor() {
    super("play", "adding", ["add", "yt"]);
  }

  async run(client, message, args) {
    const { channel } = message.member.voice;

    // console.log(args);
    const serverQueue = message.client.queue.get(message.guild.id);
    if (!channel)
      return message
        .reply("You need to join a voice channel first!")
        .catch(console.error);
    if (serverQueue && channel !== message.guild.me.voice.channel)
      return message
        .reply(`You must be in the same channel as ${message.client.user}`)
        .catch(console.error);

    if (!args.length)
      return message
        .reply(`Usage: ${message.client.prefix}play <YouTube URL>`)
        .catch(console.error);

    const permissions = channel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT"))
      return message.reply(
        "Cannot connect to voice channel, missing permissions"
      );
    if (!permissions.has("SPEAK"))
      return message.reply(
        "I cannot speak in this voice channel, make sure I have the proper permissions!"
      );

    const videoPattern = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/gi;
    const playlistPattern = /^.*(list=)([^#\&\?]*).*/gi;
    const scRegex = /^https?:\/\/(soundcloud\.com)\/(.*)$/;
    const url = args[0];
    const urlValid = videoPattern.test(args[0]);
    // const urlValid = true;

    // Start the playlist if playlist url was provided
    if (!videoPattern.test(args[0]) && playlistPattern.test(args[0])) {
      return message.client.commands.get("playlist").execute(message, args);
    } else if (scdl.isValidUrl(url) && url.includes("/sets/")) {
      return message.client.commands.get("playlist").execute(message, args);
    }

    const queueConstruct = {
      textChannel: message.channel,
      channel,
      connection: null,
      songs: [],
      loop: false,
      volume: 10,
      playing: true,
    };

    let songInfo = null;
    let song = null;

    if (urlValid) {
      try {
        songInfo = await ytdl.getInfo(url);
        //console.log(songInfo.videoDetails);
        var thumbnails = songInfo.videoDetails.thumbnail.thumbnails;

        song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          duration: songInfo.videoDetails.lengthSeconds,
          thumbnail: thumbnails[thumbnails.length - 1].url,
        };
      } catch (error) {
        console.error(error);
        return message.reply(error.message).catch(console.error);
      }
    }
    //  else {
    //   try {
    //     const results = await youtube.searchVideos(search, 1);
    //     songInfo = await ytdl.getInfo(results[0].url);
    //     song = {
    //       title: songInfo.videoDetails.title,
    //       url: songInfo.videoDetails.video_url,
    //       duration: songInfo.videoDetails.lengthSeconds,
    //     };
    //   } catch (error) {
    //     console.error(error);
    //     return message
    //       .reply("No video was found with a matching title")
    //       .catch(console.error);
    //   }
    // }

    if (serverQueue) {
      serverQueue.songs.push(song);
      message.delete();
      return serverQueue.textChannel
        .send(
          `✅ **${song.title}** has been added to the queue by ${message.author}`
        )
        .then((msg) => msg.delete({ timeout: 4000 }))
        .catch(console.error);
    }

    queueConstruct.songs.push(song);
    message.client.queue.set(message.guild.id, queueConstruct);

    try {
      queueConstruct.connection = await channel.join();
      await queueConstruct.connection.voice.setSelfDeaf(true);
      play(queueConstruct.songs[0], message);
    } catch (error) {
      console.error(error);
      message.client.queue.delete(message.guild.id);
      await channel.leave();
      return message.channel
        .send(`Could not join the channel: ${error}`)
        .catch(console.error);
    }
  }
};
