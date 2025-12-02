require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes
} = require("discord.js");
const fs = require("fs");

// ------------ CLIENT ------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// ------------ COMMAND LIST ------------
const commands = [
  { name: "ping", description: "Show bot ping" },
  {
    name: "avatar",
    description: "Get user avatar",
    options: [{ name: "user", type: 6, description: "User", required: false }]
  },
  { name: "joke", description: "Random joke" },
  { name: "animequote", description: "Anime quote" },
  { name: "cricketfact", description: "Cricket fact" },
  {
    name: "rps",
    description: "Rock Paper Scissors",
    options: [
      {
        name: "choice",
        type: 3,
        description: "rock/paper/scissors",
        required: true,
        choices: [
          { name: "rock", value: "rock" },
          { name: "paper", value: "paper" },
          { name: "scissors", value: "scissors" }
        ]
      }
    ]
  },

  // Economy
  { name: "balance", description: "Check balance" },
  { name: "daily", description: "Daily reward" },
  { name: "work", description: "Earn coins" },

  // Moderation
  {
    name: "ban",
    description: "Ban user",
    options: [{ name: "user", type: 6, required: true }]
  },
  {
    name: "kick",
    description: "Kick user",
    options: [{ name: "user", type: 6, required: true }]
  },
  {
    name: "clear",
    description: "Clear messages",
    options: [{ name: "amount", type: 4, required: true }]
  }
];

// ------------ COMMAND REGISTRATION (AUTO DEPLOY) ------------
async function deployCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("Slash commands uploaded ✔");
  } catch (err) {
    console.log(err);
  }
}

// ------------ READY EVENT ------------
client.once("ready", () => {
  console.log(`Bot logged in as ${client.user.tag}`);
  deployCommands();
});

// ------------ ECONOMY FILE ------------
if (!fs.existsSync("./economy.json"))
  fs.writeFileSync("./economy.json", "{}");

let econ = JSON.parse(fs.readFileSync("./economy.json", "utf8"));

function saveEcon() {
  fs.writeFileSync("./economy.json", JSON.stringify(econ, null, 2));
}

// ------------ INTERACTION HANDLER ------------
client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;

  // ------------ Utility ------------
  if (i.commandName === "ping")
    return i.reply(`Pong! 🏓 **${client.ws.ping}ms**`);

  if (i.commandName === "avatar") {
    let user = i.options.getUser("user") || i.user;
    return i.reply(user.displayAvatarURL({ size: 1024 }));
  }

  // ------------ Fun ------------
  if (i.commandName === "joke") {
    const jokes = [
      "Why did the computer show up at work late? It had a hard drive!",
      "I told my PC a joke, but it didn’t laugh. Maybe it doesn’t have a sense of humor.",
      "Why do programmers prefer dark mode? Because light attracts bugs."
    ];
    return i.reply(jokes[Math.floor(Math.random() * jokes.length)]);
  }

  if (i.commandName === "animequote") {
    const q = [
      "“If you don’t take risks, you can’t create a future.” – Luffy",
      "“Fear is not evil. It tells you your weakness.” – Gildarts",
      "“A dropout will beat a genius through hard work.” – Rock Lee"
    ];
    return i.reply(q[Math.floor(Math.random() * q.length)]);
  }

  if (i.commandName === "cricketfact") {
    const f = [
      "Sachin Tendulkar has 100 international centuries.",
      "MS Dhoni is the only captain to win all ICC trophies.",
      "Chris Gayle has the fastest T20 century (30 balls)."
    ];
    return i.reply(f[Math.floor(Math.random() * f.length)]);
  }

  // ------------ Games ------------
  if (i.commandName === "rps") {
    const user = i.options.getString("choice");
    const choices = ["rock", "paper", "scissors"];
    const bot = choices[Math.floor(Math.random() * choices.length)];

    if (user === bot) return i.reply(`Draw! We both chose **${bot}**`);
    if (
      (user === "rock" && bot === "scissors") ||
      (user === "paper" && bot === "rock") ||
      (user === "scissors" && bot === "paper")
    )
      return i.reply(`You chose **${user}**, I chose **${bot}** → **You win!**`);
    else return i.reply(`You chose **${user}**, I chose **${bot}** → **I win 😈**`);
  }

  // ------------ Economy ------------
  let id = i.user.id;
  if (!econ[id]) econ[id] = 0;

  if (i.commandName === "balance")
    return i.reply(`💰 Your balance: **${econ[id]} coins**`);

  if (i.commandName === "daily") {
    econ[id] += 50;
    saveEcon();
    return i.reply("You received your **50 coin daily reward!**");
  }

  if (i.commandName === "work") {
    let earn = Math.floor(Math.random() * 40) + 10;
    econ[id] += earn;
    saveEcon();
    return i.reply(`You worked and earned **${earn} coins** 💼`);
  }

  // ------------ Moderation ------------
  if (i.commandName === "ban") {
    let user = i.options.getUser("user");
    let member = await i.guild.members.fetch(user.id);
    await member.ban();
    return i.reply(`🔨 Banned **${user.tag}**`);
  }

  if (i.commandName === "kick") {
    let user = i.options.getUser("user");
    let member = await i.guild.members.fetch(user.id);
    await member.kick();
    return i.reply(`👢 Kicked **${user.tag}**`);
  }

  if (i.commandName === "clear") {
    let amt = i.options.getInteger("amount");
    await i.channel.bulkDelete(amt);
    return i.reply(`🧹 Cleared **${amt} messages**`);
  }
});

// ------------ LOGGING ------------
client.on("guildMemberAdd", (m) => {
  console.log(`${m.user.tag} joined the server.`);
});
client.on("guildMemberRemove", (m) => {
  console.log(`${m.user.tag} left the server.`);
});

// ------------ LOGIN ------------
client.login(process.env.TOKEN);