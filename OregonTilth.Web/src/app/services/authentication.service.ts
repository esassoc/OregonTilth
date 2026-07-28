import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { UserService } from './user/user.service';
import { UserDetailedDto } from '../shared/models';
import { Observable, race, ReplaySubject, Subject } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { CookieStorageService } from '../shared/services/cookies/cookie-storage.service';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { RoleEnum } from '../shared/models/enums/role.enum';
import { AlertService } from '../shared/services/alert.service';
import { Alert } from '../shared/models/alert';
import { AlertContext } from '../shared/models/enums/alert-context.enum';
import { UserCreateDto } from '../shared/models/user/user-create-dto';
import { environment } from 'src/environments/environment';
import { UserDto } from '../shared/models/generated/user-dto';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private currentUser: UserDetailedDto;

  private getUserObservable: any;
  private handlingError: boolean = false;

  private _currentUserSetSubject = new ReplaySubject<UserDetailedDto>();
  public currentUserSetObservable = this._currentUserSetSubject.asObservable();


  constructor(private router: Router,
    private oauthService: OAuthService,
    private cookieStorageService: CookieStorageService,
    private userService: UserService,
    private alertService: AlertService) {
      this.oauthService.events
      .pipe(filter(e => ['discovery_document_loaded'].includes(e.type)))
      .subscribe(e => { 
        this.checkAuthentication();
      });

    this.oauthService.events
      .pipe(filter(e => ['token_received'].includes(e.type)))
      .subscribe(e => { 
        this.checkAuthentication();
        this.oauthService.loadUserProfile();
      });

    this.oauthService.events
      .pipe(filter(e => ['session_terminated', 'session_error'].includes(e.type)))
      .subscribe(e => this.router.navigateByUrl("/"));
    
  }

  
  
  public initialLoginSequence() {
    this.oauthService.loadDiscoveryDocument()
      .then(() => this.oauthService.tryLogin())
      .then(() => Promise.resolve()).catch(() => {});
  }

  public checkAuthentication() {
    if (this.isAuthenticated() && !this.currentUser) {
      console.log("Authenticated but no user found...");
      var claims = this.oauthService.getIdentityClaims();
      this.getUser(claims);
    }
  }

  public getUser(claims: any) {
    var globalID = claims["sub"];

    this.userService.getUserFromGlobalID(globalID).subscribe(
      result => { this.updateUser(result); },
      error => { this.onGetUserError(error, claims) }
    );
  }

  private onGetUserError(error: any, claims: any) {
    if(this.handlingError) return;
    this.handlingError = true;
    if (error.status !== 404) {
      this.alertService.pushAlert(new Alert("There was an error logging into the application.", AlertContext.Danger));
      this.router.navigate(['/']);
      this.handlingError = false;
    } else {
      this.alertService.clearAlerts();
      const newUser = new UserCreateDto({
        FirstName: claims["given_name"],
        LastName: claims["family_name"],
        Email: claims["email"],
        LoginName: claims["login_name"],
        UserGuid: claims["sub"],
      });

      this.userService.createNewUser(newUser).subscribe(user => {
        this.updateUser(user);
        this.handlingError = false;
      })
    }
  }

  private updateUser(user: UserDetailedDto) {
    this.currentUser = user;

    if (this.isUserRoleDisabled(this.currentUser)) {
      this._currentUserSetSubject.next(this.currentUser);
      return;
    }

    this.userService.getUserFromUserID(this.currentUser.UserID).subscribe(result => {
      this._currentUserSetSubject.next(this.currentUser);
    })
  }

 

  public refreshUserInfo(user: UserDetailedDto) {
    this.updateUser(user);
  }

  public getCurrentUser(): Observable<UserDto> {
    return race(
      new Observable<UserDto>(subscriber => {
        if (this.currentUser) {
          subscriber.next(this.currentUser);
          subscriber.complete();
        }
      }),
      this.currentUserSetObservable.pipe(first())
    );
  }

  public getCurrentUserID(): Observable<number> {
    return race(
      new Observable<number>(subscriber => {
        if (this.currentUser) {
          subscriber.next(this.currentUser.UserID);
          subscriber.complete();
        }
      }),
      this.currentUserSetObservable.pipe(first(), map(
        (user) => user.UserID
      ))
    );
  }

  public isAuthenticated(): boolean {
    return this.oauthService.hasValidAccessToken();
  }

  public login() {
    this.oauthService.initCodeFlow();
  }

  public createAccount() {
    localStorage.setItem("loginOnReturn", "true");
    window.location.href = `${environment.keystoneAuthConfiguration.issuer}/Account/Register?${this.getClientIDAndRedirectUrlForKeystone()}`;
  }

  public getClientIDAndRedirectUrlForKeystone() {
    return `ClientID=${environment.keystoneAuthConfiguration.clientId}&RedirectUrl=${encodeURIComponent(environment.createAccountRedirectUrl)}`;
  }

  public logout() {
    
    this.oauthService.logOut();

  }

  public isUserAnAdministrator(user: UserDetailedDto): boolean {
    const role = user && user.Role
      ? user.Role.RoleID
      : null;
    return role === RoleEnum.Admin;
  }

  public isCurrentUserAnAdministrator(): boolean {
    return this.isUserAnAdministrator(this.currentUser);
  }

  public isUserUnassigned(user: UserDetailedDto): boolean {
    const role = user && user.Role
      ? user.Role.RoleID
      : null;
    return role === RoleEnum.Unassigned;
  }

  public isUserRoleDisabled(user: UserDetailedDto): boolean {
    const role = user && user.Role
      ? user.Role.RoleID
      : null;
    return role === RoleEnum.Disabled;
  }

  public isCurrentUserNullOrUndefined(): boolean {
    return !this.currentUser;
  }

  public hasCurrentUserAcknowledgedDisclaimer(): boolean {
    return this.currentUser != null && this.currentUser.DisclaimerAcknowledgedDate != null;
  }
}
