import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Injectable } from '@angular/core';
import { AlertService } from '../../services/alert.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { RoleEnum } from '../../models/enums/role.enum';
import { Alert } from '../../models/alert';
@Injectable({
  providedIn: 'root'
})
export class ManagerOnlyGuard  {
  constructor(private router: Router, private alertService: AlertService, private authenticationService: AuthenticationService) {
  }
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (!this.authenticationService.isCurrentUserNullOrUndefined()) {
      if (this.authenticationService.isCurrentUserAnAdministrator()) {
        return true;
      } else {
        this.alertService.pushNotFoundUnauthorizedAlert();
        this.router.navigate(["/"]);
        return false;
      }
    }

    return this.authenticationService.currentUserSetObservable
      .pipe(
        map(x => {
          // Auth0's user$ emits null when nobody is signed in, so the subject can carry null now.
          if (x && x.Role && x.Role.RoleID == RoleEnum.Admin) {
            return true;
          } else {
            this.alertService.pushNotFoundUnauthorizedAlert();
            this.router.navigate(["/"]);
            return false;
          }
        })
      );
  }
}
