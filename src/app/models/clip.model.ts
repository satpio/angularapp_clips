import firebase from 'firebase/compat/app';

export default interface IClip {
  uid: string,
  displayName: string,
  title: string,
  fileName: string,
  clipUrl: string,
  screenshotUrl: string,
  timestamp: firebase.firestore.FieldValue,
  docId?: string,
  screenshotFileName: string
}