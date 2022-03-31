export default class Environment {
  private static readonly env: NodeJS.ProcessEnv = process.env;

  public static readonly DISCORD_TOKEN: string = Environment.env.DISCORD_TOKEN || '';;
  public static readonly PAPERTRAIL_API_TOKEN: string = Environment.env.PAPERTRAIL_API_TOKEN || '';
  public static readonly NODE_ENV: string = Environment.env.NODE_ENV || 'development';
  public static readonly LOGGING_LEVEL: string = Environment.env.LOGGING_LEVEL || 'info';
  public static readonly CLIENT_ID: string = Environment.env.CLIENT_ID || '';
  public static readonly GUILD_ID: string = Environment.env.GUILD_ID || '';
}
