const mongoose = require("mongoose");

const SongSchema = new mongoose.Schema({
  guildId: {
    type: mongoose.SchemaTypes.String,
    require: true,
  },
  url: {
    type: mongoose.SchemaTypes.String,
    require: true,
  },
  title: {
    type: mongoose.SchemaTypes.String,
    require: true,
  },
});

module.exports = mongoose.model("Song", SongSchema);
