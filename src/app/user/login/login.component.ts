import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

interface ICredentials {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  credentials: ICredentials = {
    email: '',
    password: ''
  }

  constructor(
    private auth: AngularFireAuth,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  inSubmission: boolean = false;
  showAlert: boolean = false;
  alertMsg: string = '';
  alertColor: string = '';

  async login() {
    this.inSubmission = true;
    this.showAlert = true;
    this.alertMsg = 'Please wait, we are checking your creditentials!';
    this.alertColor = 'blue';
    try {
      await this.auth.signInWithEmailAndPassword(
        this.credentials.email,
        this.credentials.password
      );
    } catch (err) {
      console.log(err);
      this.inSubmission = false;
      this.alertMsg = 'An unexcpeted error ocurred. Try again later.';
      this.alertColor = 'red';
      return;
    }
    this.alertMsg = 'Success! You are now logged in.';
    this.alertColor = 'green';
    await this.router.navigateByUrl('/manage');
  }

}
