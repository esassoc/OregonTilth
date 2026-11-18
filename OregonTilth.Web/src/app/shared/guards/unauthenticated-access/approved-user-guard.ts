import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from "rxjs";
import { map, take } from "rxjs/operators";
import { Injectable } from '@angular/core';
import { AlertService } from '../../services/alert.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { RoleEnum } from '../../models/enums/role.enum';
import { UserDetailedDto } from '../../models';

/**
 * Lets Admin and Normal users through; Unassigned and Disabled users go back to the home page,
 * which shows them their waiting or disabled message. Pair it with UnauthenticatedAccessGuard,
 * which handles signing in.
 */
@Injectable({
  providedIn: 'root'
})
export class ApprovedUserGuard  {
  constructor(private router: Router, private alertService: AlertService, private authenticationService: AuthenticationService) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // A ReplaySubject(1): replays the loaded user, or waits for POST /user-claims to return.
    return this.authenticationService.currentUserSetObservable
      .pipe(take(1), map(user => this.allow(user)));
  }

  private allow(user: UserDetailedDto): boolean {
    const roleID = user?.Role?.RoleID;
    if (roleID === RoleEnum.Admin || roleID === RoleEnum.Normal) {
      return true;
    }

    this.alertService.pushNotFoundUnauthorizedAlert();
    this.router.navigate(["/"]);
    return false;
  }
}
