import firebase from 'firebase';

const manageFilledTrades = async (
  tradeSnapshot: firebase.firestore.DocumentSnapshot,
): Promise<void> => {
  console.log('Manage filled');
};

const manageUnfilledTrades = async (
  tradesRef: firebase.firestore.CollectionReference,
): Promise<void> => {
  const filledTradesSnapshot = await tradesRef
    .where('status', '==', 'filled')
    .get();

  filledTradesSnapshot.forEach(async (doc) => {
    await manageFilledTrades(doc);
    // XXX If market price has shifted to far away - cancel
    // XXX If too much time has passed - cancel

    // XXX Trade that gets filled or even partially filled need to update status to 'filled' i think ?
    // and also need to update remainingSize value on trade to whatever has been filled.
  });
};

export default manageUnfilledTrades;
