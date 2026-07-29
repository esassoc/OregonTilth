import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, race, ReplaySubject, Subject } from 'rxjs';
import { first, map, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { UserService } from './user/user.service';
import { UserDetailedDto } from '../shared/models';
import { RoleEnum } from '../shared/models/enums/role.enum';
import { AlertService } from '../shared/services/alert.service';
import { Alert } from '../shared/models/alert';
import { AlertContext } from '../shared/models/enums/alert-context.enum';
import { UserDto } from '../shared/models/generated/user-dto';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService implements OnDestroy {
  private currentUser: UserDetailedDto;
  private claimsUser: any;

  private readonly _destroying$ = new Subject<void>();

  private _currentUserSetSubject = new ReplaySubject<UserDetailedDto>(1);
  public currentUserSetObservable = this._currentUserSetSubject.asObservable();

  constructor(private router: Router,
    private auth0: Auth0Service,
    private userService: UserService,
    private alertService: AlertService) {
    // @auth0/auth0-angular owns the redirect callback, silent refresh and token storage; all we
    // have to do is react to the resulting user stream. user$ emits null when nobody is signed in.
    this.auth0.user$
      .pipe(takeUntil(this._destroying$))
      .subscribe(user => {
        if (user) {
          this.claimsUser = user;
          this.postUser();
        } else {
          this.claimsUser = null;
          this.currentUser = null;
          this._currentUserSetSubject.next(this.currentUser);
        }
      });
  }

  // POST /user-claims upserts the dbo.User row from the access token's claims and returns it.
  // This replaces the old GET /user-claims/{globalID} -> 404 -> POST /users dance.
  private postUser() {
    this.userService.postUserClaims().subscribe(
      result => {
        this.updateUser(result);
        // Used to happen in LoginCallbackComponent, which Auth0 no longer routes through.
        if (result && !this.isUserRoleDisabled(result)) {
          this.userService.updateLastActivityDate(result.UserID).subscribe();
        }
      },
      () => { this.onGetUserError(); }
    );
  }

  private onGetUserError() {
    this.router.navigate(['/']).then(() => {
      this.alertService.pushAlert(new Alert(
        "There was an error authorizing with the application. The application will force log you out in 3 seconds, please try to login again.",
        AlertContext.Danger));
      setTimeout(() => {
        this.auth0.logout({ logoutParams: { returnTo: window.location.origin } });
      }, 3000);
    });
  }

  private updateUser(user: UserDetailedDto) {
    this.currentUser = user;
    this._currentUserSetSubject.next(this.currentUser);
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
      // Optional chaining because the subject now emits null on sign-out, which the old
      // Keystone flow never did.
      this.currentUserSetObservable.pipe(first(), map(
        (user) => user?.UserID
      ))
    );
  }

  public isAuthenticated(): boolean {
    return this.claimsUser != null;
  }

  // Resolves once the Auth0 SDK has finished checking for an existing session, so guards do not
  // bounce a returning user to the login page before their token has been restored.
  public guardInitObservable(): Observable<boolean> {
    return this.auth0.isLoading$.pipe(
      first(loading => loading === false),
      switchMap(() => this.auth0.isAuthenticated$.pipe(first()))
    );
  }

  public login(returnUrl?: string) {
    // appState.target is what @auth0/auth0-angular navigates to after handling the callback.
    this.auth0.loginWithRedirect(returnUrl ? { appState: { target: returnUrl } } : undefined);
  }

  public createAccount() {
    this.auth0.loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } });
  }

  public resetPassword() {
    this.auth0.loginWithRedirect({ authorizationParams: { screen_hint: 'reset-password' } });
  }

  public logout() {
    this.auth0.logout({ logoutParams: { returnTo: window.location.origin } });
  }

  public handleUnauthorized(): void {
    this.forcedLogout();
  }

  public forcedLogout() {
    this.setAuthRedirectUrl(window.location.href);
    this.logout();
  }

  public getAuthRedirectUrl(): string {
    return sessionStorage.authRedirectUrl;
  }

  public setAuthRedirectUrl(url: string) {
    sessionStorage.authRedirectUrl = url;
  }

  public clearAuthRedirectUrl() {
    this.setAuthRedirectUrl("");
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

  ngOnDestroy(): void {
    this._destroying$.next();
    this._destroying$.complete();
  }
}
