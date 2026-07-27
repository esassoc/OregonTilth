import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UserService } from 'src/app/services/user/user.service';

@Component({
    selector: 'fresca-login-callback',
    templateUrl: './login-callback.component.html',
    styleUrls: ['./login-callback.component.scss'],
    standalone: true
})
export class LoginCallbackComponent implements OnInit, OnDestroy {
  private watchUserChangeSubscription: any;
  private updateLastActivityDateRequest: any;

  constructor(private router: Router, private authenticationService: AuthenticationService, private userService: UserService) { }

  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.updateLastActivityDateRequest = this.userService.updateLastActivityDate(currentUser.UserID).subscribe(user => {
        this.router.navigate(['/']);
      });
    });
  }

  ngOnDestroy(): void {
    this.watchUserChangeSubscription.unsubscribe();
    if(this.updateLastActivityDateRequest && this.updateLastActivityDateRequest.unsubscribe){
      this.updateLastActivityDateRequest.unsubscribe();
    }
    
  }
}
