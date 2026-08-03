import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, race, ReplaySubject, Subject } from 'rxjs';
import { first, map, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService as Auth0Service, GenericError } from '@auth0/auth0-angular';
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
          // Internal state is cleared so isAuthenticated() is correct, but deliberately NOT
          // pushed onto the subject. currentUserSetObservable only ever emitted a loaded user
          // under Keystone - it stayed silent while signed out - and 43 components subscribe to
          // it and immediately use the value. Emitting null here makes every one of them run
          // their "user is ready" path with no user, which is how anonymous page loads ended up
          // firing authenticated API calls.
          this.claimsUser = null;
          this.currentUser = null;
        }
      });

    // Auth0 reports a refused sign-in here instead of throwing: a post-login Action calling
    // api.access.deny() (this tenant gates on a verified email), a blocked user and a declined
    // consent all arrive as an error$ emission while user$ stays null. The SDK navigates to its
    // errorPath and drops the ?error=...&error_description=... query string on the way, so
    // without this the visitor lands on the home page with nothing to explain why they are still
    // signed out. The SDK backs error$ with a ReplaySubject(1), so subscribing here - after it
    // has already handled the redirect - still sees the error.
    this.auth0.error$
      .pipe(takeUntil(this._destroying$))
      .subscribe(error => this.onAuth0Error(error));
  }

  // Not failures worth interrupting anyone over: the SDK raises these while probing for an
  // existing session at startup, and anonymous visitors are free to read the public pages. The
  // hidden side nav and the Sign In button already convey that nobody is signed in.
  private static readonly SignedOutErrorCodes = ['login_required', 'missing_refresh_token'];

  private static readonly Auth0ErrorAlertCode = 'Auth0Error';

  private onAuth0Error(error: Error) {
    const code = (error as GenericError)?.error;
    if (!code || AuthenticationService.SignedOutErrorCodes.includes(code)) {
      return;
    }

    // AlertDisplayComponent sits inside each page component and clears the queue in its
    // ngOnDestroy, so an alert pushed while the SDK's errorPath navigation is still in flight
    // would be thrown away. Navigating first and pushing in the callback is the ordering
    // onGetUserError already relies on, and since the router runs navigations in sequence,
    // awaiting ours also waits out the SDK's.
    this.router.navigate(['/']).then(() => {
      // error_description is authored in the tenant's Action - "Please verify your email before
      // continuing." - which makes it the most useful thing to show. message covers errors the
      // SDK raises itself, which carry no description.
      const description = (error as GenericError)?.error_description || error?.message;
      this.alertService.pushAlert(new Alert(
        description || 'We could not sign you in. Please try again.',
        AlertContext.Danger,
        true,
        AuthenticationService.Auth0ErrorAlertCode));
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
