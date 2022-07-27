import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Observable, map, delay, filter, switchMap, of } from 'rxjs';
import IUser from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private usersCollection: AngularFirestoreCollection<IUser>;
  public isAuthenticated$: Observable<boolean>;
  public isAuthenticatedWithDelay$: Observable<boolean>;
  private redirect: boolean = false;

  constructor(
    private auth: AngularFireAuth,
    private db: AngularFirestore,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.usersCollection = db.collection('users');
    this.isAuthenticated$ = auth.user.pipe(map((user) => !!user));
    this.isAuthenticatedWithDelay$ = this.isAuthenticated$.pipe(delay(2000));
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => this.route.firstChild),
      switchMap((route) => route?.data ?? of({}))
    ).subscribe((data) => {
      this.redirect = data['authOnly'] ?? false;
    });
  }

  public async createUser(userData: IUser) {
    if (!userData.password) {
      throw new Error('Password not provided!');
    }
    const userCredentials = await this.auth.createUserWithEmailAndPassword(
      userData.email as string,
      userData.password as string
    );
    if (!userCredentials.user) {
      throw new Error('User not found');
    }
    await this.usersCollection.doc(userCredentials.user.uid).set({
      name: userData.name,
      email: userData.email,
      age: userData.age,
      phone_number: userData.phone_number
    });
    await userCredentials.user.updateProfile({
      displayName: userData.name
    });
  }

  public async logout($event?: Event) {
    $event && $event.preventDefault();
    await this.auth.signOut();
    this.redirect && await this.router.navigateByUrl('/');
  }

}
