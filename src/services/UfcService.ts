import { gotScraping } from 'got-scraping';
import Logger from './Logging/Logger';

export default class UfcService {
  private readonly logger: Logger;
  private static readonly EVENTS_URL = 'https://www.ufc.com/events';

  public constructor(logger: Logger) {
    this.logger = logger;

    this.fetchData = this.fetchData.bind(this);
    this.fetchEvents = this.fetchEvents.bind(this);
  }

  // ufc.com's bot protection fingerprints the TLS handshake and blocks
  // Node's/curl's default OpenSSL signature with a 403, regardless of
  // headers sent. got-scraping mimics a real browser's TLS/HTTP2
  // fingerprint to get past it.
  public async fetchData<T>(url: string): Promise<T> {
    try {
      const body = await gotScraping(url).text();
      return body as unknown as T;
    } catch (error) {
      this.logger.error(error.message);
      return undefined;
    }
  }

  public async fetchEvents(): Promise<string> {
    return this.fetchData<string>(UfcService.EVENTS_URL);
  }
}
