import { gotScraping } from 'got-scraping';
import Logger from './Logging/Logger';

// sharp's package.json points TS at its ESM type declarations even
// under CommonJS module resolution, which don't match its actual
// callable CJS export - a packaging mismatch, not a runtime issue.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');

// Discord's event cover banner displays at 16:9. UFC's source art is
// cropped tighter than that (3:2), and Discord's own crop to fit cuts
// into fighters' faces, which sit near the top of the frame. Crop to
// 16:9 ourselves first, anchored to the top, so there's nothing left
// for Discord's crop to cut into.
const TARGET_ASPECT_RATIO = 16 / 9;

export default class UfcService {
  private readonly logger: Logger;
  private static readonly EVENTS_URL = 'https://www.ufc.com/events';

  public constructor(logger: Logger) {
    this.logger = logger;

    this.fetchData = this.fetchData.bind(this);
    this.fetchEvents = this.fetchEvents.bind(this);
    this.fetchImage = this.fetchImage.bind(this);
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

  public async fetchImage(url: string): Promise<Buffer | undefined> {
    try {
      // UFC's CDN serves WebP for this URL by default (based on the
      // Accept header got-scraping's browser impersonation sends), even
      // though the URL ends in .jpg. Discord's scheduled-event image
      // field needs a format it actually supports (JPEG/PNG/GIF), so
      // explicitly exclude next-gen formats to force a real JPEG back.
      const raw = (await gotScraping(url, {
        headers: { accept: 'image/jpeg,image/png,image/gif,*/*' },
      }).buffer()) as unknown as Buffer;

      const image = sharp(raw);
      const { width, height } = await image.metadata();

      if (!width || !height) {
        return raw;
      }

      const targetHeight = Math.round(width / TARGET_ASPECT_RATIO);
      if (targetHeight >= height) {
        return raw;
      }

      return await image
        .extract({ left: 0, top: 0, width, height: targetHeight })
        .toBuffer();
    } catch (error) {
      this.logger.error(error.message);
      return undefined;
    }
  }
}
