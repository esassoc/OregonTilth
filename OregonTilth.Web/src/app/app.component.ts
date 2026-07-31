import { Component, Inject, DOCUMENT, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../environments/environment';
import { Router, RouteConfigLoadStart, RouteConfigLoadEnd, NavigationEnd, RouterOutlet } from '@angular/router';
import { BusyService } from './shared/services';
import { AuthenticationService } from './services/authentication.service';
import { Title } from '@angular/platform-browser';
import { HeaderNavComponent } from './shared/components/header-nav/header-nav.component';
import { BreadcrumbsComponent } from './shared/components/breadcrumbs/breadcrumbs.component';
import { SideNavComponent } from './shared/components/side-nav/side-nav.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [HeaderNavComponent, BreadcrumbsComponent, SideNavComponent, RouterOutlet]
})
export class AppComponent {

    public currentYear: number = new Date().getFullYear();

    // Injected here so it is constructed at bootstrap: its constructor is what subscribes to
    // Auth0's user$ stream and kicks off the POST /user-claims upsert.
    private readonly authenticationService = inject(AuthenticationService);

    // currentUserSetObservable stays silent while signed out, so this is undefined until the user
    // has actually been loaded. Gating on it rather than on isAuthenticated() avoids briefly
    // rendering an empty side nav in the window between Auth0 restoring the session and
    // POST /user-claims returning - everything in the nav needs the user anyway.
    private readonly currentUser = toSignal(this.authenticationService.currentUserSetObservable);

    protected readonly showSideNav = computed(() => !!this.currentUser());

    constructor(private router: Router, private busyService: BusyService, private titleService: Title, @Inject(DOCUMENT) private _document: HTMLDocument) {
    }

    ngOnInit() {
        this.router.events.subscribe((event: any) => {
            if (event instanceof RouteConfigLoadStart) { // lazy loaded route started
                this.busyService.setBusy(true);
            } else if (event instanceof RouteConfigLoadEnd) { // lazy loaded route ended
                this.busyService.setBusy(false);
            } else if (event instanceof NavigationEnd) {
                window.scrollTo(0, 0);
            }
        });

        // No OIDC wiring here any more: @auth0/auth0-angular handles the redirect callback,
        // silent/refresh-token renewal and token storage itself, and AuthenticationService
        // reacts to its user$ stream.

        this.titleService.setTitle(`${environment.platformShortName}`)
        this.setAppFavicon();
    }

    setAppFavicon(){
        this._document.getElementById('appFavicon').setAttribute('href', "assets/main/favicons/favicon.ico");
     }

    public leadOrganizationHomeUrl(): string{
        return environment.leadOrganizationHomeUrl;
    }

    public leadOrganizationLogoSrc(): string{
        return `assets/main/logos/oregon-tilth-logo.png`;
    }
}
