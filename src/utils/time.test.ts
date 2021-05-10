import { convertRelativeTimeStringToMilliseconds } from './time';

describe('Time Util', () => {
  // Seconds
  test('Convert 1 second relative time string to milliseconds', async () => {
    const time = convertRelativeTimeStringToMilliseconds('1 second ago');
    expect(time).toBe(1000);
  });
  test('Convert many seconds relative time string to milliseconds', async () => {
    const time = convertRelativeTimeStringToMilliseconds('45 second ago');
    expect(time).toBe(45000);
  });
  // Minutes
  test('Convert 1 minute relative time string to milliseconds', async () => {
    const time = convertRelativeTimeStringToMilliseconds('1 min ago');
    expect(time).toBe(60000);
  });
  test('Convert many minutes relative time string to milliseconds', async () => {
    const time = convertRelativeTimeStringToMilliseconds('45 mins ago');
    expect(time).toBe(2700000);
  });
  // Hours
  test('Convert 1 hour relative time string to milliseconds', async () => {
    const time = convertRelativeTimeStringToMilliseconds('1 hour ago');
    expect(time).toBe(3600000);
  });
  test('Convert many hours relative time string to milliseconds', async () => {
    const time = convertRelativeTimeStringToMilliseconds('45 hours ago');
    expect(time).toBe(162000000);
  });
  // Days
  test('Convert 1 day relative time string to milliseconds', async () => {
    const time = convertRelativeTimeStringToMilliseconds('1 day ago');
    expect(time).toBe(86400000);
  });
  test('Convert many days relative time string to milliseconds', async () => {
    const time = convertRelativeTimeStringToMilliseconds('45 days ago');
    expect(time).toBe(3888000000);
  });
  // Weeks
  test('Convert 1 week relative time string to milliseconds', async () => {
    const time = convertRelativeTimeStringToMilliseconds('1 week ago');
    expect(time).toBe(604800000);
  });
  test('Convert many weeks relative time string to milliseconds', async () => {
    const time = convertRelativeTimeStringToMilliseconds('45 weeks ago');
    expect(time).toBe(27216000000);
  });
  // Years
  test('Convert 1 year relative time string to milliseconds', async () => {
    const time = convertRelativeTimeStringToMilliseconds('1 year ago');
    expect(time).toBe(31536000000);
  });
  test('Convert many years relative time string to milliseconds', async () => {
    const time = convertRelativeTimeStringToMilliseconds('45 years ago');
    expect(time).toBe(1419120000000);
  });
});
