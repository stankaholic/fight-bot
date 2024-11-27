import {
  GuildChannelManager,
  CommandInteraction,
  EmbedFieldData,
  GuildScheduledEventCreateOptions,
  Interaction,
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  SelectMenuInteraction,
} from 'discord.js';
import { Event, Fight, parseEvent, parseEvents } from '../services/FightParser';
import { logger } from '../globals';
import UfcService from '../services/UfcService';
import { eventToDate } from '../util/Parsers';
import { log } from 'console';

export default class InteractionHandler {
  private readonly dataService: UfcService;
  private currentBetIndex: number = 0;
  private numOfFights: number = 0;

  public constructor(dataService: UfcService) {
    this.dataService = dataService;

    this.buildFightEmbed = this.buildFightEmbed.bind(this);
    this.handleCommand = this.handleCommand.bind(this);
    this.handleSelectMenu = this.handleSelectMenu.bind(this);
    this.getFightLink = this.getFightLink.bind(this);
    this.getFightLinks = this.getFightLinks.bind(this);
    this.getEvent = this.getEvent.bind(this);
    this.handleFightEvent = this.handleFightEvent.bind(this);
    this.handleFight = this.handleFight.bind(this);
    this.handleFights = this.handleFights.bind(this);
    this.handleInteraction = this.handleInteraction.bind(this);
  }

  private buildFightEmbed(event: Event, url: string): MessageEmbed {
    const embed = new MessageEmbed();

    embed.setTitle(event.title);
    embed.setURL(url);
    embed.setDescription(`${event.subtitle}\n${event.date}`);
    embed.setThumbnail(event.imgUrl);

    const fights: EmbedFieldData[] = [];

    event.fights.forEach((fight) => {
      const fightData:EmbedFieldData = {
        name: fight.weightClass || 'Unknown',
        value: `${fight.redCorner.rank} ${fight.redCorner.name}\n${fight.redCorner.odds}\nvs.\n${fight.blueCorner.rank} ${fight.blueCorner.name}\n${fight.blueCorner.odds}`,
        inline: true,
      };
      fights.push(fightData);
    });

    embed.addFields(fights);

    return embed;
  }

  private buildBetEmbed(fight: Fight, imgUrl: string): MessageEmbed {
    const re = /\s+/g;

    const embed = new MessageEmbed();

    embed.setTitle(fight.redCorner.name.replace(re, ' ') + " vs. " + fight.blueCorner.name.replace(re, ' '));
    embed.setImage(imgUrl);

    return embed;
  }

  private async handleCommand(
    interaction: CommandInteraction,
    command: string
  ): Promise<void> {
    logger.info(`Processing command - ${command}`);

    switch (command) {
      case 'fight':
        this.handleFight(interaction);
        break;
      case 'fights':
        this.handleFights(interaction);
        break;
      case 'fight-event':
        this.handleFightEvent(interaction);
        break;
      case 'bet':
        this.handleBet(interaction);
        break;
      default:
        logger.info(`Command not supported - ${command}`);
        break;
    }
  }

  private async handleSelectMenu(
    interaction: SelectMenuInteraction,
    menuId: string
  ): Promise<void> {
    logger.info(`Processing menu - ${menuId}`);

    switch (menuId) {
      case 'event-channel':
        this.handleEventChannel(interaction);
        break;
      default:
        logger.info(`Menu not supported - ${menuId}`);
        break;
    }
  }

  private async handleButton(
    interaction: Interaction,
    buttonId: string
  ): Promise<void> {
    logger.info(`Processing button - ${buttonId}`);

    switch (buttonId) {
      case 'right-button':
        this.currentBetIndex = (this.currentBetIndex + 1) % this.numOfFights;
        break;
      case 'left-button':
        this.currentBetIndex = this.currentBetIndex - 1 < 0 ? this.numOfFights - 1 : this.currentBetIndex - 1;
        break;
      default:
        logger.info(`Button not supported - ${buttonId}`);
        break;
    }
    logger.debug(`currentBetIndex: ${this.currentBetIndex}`);
  }

  private async getFightLink(): Promise<string> {
    const links = await this.getFightLinks();
    let link = links.shift();
    const event: Event = await this.getEvent(link);
    const now: Date = new Date(Date.now());

    // If current fight is outdated, grab the next one
    if (eventToDate(event) < now) {
      link = links.shift();
    }

    return link;
  }

  private async getFightLinks(): Promise<string[]> {
    try {
      const eventHtml = await this.dataService.fetchEvents();
      const links = parseEvents(eventHtml);
      return links;
    } catch (error) {
      logger.error(
        `Failed retrieving events from UFC website - ${error.message}`
      );
      return [];
    }
  }

  private async getEvent(link: string): Promise<Event> {
    const eventHtml = await this.dataService.fetchData<string>(link);

    return parseEvent(eventHtml);
  }

  private async handleFights(interaction: CommandInteraction): Promise<void> {
    const links = await this.getFightLinks();
    interaction.reply(links.join('\n'));
  }

  private async handleFight(interaction: CommandInteraction): Promise<void> {
    const link = await this.getFightLink();

    const eventHtml = await this.dataService.fetchData<string>(link);
    const event = parseEvent(eventHtml);

    await interaction.reply({ embeds: [this.buildFightEmbed(event, link)] });
  }

  private async handleFightEvent(
    interaction: CommandInteraction
  ): Promise<void> {
    const channels: GuildChannelManager = interaction.guild.channels;

    const msg: MessageActionRow = new MessageActionRow();
    const menu: MessageSelectMenu = new MessageSelectMenu();
    menu.setCustomId('event-channel');
    for (const [id, channel] of channels.cache.entries()) {
      logger.debug(
        `id: ${id.toString()} name: ${
          channel.name
        } isVoice: ${channel.isVoice()}`
      );
      if (channel.isVoice()) {
        menu.addOptions([
          {
            label: channel.name,
            value: id.toString(),
          },
        ]);
      }
    }

    msg.addComponents(menu);

    await interaction.reply({
      content: 'Please select the channel for the event',
      components: [msg],
    });
  }

  private async handleEventChannel(
    interaction: SelectMenuInteraction
  ): Promise<void> {
    const link = await this.getFightLink();
    const event: Event = await this.getEvent(link);

    const channelId = interaction.values.pop();
    const re = /\s+/g;
    const subtitle = event.subtitle.replace(re, ' ');
    const title = `${event.title}: ${subtitle}`;
    let description = '';
    for (const fight of event.fights) {
      if (fight.redCorner.name && fight.blueCorner.name) {
        description = description.concat(
          `${fight.blueCorner.name.replace(re, ' ')} vs. ${fight.redCorner.name.replace(re, ' ')}\n`
        );
      }
    }

    const eventCreateOptions: GuildScheduledEventCreateOptions = {
      name: title,
      description: description,
      scheduledStartTime: eventToDate(event),
      channel: channelId,
      entityType: 'VOICE',
      privacyLevel: 'GUILD_ONLY',
    };

    interaction.guild.scheduledEvents.create(eventCreateOptions);

    await interaction.update(`Created event: ${title}`);
  }

  private async handleBet(
    interaction: CommandInteraction
  ): Promise<void> {
    const link = await this.getFightLink();

    const eventHtml = await this.dataService.fetchData<string>(link);
    const event = parseEvent(eventHtml);

    this.numOfFights = event.fights.length;
    this.currentBetIndex = event.fights.length - 1;

    // const embed = new MessageEmbed()
    //   .setTitle('Example Message')
    //   .setDescription('This is an example message with an image and a button.')
    //   .setImage('https://example.com/image.jpg');

    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('left-button')
          .setLabel('←')
          .setStyle('PRIMARY')
      )
      .addComponents(
        new MessageButton()
          .setCustomId('left-fight-button')
          .setLabel('left fighter')
          .setStyle('PRIMARY')
      )
      .addComponents(
        new MessageButton()
          .setCustomId('right-fight-button')
          .setLabel('right fighter')
          .setStyle('PRIMARY')
      )
      .addComponents(
        new MessageButton()
          .setCustomId('right-button')
          .setLabel('→')
          .setStyle('PRIMARY')
      );

    await interaction.reply({
      embeds: [this.buildBetEmbed(event.fights[this.currentBetIndex], event.imgUrl)],
      components: [row],
    });

    //await interaction.reply({ embeds: [this.buildBetEmbed(event, link)] });
  }

  public handleInteraction(interaction: Interaction): void {
    if (interaction.isCommand()) {
      const { commandName } = interaction;

      this.handleCommand(interaction, commandName);
    } else if (interaction.isSelectMenu()) {
      this.handleSelectMenu(interaction, interaction.customId);
    } 
    else if (interaction.isButton()) {
      this.handleButton(interaction, interaction.customId);
    } else {
      return;
    }
  }
}
