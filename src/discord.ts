import dotenv from "dotenv";
import { ipcMain } from "electron";
import Eris from "eris";
import ytdl from "ytdl-core";

dotenv.config();

var bot = Eris(process.env.TOKEN);
var currentVoiceConnection: Eris.VoiceConnection | null = null;

bot.on("ready", () => {});

bot.on("error", (err) => {
  console.error(err);
});

bot.on("messageCreate", (msg) => {
  if (msg.content.startsWith("!join")) {
    if (!(msg.channel as any).guild) {
      // Check if the message was sent in a guild
      bot.createMessage(
        msg.channel.id,
        "This command can only be run in a server."
      );
      return;
    }
    if (!msg.member.voiceState.channelID) {
      // Check if the user is in a voice channel
      bot.createMessage(msg.channel.id, "You are not in a voice channel.");
      return;
    }
    bot
      .joinVoiceChannel(msg.member.voiceState.channelID)
      .catch((err) => {
        bot.createMessage(
          msg.channel.id,
          "Error joining voice channel: " + err.message
        ); // Notify the user if there is an error
        console.log(err); // Log the error      console.log(err); // Log the error
      })
      .then((connection) => {
        currentVoiceConnection = connection || null;
      });
  }
});

bot.on("voiceChannelLeave", () => {
  currentVoiceConnection = null;
});

bot.connect();

ipcMain.on("play", (event, url) => {
  if (!currentVoiceConnection) {
    event.reply(
      "error",
      "Not in a voice channel use !join to add bot to a voice channel"
    );
    return;
  }
  if (currentVoiceConnection.playing) {
    // Stop playing if the connection is playing something
    currentVoiceConnection.stopPlaying();
  }
  currentVoiceConnection.play(ytdl(url, { quality: "highestaudio" }));
  event.reply("message", `Now playing ${url}`);
  currentVoiceConnection.once("end", () => {
    event.reply("message", `Finished ${url}`);
  });
});

export default bot;
