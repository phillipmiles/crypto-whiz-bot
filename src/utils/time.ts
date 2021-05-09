type TimeDeliminator = 'milliseconds' | 'seconds' | 'minutes';

// Converts duration from type to milliseconds.
export const toMilliseconds = (
  duration: number,
  type: TimeDeliminator,
): number => {
  if (type === 'minutes') {
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
  if (type === 'minutes') {
    return duration * 60;
  } else if (type === 'seconds') {
    return duration;
  } else if (type === 'milliseconds') {
    return duration / 1000;
  } else {
    throw new Error('Unrecognised time deliminator.');
  }
};
