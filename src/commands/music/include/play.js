const ytdlDiscord = require("ytdl-core-discord");
const { canModifyQueue } = require("./util");
const { MessageEmbed } = require("discord.js");

module.exports = {
  async play(song, message) {
    const queue = message.client.queue.get(message.guild.id);
    message.delete();

    if (!song) {
      queue.channel.leave();
      message.client.queue.delete(message.guild.id);
      return queue.textChannel
        .send("🚫 Music queue ended.")
        .then((msg) => msg.delete({ timeout: 10000 }))
        .catch(console.error);
    }

    let stream = null;
    let streamType = song.url.includes("youtube.com") ? "opus" : "ogg/opus";

    try {
      if (song.url.includes("youtube.com")) {
        stream = await ytdlDiscord(song.url, { highWaterMark: 1 << 25 });
      }
    } catch (error) {
      if (queue) {
        queue.songs.shift();
        module.exports.play(queue.songs[0], message);
      }

      console.error(error);
      return message.channel.send(
        `Error: ${error.message ? error.message : error}`
      );
    }

    queue.connection.on("disconnect", () =>
      message.client.queue.delete(message.guild.id)
    );

    const dispatcher = queue.connection
      .play(stream, { type: streamType })
      .on("finish", () => {
        if (collector && !collector.ended) collector.stop();

        if (queue.loop) {
          // if loop is on, push the song back at the end of the queue
          // so it can repeat endlessly
          let lastSong = queue.songs.shift();
          queue.songs.push(lastSong);
          module.exports.play(queue.songs[0], message);
        } else {
          // Recursively play the next song
          queue.songs.shift();
          module.exports.play(queue.songs[0], message);
        }
      })
      .on("error", (err) => {
        console.error(err);
        queue.songs.shift();
        module.exports.play(queue.songs[0], message);
      });
    dispatcher.setVolumeLogarithmic(queue.volume / 100);

    try {
      //   var playingMessage = await queue.textChannel.send(
      //     `🎶 Started playing: **${song.title}** ${song.url}`
      //   );

      var playingMessage = await queue.textChannel.send(playingEmbeded(song));

      //console.log(song);
      //   await playingMessage.react("⏭");
      //   await playingMessage.react("⏯");
      //   await playingMessage.react("🔇");
      //   await playingMessage.react("🔉");
      //   await playingMessage.react("🔊");
      //   await playingMessage.react("🔁");
      //   await playingMessage.react("⏹");

      let react = [];

      react[0] = playingMessage.react("⏭");
      react[1] = playingMessage.react("⏯");
      react[2] = playingMessage.react("🔇");
      react[3] = playingMessage.react("🔉");
      react[4] = playingMessage.react("🔊");
      react[5] = playingMessage.react("🔁");
      react[6] = playingMessage.react("⏹");

      await Promise.all(react);
    } catch (error) {
      console.error(error);
    }

    const filter = (reaction, user) => user.id !== message.client.user.id;
    var collector = playingMessage.createReactionCollector(filter, {
      time: song.duration > 0 ? song.duration * 1000 : 6000000,
    });

    collector.on("collect", (reaction, user) => {
      if (!queue) return;
      const member = message.guild.member(user);

      switch (reaction.emoji.name) {
        case "⏭":
          queue.playing = true;
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          queue.connection.dispatcher.end();
          queue.textChannel
            .send(`${user} ⏩ skipped the song`)
            .then((msg) => msg.delete({ timeout: 10000 }))
            .catch(console.error);
          collector.stop();
          break;

        case "⏯":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          if (queue.playing) {
            queue.playing = !queue.playing;
            queue.connection.dispatcher.pause(true);
            queue.textChannel
              .send(`${user} ⏸ paused the music.`)
              .then((msg) => msg.delete({ timeout: 10000 }))
              .catch(console.error);
          } else {
            queue.playing = !queue.playing;
            queue.connection.dispatcher.resume();
            queue.textChannel
              .send(`${user} ▶ resumed the music!`)
              .then((msg) => msg.delete({ timeout: 10000 }))
              .catch(console.error);
          }
          break;

        case "🔇":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          if (queue.volume <= 0) {
            queue.volume = 100;
            queue.connection.dispatcher.setVolumeLogarithmic(100 / 100);
            queue.textChannel
              .send(`${user} 🔊 unmuted the music!`)
              .then((msg) => msg.delete({ timeout: 10000 }))
              .catch(console.error);
          } else {
            queue.volume = 0;
            queue.connection.dispatcher.setVolumeLogarithmic(0);
            queue.textChannel
              .send(`${user} 🔇 muted the music!`)
              .then((msg) => msg.delete({ timeout: 10000 }))
              .catch(console.error);
          }
          break;

        case "🔉":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          if (queue.volume - 10 <= 0) queue.volume = 0;
          else queue.volume = queue.volume - 10;
          queue.connection.dispatcher.setVolumeLogarithmic(queue.volume / 100);
          queue.textChannel
            .send(
              `${user} 🔉 decreased the volume, the volume is now ${queue.volume}%`
            )
            .then((msg) => msg.delete({ timeout: 2000 }))
            .catch(console.error);
          break;

        case "🔊":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          if (queue.volume + 10 >= 100) queue.volume = 100;
          else queue.volume = queue.volume + 10;
          queue.connection.dispatcher.setVolumeLogarithmic(queue.volume / 100);
          queue.textChannel
            .send(
              `${user} 🔊 increased the volume, the volume is now ${queue.volume}%`
            )
            .then((msg) => msg.delete({ timeout: 2000 }))
            .catch(console.error);
          break;

        case "🔁":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          queue.loop = !queue.loop;
          queue.textChannel
            .send(`Loop is now ${queue.loop ? "**on**" : "**off**"}`)
            .then((msg) => msg.delete({ timeout: 10000 }))
            .catch(console.error);
          break;

        case "⏹":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          queue.songs = [];
          queue.textChannel
            .send(`${user} ⏹ stopped the music!`)
            .then((msg) => msg.delete({ timeout: 10000 }))
            .catch(console.error);
          try {
            queue.connection.dispatcher.end();
          } catch (error) {
            console.error(error);
            queue.connection.disconnect();
          }
          collector.stop();
          break;

        default:
          reaction.users.remove(user).catch(console.error);
          break;
      }
    });

    collector.on("end", () => {
      playingMessage.reactions.removeAll().catch(console.error);
      if (playingMessage && !playingMessage.deleted) {
        playingMessage.delete({ timeout: 3000 }).catch(console.error);
      }
    });

    function playingEmbeded(song) {
      var minutes = Math.floor(song.duration / 60);
      var seconds = song.duration - minutes * 60;

      return new MessageEmbed()
        .setTitle(
          `0:00 --------------------------------------------------- ${minutes}:${seconds}`
        )
        .setAuthor(song.title, "", song.url)
        .setColor("#0062ff")
        .setImage(song.thumbnail);
    }
  },
};
