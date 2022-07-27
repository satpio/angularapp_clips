import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, DocumentReference, QuerySnapshot } from '@angular/fire/compat/firestore';
import IClip from '../models/clip.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { of, switchMap, map, Observable } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ClipService implements Resolve<IClip | null> {

  public clipsCollection: AngularFirestoreCollection<IClip>;
  pageClips: IClip[] = [];
  pendingRequest: boolean = false;

  constructor(
    private db: AngularFirestore,
    private auth: AngularFireAuth,
    private storage: AngularFireStorage,
    private router: Router
  ) {
    this.clipsCollection = db.collection('clips');
  }

  createClip(data: IClip): Promise<DocumentReference<IClip>> {
    return this.clipsCollection.add(data);
  }

  public getUserClips() {
    return this.auth.user.pipe(
      switchMap((user) => {
        if (!user) {
          return of([])
        }
        const query = this.clipsCollection.ref.where('uid', '==', user.uid);
        return query.get();
      }),
      map((snapshot) => (snapshot as QuerySnapshot<IClip>).docs)
    );
  }

  updateClip(id: string, title: string) {
    return this.clipsCollection.doc(id).update({
      title
    });
  }

  async deleteClipt(clip: IClip) {
    const clipRef = this.storage.ref(`clips/${clip.fileName}`);
    const screenshotRef = this.storage.ref(`screenshots/${clip.screenshotFileName}`);
    await clipRef.delete();
    await screenshotRef.delete();
    await this.clipsCollection.doc(clip.docId).delete();
  }

  async getClips() {
    if (this.pendingRequest) {
      return;
    }
    this.pendingRequest = true;
    let query = this.clipsCollection.ref.orderBy('timestamp', 'desc').limit(3);
    const { length } = this.pageClips;
    if (length) {
      const lastDocId = this.pageClips[length - 1].docId;
      const lastDoc = await this.clipsCollection.doc(lastDocId).get().toPromise();
      query = query.startAfter(lastDoc);
    }
    const snapshot = await query.get();
    snapshot.forEach((doc) => {
      this.pageClips.push({
        docId: doc.id,
        ...doc.data()
      })
    })
    this.pendingRequest = false;
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.clipsCollection.doc(route.params['id']).get().pipe(
      map((snapshot) => {
        const data = snapshot.data();
        if (!data) {
          this.router.navigate(['/']);
          return null;
        }
        return data;
      })
    );
  }

}
