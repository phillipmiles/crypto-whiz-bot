type TimeDeliminator = 'minutes';

export const secondsTo = (duration: number, type: TimeDeliminator): number => {
  if (type === 'minutes') {
    return duration * 60;
  } else {
    throw new Error('Unrecognised time deliminator.');
  }
};
