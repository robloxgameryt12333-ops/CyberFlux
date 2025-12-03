const { 
  Client, 
  GatewayIntentBits, 
  Collection, 
  EmbedBuilder,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActivityType,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ]
});

// Collections to store commands
client.slashCommands = new Collection();
client.prefixCommands = new Collection();
client.aliases = new Collection();
const prefix = '!';

// Configuration
const config = {
  token: process.env.DISCORD_TOKEN || 'MTQ0NTMzMzM0MzAzNzI5MjY2NA.Glqnfj.Gn9xPcTq9wrpFpq6W6CEalRWRityNWLN08Gk7Y',
  ownerId:'totalplaytime1013' ,
  defaultCooldown: 3, // seconds
  welcomeChannelId: null,
  logChannelId: null
};

// Load Slash Commands
const slashCommandsPath = path.join(__dirname, 'slash-commands');
if (!fs.existsSync(slashCommandsPath)) fs.mkdirSync(slashCommandsPath);

// Load Prefix Commands
const prefixCommandsPath = path.join(__dirname, 'prefix-commands');
if (!fs.existsSync(prefixCommandsPath)) fs.mkdirSync(prefixCommandsPath);

// Cooldown system
const cooldowns = new Collection();

// Example slash commands data (in production, load from files)
const slashCommandsData = [
  {
    data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Check bot latency'),
    async execute(interaction) {
      const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      const apiLatency = Math.round(client.ws.ping);
      
      const embed = new EmbedBuilder()
        .setTitle('🏓 Pong!')
        .addFields(
          { name: 'Bot Latency', value: `${latency}ms`, inline: true },
          { name: 'API Latency', value: `${apiLatency}ms`, inline: true }
        )
        .setColor(0x00FF00)
        .setTimestamp();
      
      await interaction.editReply({ content: '', embeds: [embed] });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('Show all available commands'),
    async execute(interaction) {
      const embed = new EmbedBuilder()
        .setTitle('🤖 Bot Commands')
        .setDescription('Here are all available commands:')
        .addFields(
          { name: '🔄 **Slash Commands**', value: '`/ping` - Check bot latency\n`/help` - Show this menu\n`/userinfo [user]` - Get user information\n`/serverinfo` - Get server information\n`/clear [amount]` - Clear messages\n`/poll [question]` - Create a poll' },
          { name: '❗ **Prefix Commands**', value: '`!ping` - Check bot latency\n`!help` - Show commands\n`!userinfo [@user]` - User information\n`!avatar [@user]` - Get avatar\n`!serverinfo` - Server info\n`!kick [@user] [reason]` - Kick a user\n`!ban [@user] [reason]` - Ban a user\n`!mute [@user] [time]` - Mute a user\n`!clear [amount]` - Clear messages\n`!poll [question]` - Create poll\n`!translate [text]` - Translate text\n`!weather [city]` - Get weather\n`!quote` - Random quote\n`!remind [time] [message]` - Set reminder\n`!music play [url]` - Play music\n`!music stop` - Stop music\n`!8ball [question]` - Magic 8 ball\n`!roll [dice]` - Roll dice\n`!level` - Check your level\n`!leaderboard` - Server leaderboard' },
          { name: '⚙️ **Utility**', value: '`!invite` - Get bot invite\n`!support` - Support server\n`!report [bug]` - Report bug' }
        )
        .setColor(0x5865F2)
        .setFooter({ text: `Total Commands: ${client.slashCommands.size + client.prefixCommands.size}` })
        .setTimestamp();
      
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Invite Bot')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.com/oauth2/authorize?client_id=YOUR_BOT_ID'),
          new ButtonBuilder()
            .setLabel('Support Server')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/YOUR_SERVER_INVITE'),
          new ButtonBuilder()
            .setLabel('Vote')
            .setStyle(ButtonStyle.Link)
            .setURL('https://top.gg/bot/YOUR_BOT_ID')
        );
      
      await interaction.reply({ embeds: [embed], components: [row] });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('userinfo')
      .setDescription('Get information about a user')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The user to get info about')
          .setRequired(false)),
    async execute(interaction) {
      const user = interaction.options.getUser('user') || interaction.user;
      const member = interaction.guild.members.cache.get(user.id);
      
      const embed = new EmbedBuilder()
        .setTitle(`📊 User Information: ${user.username}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: '👤 Username', value: user.tag, inline: true },
          { name: '🆔 ID', value: user.id, inline: true },
          { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '📥 Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Not in server', inline: true },
          { name: '🎭 Roles', value: member ? member.roles.cache.size - 1 + ' roles' : 'N/A', inline: true },
          { name: '🤖 Bot', value: user.bot ? 'Yes' : 'No', inline: true }
        )
        .setColor(member ? member.displayHexColor : 0x5865F2)
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('serverinfo')
      .setDescription('Get information about this server'),
    async execute(interaction) {
      const guild = interaction.guild;
      
      const embed = new EmbedBuilder()
        .setTitle(`📊 Server Information: ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
          { name: '🆔 Server ID', value: guild.id, inline: true },
          { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
          { name: '📈 Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
          { name: '📁 Channels', value: `${guild.channels.cache.size}`, inline: true },
          { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
          { name: '🛡️ Roles', value: `${guild.roles.cache.size}`, inline: true },
          { name: '🌐 Region', value: guild.preferredLocale, inline: true }
        )
        .setColor(0x5865F2)
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('clear')
      .setDescription('Clear messages in a channel')
      .addIntegerOption(option =>
        option.setName('amount')
          .setDescription('Number of messages to clear (1-100)')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(100))
      .addUserOption(option =>
        option.setName('target')
          .setDescription('Clear messages from specific user')
          .setRequired(false)),
    async execute(interaction) {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: '❌ You need **Manage Messages** permission!', ephemeral: true });
      }
      
      const amount = interaction.options.getInteger('amount');
      const target = interaction.options.getUser('target');
      
      const messages = await interaction.channel.messages.fetch({ limit: amount });
      let filtered = messages;
      
      if (target) {
        filtered = messages.filter(msg => msg.author.id === target.id);
      }
      
      await interaction.channel.bulkDelete(filtered, true);
      
      const embed = new EmbedBuilder()
        .setDescription(`✅ Cleared **${filtered.size}** messages${target ? ` from ${target.tag}` : ''}`)
        .setColor(0x00FF00);
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
      
      // Delete confirmation after 5 seconds
      setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('poll')
      .setDescription('Create a poll')
      .addStringOption(option =>
        option.setName('question')
          .setDescription('The poll question')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('options')
          .setDescription('Poll options separated by | (max 10)')
          .setRequired(false)),
    async execute(interaction) {
      const question = interaction.options.getString('question');
      const optionsString = interaction.options.getString('options') || 'Yes|No';
      const options = optionsString.split('|').slice(0, 10);
      
      const embed = new EmbedBuilder()
        .setTitle(`📊 Poll: ${question}`)
        .setDescription(options.map((opt, i) => `${['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯'][i]} ${opt.trim()}`).join('\n\n'))
        .setColor(0xFFD700)
        .setFooter({ text: `Poll created by ${interaction.user.tag}` })
        .setTimestamp();
      
      const reply = await interaction.reply({ embeds: [embed], fetchReply: true });
      
      // Add reactions for each option
      for (let i = 0; i < options.length; i++) {
        await reply.react(['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯'][i]);
      }
    }
  }
];

// Register slash commands
slashCommandsData.forEach(command => {
  client.slashCommands.set(command.data.name, command);
});

// Prefix Commands (stored in client)
const prefixCommands = {
  ping: {
    name: 'ping',
    aliases: ['pong', 'latency'],
    description: 'Check bot latency',
    usage: '!ping',
    cooldown: 5,
    async execute(message, args) {
      const msg = await message.channel.send('🏓 Pinging...');
      const latency = msg.createdTimestamp - message.createdTimestamp;
      const apiLatency = Math.round(client.ws.ping);
      
      const embed = new EmbedBuilder()
        .setTitle('🏓 Pong!')
        .addFields(
          { name: 'Bot Latency', value: `${latency}ms`, inline: true },
          { name: 'API Latency', value: `${apiLatency}ms`, inline: true }
        )
        .setColor(0x00FF00)
        .setTimestamp();
      
      await msg.edit({ content: '', embeds: [embed] });
    }
  },
  
  help: {
    name: 'help',
    aliases: ['commands', 'h'],
    description: 'Show all commands',
    usage: '!help [command]',
    async execute(message, args) {
      const commandName = args[0];
      
      if (commandName) {
        const command = client.prefixCommands.get(commandName) || 
          Array.from(client.prefixCommands.values()).find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        
        if (!command) {
          return message.reply(`❌ Command \`${commandName}\` not found!`);
        }
        
        const embed = new EmbedBuilder()
          .setTitle(`Command: ${prefix}${command.name}`)
          .addFields(
            { name: 'Description', value: command.description || 'No description' },
            { name: 'Usage', value: `\`${command.usage || prefix + command.name}\`` },
            { name: 'Aliases', value: command.aliases ? command.aliases.map(a => `\`${a}\``).join(', ') : 'None' },
            { name: 'Cooldown', value: `${command.cooldown || config.defaultCooldown} seconds` }
          )
          .setColor(0x5865F2);
        
        return message.reply({ embeds: [embed] });
      }
      
      const embed = new EmbedBuilder()
        .setTitle('🤖 Bot Commands')
        .setDescription(`Use \`${prefix}help [command]\` for more info\nTotal: ${client.prefixCommands.size} commands`)
        .addFields(
          { 
            name: '🎮 General', 
            value: client.prefixCommands.filter(cmd => ['ping', 'help', 'userinfo', 'avatar', 'serverinfo'].includes(cmd.name))
              .map(cmd => `\`${prefix}${cmd.name}\` - ${cmd.description}`).join('\n')
          },
          { 
            name: '🛡️ Moderation', 
            value: client.prefixCommands.filter(cmd => ['kick', 'ban', 'mute', 'clear'].includes(cmd.name))
              .map(cmd => `\`${prefix}${cmd.name}\` - ${cmd.description}`).join('\n') || 'No moderation commands'
          },
          { 
            name: '🎉 Fun', 
            value: client.prefixCommands.filter(cmd => ['poll', '8ball', 'roll', 'quote'].includes(cmd.name))
              .map(cmd => `\`${prefix}${cmd.name}\` - ${cmd.description}`).join('\n') || 'No fun commands'
          },
          { 
            name: '⚙️ Utility', 
            value: client.prefixCommands.filter(cmd => ['invite', 'support', 'report', 'weather', 'translate', 'remind'].includes(cmd.name))
              .map(cmd => `\`${prefix}${cmd.name}\` - ${cmd.description}`).join('\n') || 'No utility commands'
          }
        )
        .setColor(0x5865F2)
        .setFooter({ text: `Prefix: ${prefix} | Total Commands: ${client.prefixCommands.size}` })
        .setTimestamp();
      
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Slash Commands')
            .setCustomId('slash_help')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setLabel('Invite Bot')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.com/oauth2/authorize?client_id=YOUR_BOT_ID')
        );
      
      message.reply({ embeds: [embed], components: [row] });
    }
  },
  
  userinfo: {
    name: 'userinfo',
    aliases: ['ui', 'whois'],
    description: 'Get user information',
    usage: '!userinfo [@user]',
    async execute(message, args) {
      const user = message.mentions.users.first() || message.author;
      const member = message.guild.members.cache.get(user.id);
      
      const embed = new EmbedBuilder()
        .setTitle(`📊 User Information: ${user.username}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: '👤 Username', value: user.tag, inline: true },
          { name: '🆔 ID', value: user.id, inline: true },
          { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '📥 Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Not in server', inline: true },
          { name: '🎭 Roles', value: member ? member.roles.cache.size - 1 + ' roles' : 'N/A', inline: true },
          { name: '🤖 Bot', value: user.bot ? 'Yes' : 'No', inline: true }
        )
        .setColor(member ? member.displayHexColor : 0x5865F2)
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();
      
      message.reply({ embeds: [embed] });
    }
  },
  
  avatar: {
    name: 'avatar',
    aliases: ['av', 'pfp'],
    description: 'Get user avatar',
    usage: '!avatar [@user]',
    async execute(message, args) {
      const user = message.mentions.users.first() || message.author;
      
      const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s Avatar`)
        .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .setColor(0x5865F2)
        .setFooter({ text: `Requested by ${message.author.tag}` });
      
      message.reply({ embeds: [embed] });
    }
  },
  
  serverinfo: {
    name: 'serverinfo',
    aliases: ['si', 'guildinfo'],
    description: 'Get server information',
    usage: '!serverinfo',
    async execute(message, args) {
      const guild = message.guild;
      
      const embed = new EmbedBuilder()
        .setTitle(`📊 Server Information: ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
          { name: '🆔 Server ID', value: guild.id, inline: true },
          { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
          { name: '📈 Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
          { name: '📁 Channels', value: `${guild.channels.cache.size}`, inline: true },
          { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
          { name: '🛡️ Roles', value: `${guild.roles.cache.size}`, inline: true }
        )
        .setColor(0x5865F2)
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();
      
      message.reply({ embeds: [embed] });
    }
  },
  
  kick: {
    name: 'kick',
    description: 'Kick a user from the server',
    usage: '!kick @user [reason]',
    permissions: ['KickMembers'],
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return message.reply('❌ You need **Kick Members** permission!');
      }
      
      const member = message.mentions.members.first();
      if (!member) return message.reply('❌ Please mention a user to kick!');
      if (!member.kickable) return message.reply('❌ I cannot kick this user!');
      
      const reason = args.slice(1).join(' ') || 'No reason provided';
      
      await member.kick(reason);
      
      const embed = new EmbedBuilder()
        .setTitle('👢 User Kicked')
        .addFields(
          { name: 'User', value: member.user.tag, inline: true },
          { name: 'Moderator', value: message.author.tag, inline: true },
          { name: 'Reason', value: reason }
        )
        .setColor(0xFFA500)
        .setTimestamp();
      
      message.reply({ embeds: [embed] });
    }
  },
  
  ban: {
    name: 'ban',
    description: 'Ban a user from the server',
    usage: '!ban @user [reason]',
    permissions: ['BanMembers'],
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return message.reply('❌ You need **Ban Members** permission!');
      }
      
      const member = message.mentions.members.first();
      if (!member) return message.reply('❌ Please mention a user to ban!');
      if (!member.bannable) return message.reply('❌ I cannot ban this user!');
      
      const reason = args.slice(1).join(' ') || 'No reason provided';
      
      await member.ban({ reason });
      
      const embed = new EmbedBuilder()
        .setTitle('🔨 User Banned')
        .addFields(
          { name: 'User', value: member.user.tag, inline: true },
          { name: 'Moderator', value: message.author.tag, inline: true },
          { name: 'Reason', value: reason }
        )
        .setColor(0xFF0000)
        .setTimestamp();
      
      message.reply({ embeds: [embed] });
    }
  },
  
  clear: {
    name: 'clear',
    aliases: ['purge', 'delete'],
    description: 'Clear messages in a channel',
    usage: '!clear <amount> [@user]',
    permissions: ['ManageMessages'],
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply('❌ You need **Manage Messages** permission!');
      }
      
      const amount = parseInt(args[0]);
      if (!amount || amount < 1 || amount > 100) {
        return message.reply('❌ Please provide a number between 1 and 100!');
      }
      
      const target = message.mentions.users.first();
      
      const messages = await message.channel.messages.fetch({ limit: amount });
      let filtered = messages;
      
      if (target) {
        filtered = messages.filter(msg => msg.author.id === target.id);
      }
      
      await message.channel.bulkDelete(filtered, true);
      
      const embed = new EmbedBuilder()
        .setDescription(`✅ Cleared **${filtered.size}** messages${target ? ` from ${target.tag}` : ''}`)
        .setColor(0x00FF00);
      
      const reply = await message.reply({ embeds: [embed] });
      setTimeout(() => reply.delete().catch(() => {}), 5000);
    }
  },
  
  poll: {
    name: 'poll',
    description: 'Create a poll',
    usage: '!poll <question> | option1 | option2',
    async execute(message, args) {
      const content = args.join(' ');
      if (!content) return message.reply('❌ Please provide a question and options!');
      
      const parts = content.split('|').map(p => p.trim());
      const question = parts[0];
      const options = parts.slice(1, 11); // Max 10 options
      
      if (options.length < 1) {
        options.push('Yes', 'No');
      }
      
      const embed = new EmbedBuilder()
        .setTitle(`📊 Poll: ${question}`)
        .setDescription(options.map((opt, i) => `${['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯'][i]} ${opt}`).join('\n\n'))
        .setColor(0xFFD700)
        .setFooter({ text: `Poll created by ${message.author.tag}` })
        .setTimestamp();
      
      const pollMessage = await message.channel.send({ embeds: [embed] });
      await message.delete().catch(() => {});
      
      for (let i = 0; i < options.length; i++) {
        await pollMessage.react(['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯'][i]);
      }
    }
  },
  
  '8ball': {
    name: '8ball',
    aliases: ['magic8', 'fortune'],
    description: 'Ask the magic 8-ball a question',
    usage: '!8ball <question>',
    async execute(message, args) {
      const responses = [
        'It is certain.', 'It is decidedly so.', 'Without a doubt.', 
        'Yes - definitely.', 'You may rely on it.', 'As I see it, yes.',
        'Most likely.', 'Outlook good.', 'Yes.', 'Signs point to yes.',
        'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.',
        'Cannot predict now.', 'Concentrate and ask again.', 'Don\'t count on it.',
        'My reply is no.', 'My sources say no.', 'Outlook not so good.', 'Very doubtful.'
      ];
      
      const question = args.join(' ');
      if (!question) return message.reply('❌ Please ask a question!');
      
      const response = responses[Math.floor(Math.random() * responses.length)];
      
      const embed = new EmbedBuilder()
        .setTitle('🎱 Magic 8-Ball')
        .addFields(
          { name: 'Question', value: question },
          { name: 'Answer', value: response }
        )
        .setColor(0x800080)
        .setFooter({ text: `Asked by ${message.author.tag}` })
        .setTimestamp();
      
      message.reply({ embeds: [embed] });
    }
  },
  
  roll: {
    name: 'roll',
    aliases: ['dice'],
    description: 'Roll a dice',
    usage: '!roll [sides]',
    async execute(message, args) {
      const sides = parseInt(args[0]) || 6;
      const result = Math.floor(Math.random() * sides) + 1;
      
      const embed = new EmbedBuilder()
        .setTitle('🎲 Dice Roll')
        .setDescription(`You rolled a **${result}** on a ${sides}-sided dice!`)
        .setColor(0xFFD700)
        .setFooter({ text: `Rolled by ${message.author.tag}` });
      
      message.reply({ embeds: [embed] });
    }
  },
  
  invite: {
    name: 'invite',
    description: 'Get bot invite link',
    async execute(message, args) {
      const embed = new EmbedBuilder()
        .setTitle('🤖 Invite Me!')
        .setDescription('[Click here to invite me to your server!](https://discord.com/oauth2/authorize?client_id=YOUR_BOT_ID)')
        .addFields(
          { name: 'Permissions', value: '• Send Messages\n• Read Messages\n• Manage Messages\n• Kick Members\n• Ban Members\n• Manage Channels\n• Add Reactions' }
        )
        .setColor(0x5865F2);
      
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Invite')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.com/oauth2/authorize?client_id=YOUR_BOT_ID'),
          new ButtonBuilder()
            .setLabel('Support')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/YOUR_SERVER_INVITE'),
          new ButtonBuilder()
            .setLabel('GitHub')
            .setStyle(ButtonStyle.Link)
            .setURL('https://github.com/YOUR_USERNAME')
        );
      
      message.reply({ embeds: [embed], components: [row] });
    }
  },
  
  support: {
    name: 'support',
    aliases: ['server'],
    description: 'Get support server invite',
    async execute(message, args) {
      const embed = new EmbedBuilder()
        .setTitle('🆘 Support Server')
        .setDescription('[Click here to join our support server!](https://discord.gg/YOUR_SERVER_INVITE)')
        .addFields(
          { name: 'Features', value: '• Get help with the bot\n• Report bugs\n• Suggest features\n• Get updates\n• Chat with community' }
        )
        .setColor(0x5865F2);
      
      message.reply({ embeds: [embed] });
    }
  }
};

// Register prefix commands
Object.values(prefixCommands).forEach(command => {
  client.prefixCommands.set(command.name, command);
  if (command.aliases) {
    command.aliases.forEach(alias => {
      client.aliases.set(alias, command.name);
    });
  }
});

// Handle cooldowns
function setCooldown(userId, command, time) {
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }
  
  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || config.defaultCooldown) * 1000;
  
  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);
}

function isOnCooldown(userId, command) {
  if (!cooldowns.has(command.name)) return false;
  
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || config.defaultCooldown) * 1000;
  
  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId) + cooldownAmount;
    if (Date.now() < expirationTime) {
      return Math.ceil((expirationTime - Date.now()) / 1000);
    }
  }
  return false;
}

// Event: When the client is ready
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);
  console.log(`🔄 ${client.slashCommands.size} slash commands loaded`);
  console.log(`❗ ${client.prefixCommands.size} prefix commands loaded`);
  
  // Set bot status
  client.user.setPresence({
    activities: [{
      name: `${prefix}help | /help`,
      type: ActivityType.Playing
    }],
    status: 'online'
  });
  
  // Register slash commands globally
  try {
    const commands = Array.from(client.slashCommands.values()).map(cmd => cmd.data);
    await client.application.commands.set(commands);
    console.log('✅ Slash commands registered globally!');
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
  }
});

// Event: When a slash command is used
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  
  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Error executing slash command ${interaction.commandName}:`, error);
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ 
        content: '❌ There was an error executing this command!', 
        ephemeral: true 
      });
    } else {
      await interaction.reply({ 
        content: '❌ There was an error executing this command!', 
        ephemeral: true 
      });
    }
  }
});

// Event: When a message is created (for prefix commands)
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  const command = client.prefixCommands.get(commandName) || 
    client.prefixCommands.get(client.aliases.get(commandName));
  
  if (!command) return;
  
  // Check cooldown
  const cooldownLeft = isOnCooldown(message.author.id, command);
  if (cooldownLeft) {
    return message.reply(`⏰ Please wait ${cooldownLeft} more second(s) before using \`${prefix}${command.name}\` again.`);
  }
  
  // Check permissions
  if (command.permissions) {
    const missingPerms = command.permissions.filter(perm => 
      !message.member.permissions.has(PermissionFlagsBits[perm])
    );
    if (missingPerms.length > 0) {
      return message.reply(`❌ You need **${missingPerms.join(', ')}** permission(s) to use this command!`);
    }
  }
  
  try {
    await command.execute(message, args);
    setCooldown(message.author.id, command);
  } catch (error) {
    console.error(`❌ Error executing prefix command ${command.name}:`, error);
    message.reply('❌ There was an error executing that command!');
  }
});

// Event: Button interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  
  if (interaction.customId === 'slash_help') {
    const embed = new EmbedBuilder()
      .setTitle('🔄 Slash Commands')
      .setDescription('Here are the available slash commands:')
      .addFields(
        { name: 'General', value: client.slashCommands.map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description}`).join('\n') }
      )
      .setColor(0x5865F2);
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

// Event: Guild member add (welcome message)
client.on('guildMemberAdd', async member => {
  if (!config.welcomeChannelId) return;
  
  const channel = member.guild.channels.cache.get(config.welcomeChannelId);
  if (!channel) return;
  
  const embed = new EmbedBuilder()
    .setTitle(`👋 Welcome ${member.user.username}!`)
    .setDescription(`Welcome to **${member.guild.name}**!\n\n• Read the rules in <#RULES_CHANNEL_ID>\n• Get roles in <#ROLES_CHANNEL_ID>\n• Enjoy your stay!`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setColor(0x00FF00)
    .setFooter({ text: `Member #${member.guild.memberCount}` })
    .setTimestamp();
  
  channel.send({ content: `<@${member.id}>`, embeds: [embed] });
});

// Error handling
client.on('error', error => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

// Login to Discord
client.login(config.token).catch(error => {
  console.error('❌ Failed to login:', error);
  process.exit(1);
});