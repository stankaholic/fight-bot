import * as Cheerio from 'cheerio';
import { logger } from '../globals';

const baseUrl = 'https://www.ufc.com';

const titleClass = '.c-hero__headline-prefix';
const subtitleClass = '.c-hero__headline.is-large-text';
const dateClass = '.c-hero__headline-suffix';

const weightClass = 'div.c-listing-fight__details > div.c-listing-fight__class';
const oddsClass = '.c-listing-fight__odds';

const fighterClass = '.c-listing-fight__corner-name';
const rankClass = '.c-listing-fight__corner-rank';

const imgClass = '.c-hero__image';

const redCornerImgClass = 'div.c-listing-fight__content-row > div.c-listing-fight__corner--red > div.c-listing-fight__corner-image--red';
const blueCornerImgClass = 'div.c-listing-fight__content-row > div.c-listing-fight__corner--blue > div.c-listing-fight__corner-image--blue';

export interface FightCorner {
  name: string;
  rank: string;
  odds: string;
  imgUrl: string;
}

export interface Fight {
  redCorner: FightCorner;
  blueCorner: FightCorner;
  weightClass: string;
}

export interface Event {
  title: string;
  subtitle: string;
  date: string;
  imgUrl: string;
  fights: Fight[];
}

export const parseEvents = (html: string): string[] => {
  const $ = Cheerio.load(html);

  const links: string[] = [];

  $('.c-card-event--result__headline').map((_index, $el) => {
    const child: Cheerio.Element = $el.firstChild as Cheerio.Element;
    const link = `${baseUrl}${child.attribs['href']}`;
    links.push(link);
  });

  return links;
};

const parseImage = ($: Cheerio.CheerioAPI): string => {
  const imgHero = $(imgClass);
  const img = imgHero.find('img');
  return img?.attr('src') ?? '';
};

const parseCornerImages = ($: Cheerio.CheerioAPI, cornerImgClass: string): string[] => {
  return $(cornerImgClass).map((_, el) => {
    const img = $(el).find('img');
    return img?.attr('src') ?? '';
  }).get();
};

export const parseEvent = (html: string): Event => {
  const $ = Cheerio.load(html);

  const fighters: string[] = $(fighterClass)
    .map((_, el) => $(el).text().trim().replace(/\n/g, ''))
    .get();
  const ranks: string[] = $(rankClass)
    .map((_, el) => $(el).text().trim().replace(/\n/g, ''))
    .get();
  logger.debug(`ranks: ${ranks}`);
  const weightClasses: string[] = $(weightClass)
    .map((_, el) => $(el).text().trim().replace(/\n/g, ''))
    .get();
  const oddsClasses: string[] = $(oddsClass)
    .map((_, el) => $(el).text().trim().replace(/\n/g, ''))
    .get();

  const redCornerImgUrl = parseCornerImages($, redCornerImgClass);
  for (let i = 0; i < redCornerImgUrl.length; i++) {
    logger.debug(`redCornerImgUrl: ${redCornerImgUrl[i]}`);
  }
  const blueCornerImgUrl = parseCornerImages($, blueCornerImgClass);
  for (let i = 0; i < blueCornerImgUrl.length; i++) {
    logger.debug(`blueCornerImgUrl: ${blueCornerImgUrl[i]}`);
  }

  let i = 0;
  const fights: Fight[] = weightClasses.map((weightClass) => {
    const fight: Fight = {
      weightClass: weightClass.replace(/ +/g, ' ').trim(),
      redCorner: {
        name: fighters[i],
        rank: ranks[i * 3], // ranks appear to repeat 3 times
        odds: oddsClasses[i],
        imgUrl: '',
      },
      blueCorner: {
        name: fighters[i + 1],
        rank: ranks[(i * 3) + 1], // ranks appear to repeat 3 times
        odds: oddsClasses[i + 1],
        imgUrl: '',
      },
    };

    i += 2;

    return fight;
  });

  const title = $(titleClass).text().trim().replace(/\n/g, '');
  const subtitle = $(subtitleClass)
    .text()
    .trim()
    .replace(/\n/g, '')
    .replace(/ +/g, ' ');
  const date = $(dateClass).text().trim();
  const imgUrl = parseImage($);

  return {
    title,
    subtitle,
    date,
    fights,
    imgUrl,
  };
};
