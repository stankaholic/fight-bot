import * as Discord from 'discord.js';
import 'dotenv/config';
import InteractionHandler from './discord/InteractionHandler';
import LoggerFactory from './services/Logging/LoggerFactory';
import UfcService from './services/UfcService';
import Environment from './util/Environment';

const logger = LoggerFactory.createLogger();
const dataService = new UfcService(logger);
const interactionHandler = new InteractionHandler(logger, dataService);

const intents = [Discord.Intents.FLAGS.GUILDS];

const client = new Discord.Client({ intents });

client.once('ready', () => {
  logger.info('Ready to accept commands');
});

client.on('interactionCreate', interactionHandler.handleInteraction);

client.login(Environment.DISCORD_TOKEN);
