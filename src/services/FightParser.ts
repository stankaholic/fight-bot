import * as Cheerio from 'cheerio';

const baseUrl = 'https://www.ufc.com';

const titleClass = '.c-hero__headline-prefix';
const subtitleClass = '.c-hero__headline.is-large-text';
const dateClass = '.c-hero__headline-suffix';

const weightClass = 'div.c-listing-fight__details > div.c-listing-fight__class';
const oddsClass = '.c-listing-fight__odds';

const fighterClass = '.c-listing-fight__corner-name';
const rankClass = '.c-listing-fight__corner-rank';

const imgClass = '.c-hero__image';

const earlyPrelimsTimeClass = '.field--name-fight-card-time-early';
const prelimsTimeClass = '.field--name-fight-card-time-prelims';
const mainCardTimeClass = '.field--name-fight-card-time-main';
const broadcasterTimeClass = '.c-event-fight-card-broadcaster__time';

export interface FightCorner {
  name: string;
  rank: string;
  odds: string;
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
  earlyPrelimsTime?: Date;
  prelimsTime?: Date;
  mainCardTime?: Date;
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

// UFC's markup labels the <time datetime="..."> value with a "Z" (UTC)
// suffix, but the value itself is actually US Eastern wall-clock time,
// not true UTC - parsing it directly would be off by several hours.
// The data-timestamp attribute (Unix epoch seconds) on the ancestor
// element is accurate, so use that instead.
const parseSegmentTime = (
  $: Cheerio.CheerioAPI,
  fieldSelector: string
): Date | undefined => {
  const timestamp = $(fieldSelector)
    .closest(broadcasterTimeClass)
    .attr('data-timestamp');
  return timestamp ? new Date(Number(timestamp) * 1000) : undefined;
};

export const parseEvent = (html: string): Event => {
  const $ = Cheerio.load(html);

  const fighters: string[] = $(fighterClass)
    .map((_, el) => $(el).text().trim().replace(/\n/g, ''))
    .get();
  const ranks: string[] = $(rankClass)
    .map((_, el) => $(el).text().trim().replace(/\n/g, ''))
    .get();
  const weightClasses: string[] = $(weightClass)
    .map((_, el) => $(el).text().trim().replace(/\n/g, ''))
    .get();
  const oddsClasses: string[] = $(oddsClass)
    .map((_, el) => $(el).text().trim().replace(/\n/g, ''))
    .get();

  let i = 0;
  const fights: Fight[] = weightClasses.map((weightClass) => {
    const fight: Fight = {
      weightClass: weightClass.replace(/ +/g, ' ').trim(),
      redCorner: {
        name: fighters[i],
        rank: ranks[i],
        odds: oddsClasses[i],
      },
      blueCorner: {
        name: fighters[i + 1],
        rank: ranks[i + 1],
        odds: oddsClasses[i + 1],
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

  const earlyPrelimsTime = parseSegmentTime($, earlyPrelimsTimeClass);
  const prelimsTime = parseSegmentTime($, prelimsTimeClass);
  const mainCardTime = parseSegmentTime($, mainCardTimeClass);

  return {
    title,
    subtitle,
    date,
    fights,
    imgUrl,
    earlyPrelimsTime,
    prelimsTime,
    mainCardTime,
  };
};
