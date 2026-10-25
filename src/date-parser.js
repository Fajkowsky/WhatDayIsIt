const MONTHS_EN = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  sept: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const MONTHS_PL = {
  stycznia: 0,
  lutego: 1,
  marca: 2,
  kwietnia: 3,
  maja: 4,
  czerwca: 5,
  lipca: 6,
  sierpnia: 7,
  września: 8,
  października: 9,
  listopada: 10,
  grudnia: 11,
  styczeń: 0,
  luty: 1,
  marzec: 2,
  kwiecień: 3,
  maj: 4,
  czerwiec: 5,
  lipiec: 6,
  sierpień: 7,
  wrzesień: 8,
  październik: 9,
  listopad: 10,
  grudzień: 11,
  sty: 0,
  lut: 1,
  mar: 2,
  kwi: 3,
  cze: 5,
  lip: 6,
  sie: 7,
  wrz: 8,
  paź: 9,
  lis: 10,
  gru: 11,
};

function makeDate(year, month, day) {
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day)
    return null;
  return date;
}

function parseDate(dateStr, locale = 'en') {
  const str = dateStr.trim();
  const lower = str.toLocaleLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const relative = {
    today: 0,
    dzisiaj: 0,
    dziś: 0,
    tomorrow: 1,
    jutro: 1,
    yesterday: -1,
    wczoraj: -1,
  };
  if (Object.hasOwn(relative, lower)) {
    today.setDate(today.getDate() + relative[lower]);
    return today;
  }

  let match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return makeDate(+match[1], +match[2] - 1, +match[3]);

  match = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (match) {
    const [, firstText, secondText, yearText] = match;
    const first = +firstText;
    const second = +secondText;
    let year = +yearText;
    if (year < 100) year += 2000;
    let day;
    let month;
    if (first > 12) {
      day = first;
      month = second;
    } else if (second > 12) {
      month = first;
      day = second;
    } else if (str.includes('.')) {
      day = first;
      month = second;
    } else if (locale.toLowerCase().startsWith('pl')) {
      day = first;
      month = second;
    } else {
      month = first;
      day = second;
    }
    return makeDate(year, month - 1, day);
  }

  const enMonths = Object.entries(MONTHS_EN).sort(([a], [b]) => b.length - a.length);
  for (const [name, month] of enMonths) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const monthToken = `${escaped}\\.?`;
    match = str.match(
      new RegExp(`^${monthToken}\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})$`, 'i')
    );
    if (match) return makeDate(+match[2], month, +match[1]);
    match = str.match(new RegExp(`^(\\d{1,2})(?:st|nd|rd|th)?\\s+${monthToken}\\s+(\\d{4})$`, 'i'));
    if (match) return makeDate(+match[2], month, +match[1]);
    match = str.match(new RegExp(`^${monthToken}\\s+(\\d{1,2})(?:st|nd|rd|th)?$`, 'i'));
    if (match) return makeDate(today.getFullYear(), month, +match[1]);
  }

  const plMonths = Object.entries(MONTHS_PL).sort(([a], [b]) => b.length - a.length);
  for (const [name, month] of plMonths) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    match = str.match(new RegExp(`^(\\d{1,2})\\s+${escaped}\\.?\\s+(\\d{4})$`, 'i'));
    if (match) return makeDate(+match[2], month, +match[1]);
    match = str.match(new RegExp(`^(\\d{1,2})\\s+${escaped}\\.?$`, 'i'));
    if (match) return makeDate(today.getFullYear(), month, +match[1]);
  }
  return null;
}

export { parseDate };
