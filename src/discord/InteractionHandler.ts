import {
  GuildChannelManager,
  Collection,
  CommandInteraction,
  DateResolvable,
  GuildBasedChannel,
  GuildScheduledEventCreateOptions,
  GuildScheduledEventManager,
  GuildVoiceChannelResolvable,
  Interaction,
  MessageEmbed,
  MessageActionRow,
  MessageActionRowComponent,
  MessageSelectMenu,
  MessageSelectOption,
  MessageSelectOptionData,
  SelectMenuInteraction,
  VoiceChannel
} from 'discord.js';
import { Event, parseEvent, parseEvents } from '../services/FightParser';
import Logger from '../services/Logging/Logger';
import UfcService from '../services/UfcService';

export default class InteractionHandler {
  private readonly prefix: string;
  private readonly logger: Logger;
  private readonly dataService: UfcService;

  public constructor(logger: Logger, dataService: UfcService) {
    this.logger = logger;
    this.dataService = dataService;

    this.buildFightEmbed = this.buildFightEmbed.bind(this);
    this.handleCommand = this.handleCommand.bind(this);
    this.handleSelectMenu = this.handleSelectMenu.bind(this);
    this.getFightLinks = this.getFightLinks.bind(this);
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

    event.fights.forEach((fight) => {
      embed.addField(
        fight.weightClass || 'Unknown',
        `${fight.redCorner.rank} ${fight.redCorner.name}\nvs.\n${fight.blueCorner.rank} ${fight.blueCorner.name}`,
        true
      );
    });

    return embed;
  }

  private async handleCommand(
    interaction: CommandInteraction,
    command: string
  ): Promise<void> {
    this.logger.info(`Processing command - ${command}`);

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
      default:
        this.logger.info(`Command not supported - ${command}`);
        break;
    }
  }

  private async handleSelectMenu(
    interaction: SelectMenuInteraction,
    menuId: string
  ): Promise<void> {
    this.logger.info(`Processing menu - ${menuId}`);

    switch (menuId) {
      case 'event-channel':
        this.handleEventChannel(interaction);
        break;
      default:
        this.logger.info(`Menu not supported - ${menuId}`);
        break;
    }
  }

  private async getFightLinks(): Promise<string[]> {
    try {
      const eventHtml = await this.dataService.fetchEvents();
      const links = parseEvents(eventHtml);
      return links;
    } catch (error) {
      this.logger.error(
        `Failed retrieving events from UFC website - ${error.message}`
      );
      return [];
    }
  }

  private async handleFights(interaction: CommandInteraction): Promise<void> {
    const links = await this.getFightLinks();
    interaction.reply(links.join('\n'));
  }

  private async handleFight(interaction: CommandInteraction): Promise<void> {
    const links = await this.getFightLinks();

    if (links.length === 0) {
      interaction.channel.send('Failed retriving event information from UFC');
      return;
    }

    const [link] = links;

    const eventHtml = await this.dataService.fetchData<string>(link);

    const event: Event = parseEvent(eventHtml);

    await interaction.reply({ embeds: [this.buildFightEmbed(event, link)] });
  }

  private async handleFightEvent(interaction: CommandInteraction): Promise<void> {


    const channels: GuildChannelManager = interaction.guild.channels;

    var msg: MessageActionRow = new MessageActionRow();
    var iteration = 1;
    var menu: MessageSelectMenu = new MessageSelectMenu();
    menu.setCustomId("event-channel");
    for (let [id, channel] of channels.cache.entries()) {
      this.logger.debug(`id: ${id.toString()} name: ${channel.name}`);
      menu.addOptions([
        {
          label: channel.name,
          value: id.toString(),
          emoji: `${iteration}:one`,
        },
      ]);
    }

    msg.addComponents(menu)

    await interaction.reply({
      content: "Please select the channel for the event",
      components: [msg]
    });
  }
  private async handleEventChannel(interaction: SelectMenuInteraction): Promise<void> {
    const startTime = new Date();
    startTime.setFullYear(2022, 2, 4);
    startTime.setHours(8);

    this.logger.debug(`interaction.message: ${interaction.message}`)
    this.logger.debug(`interaction.locale: ${interaction.locale}`)
    for (let value of interaction.values)
    {
      this.logger.debug(`value: ${value}`)
    }
    this.logger.debug(`pop value: ${interaction.values.pop()}`)  

    //const eventCreateOptions: GuildScheduledEventCreateOptions = {
    //  name: "Event 1",
    //  scheduledStartTime: startTime,
    //  privacyLevel: "GUILD_ONLY",
    //  entityType: "VOICE",
    //  channel: channelId,
    //};

    //interaction.guild.scheduledEvents.create(eventCreateOptions);
  }

  public handleInteraction(interaction: Interaction): void {
    if (interaction.isCommand()) {
      const { commandName } = interaction;

      this.handleCommand(interaction, commandName);
    } else if (interaction.isSelectMenu()) {

      this.handleSelectMenu(interaction, interaction.customId);
    } else {
      return;
    }
  }
}
