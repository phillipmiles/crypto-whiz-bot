export const subStringBetween = (
  str: string,
  subStrStart: string,
  subStrEnd: string,
): string | undefined => {
  const startStrIndex = str.indexOf(subStrStart);

  if (startStrIndex === -1) return;

  const endStrIndex = str.indexOf(
    subStrEnd,
    startStrIndex + subStrStart.length,
  );

  if (endStrIndex === -1) return;

  return str.substring(startStrIndex + subStrStart.length, endStrIndex);
};
