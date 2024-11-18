import axios from 'axios';
import { logger } from '../globals'

export default class UfcService {
  private static readonly EVENTS_URL = 'https://www.ufc.com/events';

  public constructor() {

    this.fetchData = this.fetchData.bind(this);
    this.fetchEvents = this.fetchEvents.bind(this);
  }

  public async fetchData<T>(url: string): Promise<T> {
    try {
      const res = await axios.get(url);
      const data: T = res.data;
      return data;
    } catch (error) {
      logger.error(error.message);
      return undefined;
    }
  }

  public async fetchEvents(): Promise<string> {
    return this.fetchData<string>(UfcService.EVENTS_URL);
  }
}
