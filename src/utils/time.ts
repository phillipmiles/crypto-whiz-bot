type TimeDeliminator =
  | 'milliseconds'
  | 'seconds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'years';

// Converts duration from type to milliseconds.
export const toMilliseconds = (
  duration: number,
  type: TimeDeliminator,
): number => {
  if (type === 'years') {
    return duration * 365 * 24 * 60 * 60 * 1000;
  } else if (type === 'weeks') {
    return duration * 7 * 24 * 60 * 60 * 1000;
  } else if (type === 'days') {
    return duration * 24 * 60 * 60 * 1000;
  } else if (type === 'hours') {
    return duration * 60 * 60 * 1000;
  } else if (type === 'minutes') {
    return duration * 60 * 1000;
  } else if (type === 'seconds') {
    return duration * 1000;
  } else if (type === 'milliseconds') {
    return duration;
  } else {
    throw new Error('Unrecognised time deliminator.');
  }
};

// Converts duration from type to seconds.
export const toSeconds = (duration: number, type: TimeDeliminator): number => {
  if (type === 'years') {
    return duration * 365 * 24 * 60 * 60;
  } else if (type === 'weeks') {
    return duration * 7 * 24 * 60 * 60;
  } else if (type === 'days') {
    return duration * 24 * 60 * 60;
  } else if (type === 'hours') {
    return duration * 60 * 60;
  } else if (type === 'minutes') {
    return duration * 60;
  } else if (type === 'seconds') {
    return duration;
  } else if (type === 'milliseconds') {
    return duration / 1000;
  } else {
    throw new Error('Unrecognised time deliminator.');
  }
};

// Converts duration from type to minutes.
export const toMinutes = (duration: number, type: TimeDeliminator): number => {
  if (type === 'years') {
    return duration * 365 * 24 * 60;
  } else if (type === 'weeks') {
    return duration * 7 * 24 * 60;
  } else if (type === 'days') {
    return duration * 24 * 60;
  } else if (type === 'hours') {
    return duration * 60;
  } else if (type === 'minutes') {
    return duration;
  } else if (type === 'seconds') {
    return duration / 60;
  } else if (type === 'milliseconds') {
    return duration / 60 / 1000;
  } else {
    throw new Error('Unrecognised time deliminator.');
  }
};

export const convertRelativeTimeStringToMilliseconds = (
  relativeTimeString: string,
): number | undefined => {
  const [numberStr, timeDef, suffix] = relativeTimeString.split(' ');

  if (suffix !== 'ago') return;

  const num = parseInt(numberStr);
  // console.log(numberStr, num);
  if (
    timeDef === 'sec' ||
    timeDef === 'secs' ||
    timeDef === 'second' ||
    timeDef === 'seconds'
  ) {
    return toMilliseconds(num, 'seconds');
  } else if (
    timeDef === 'min' ||
    timeDef === 'mins' ||
    timeDef === 'minute' ||
    timeDef === 'minutes'
  ) {
    return toMilliseconds(num, 'minutes');
  } else if (timeDef === 'hour' || timeDef === 'hours') {
    return toMilliseconds(num, 'hours');
  } else if (timeDef === 'day' || timeDef === 'days') {
    return toMilliseconds(num, 'days');
  } else if (timeDef === 'week' || timeDef === 'weeks') {
    return toMilliseconds(num, 'weeks');
  } else if (timeDef === 'year' || timeDef === 'years') {
    return toMilliseconds(num, 'years');
  }
};
