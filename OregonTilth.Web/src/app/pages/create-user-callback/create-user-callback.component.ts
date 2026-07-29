import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
    selector: 'fresca-create-user-callback',
    templateUrl: './create-user-callback.component.html',
    styleUrls: ['./create-user-callback.component.scss'],
    standalone: true
})
export class CreateUserCallbackComponent implements OnInit {

  constructor(private authenticationService:AuthenticationService) { }

  ngOnInit() {
    // Landing page for the "create an account" link in an admin invite email. Auth0 signup and
    // login are a single redirect, so this just sends the visitor to Universal Login with the
    // sign-up screen pre-selected; they come back to the app origin already authenticated.
    this.authenticationService.createAccount();
  }

}
