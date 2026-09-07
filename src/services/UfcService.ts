import { execFile } from 'child_process';
import { promisify } from 'util';
import Logger from './Logging/Logger';

const execFileAsync = promisify(execFile);

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export default class UfcService {
  private readonly logger: Logger;
  private static readonly EVENTS_URL = 'https://www.ufc.com/events';

  public constructor(logger: Logger) {
    this.logger = logger;

    this.fetchData = this.fetchData.bind(this);
    this.fetchEvents = this.fetchEvents.bind(this);
  }

  // Node's TLS fingerprint gets blocked (403) by ufc.com's bot protection
  // regardless of headers sent, so we shell out to curl instead of axios.
  public async fetchData<T>(url: string): Promise<T> {
    try {
      const { stdout } = await execFileAsync('curl', [
        '-sS',
        '-f',
        '-A',
        USER_AGENT,
        url,
      ]);
      return stdout as unknown as T;
    } catch (error) {
      this.logger.error(error.message);
      return undefined;
    }
  }

  public async fetchEvents(): Promise<string> {
    return this.fetchData<string>(UfcService.EVENTS_URL);
  }
}
