import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Injectable({
  providedIn: 'root'
})
export class UnauthenticatedAccessGuard  {

  constructor(private authenticationService: AuthenticationService) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // guardInitObservable waits for the Auth0 SDK to finish restoring an existing session before
    // reporting whether the caller is authenticated, so a returning user is not bounced to the
    // login page while their refresh token is still being exchanged.
    return this.authenticationService.guardInitObservable()
      .pipe(
        map(isAuthenticated => {
          if (isAuthenticated) {
            return true;
          }

          this.authenticationService.setAuthRedirectUrl(state.url);
          this.authenticationService.login(state.url);
          return false;
        })
      );
  }
}
