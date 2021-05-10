import db from '../db';

export const getSignals = () => db.collection('signals').get();
