import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import IUser from 'src/app/models/user.model';
import { RegisterValidators } from '../validators/register-validators';
import { EmailTaken } from '../validators/email-taken';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  constructor(
    private auth: AuthService,
    private emailTaken: EmailTaken,
    private router: Router
  ) {

  }
  name = new FormControl('', [
    Validators.required,
    Validators.minLength(3)
  ]);
  email = new FormControl('', [
    Validators.required,
    Validators.email
  ], [this.emailTaken.validate]);
  age = new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(18)
  ]);
  password = new FormControl('', [
    Validators.required,
    Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/gm)
  ]);
  confirm_password = new FormControl('', [
    Validators.required,
    Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/gm)
  ]);
  phone_number = new FormControl('', [
    Validators.required,
    Validators.minLength(9),
    Validators.maxLength(9)
  ])
  registerForm = new FormGroup({
    name: this.name,
    email: this.email,
    age: this.age,
    password: this.password,
    confirm_password: this.confirm_password,
    phone_number: this.phone_number
  }, [RegisterValidators.match('password', 'confirm_password')]);
  inSubmission: boolean = false;
  showAlert: boolean = false;
  alertMsg: string = '';
  alertColor: string = '';
  async register() {
    this.inSubmission = true;
    this.showAlert = true;
    this.alertMsg = 'Please wait, your account is being created!';
    this.alertColor = 'blue';
    try {
      await this.auth.createUser(this.registerForm.value as IUser);
    } catch (err) {
      console.log(err);
      this.inSubmission = false;
      this.alertMsg = 'An unexcpeted error ocurred. Try again later';
      this.alertColor = 'red';
      return;
    }
    this.alertMsg = 'Success! Your account has been created.';
    this.alertColor = 'green';
    await this.router.navigateByUrl('/manage');
  }
}
