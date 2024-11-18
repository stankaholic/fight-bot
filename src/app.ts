import * as Discord from 'discord.js';
import 'dotenv/config';
import InteractionHandler from './discord/InteractionHandler';
import UfcService from './services/UfcService';
import {
  env,
  logger
} from './globals'

const start = async () => {

  const dataService = new UfcService();
  const interactionHandler = new InteractionHandler(dataService);

  const intents = [Discord.Intents.FLAGS.GUILDS];

  const client = new Discord.Client({ intents });

  client.once('ready', () => {
    logger.info('Ready to accept commands');
  });

  client.on('interactionCreate', interactionHandler.handleInteraction);

  client.login(env.DISCORD_TOKEN);
};
start();
