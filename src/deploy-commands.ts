import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import 'dotenv/config';
import Environment from './util/Environment';

const commands = [
  new SlashCommandBuilder()
    .setName('fight')
    .setDescription('Replies with upcoming fight card'),
  new SlashCommandBuilder()
    .setName('fights')
    .setDescription('Replies with links to upcoming fights'),
  new SlashCommandBuilder()
    .setName('fight-event')
    .setDescription('Creates a Discord Event for the upcoming fight'),
].map((command) => command.toJSON());

const rest = new REST({ version: '9' }).setToken(Environment.DISCORD_TOKEN);

(async () => {
  try {
    const appCmds = Routes.applicationCommands(Environment.CLIENT_ID);
    await rest.put(appCmds, {
      body: commands,
    });

    const appGuildCmds = Routes.applicationGuildCommands(Environment.CLIENT_ID, Environment.GUILD_ID);
    await rest.put(appGuildCmds, {
      body: commands,
    });

    console.log('Successfully registered application commands.');
  } catch (error) {
    console.error(error);
  }
})();
