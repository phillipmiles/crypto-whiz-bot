import firebase from '../../../services/firebase';

const auth = firebase.auth();

export const signInWithEmailAndPassword = (email: string, password: string) =>
  firebase.auth().signInWithEmailAndPassword(email, password);

export const signOut = () => auth.signOut();

export const currentUser = () => firebase.auth().currentUser;

export const reloadUser = (): any => {
  if (auth.currentUser) {
    return auth.currentUser.reload();
  }
  return;
};
