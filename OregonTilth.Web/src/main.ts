import { enableProdMode, ErrorHandler, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { DecimalPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { authHttpInterceptorFn, provideAuth0 } from '@auth0/auth0-angular';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

import { environment } from './environments/environment';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { HttpErrorInterceptor } from './app/shared/interceptors/httpErrorInterceptor';
import { GlobalErrorHandlerService } from './app/shared/services/global-error-handler.service';

declare var window: any;

// AG Grid v33+ requires modules to be registered explicitly; nothing renders without
// this. AllCommunityModule pulls in every community feature, matching the pre-v31
// behaviour where the whole community bundle was always available.
ModuleRegistry.registerModules([AllCommunityModule]);

// Runtime config (served by OregonTilth.Web/Startup.cs from env vars / the helm configmap)
// used to be fetched in an APP_INITIALIZER. provideAuth0() needs domain/clientId/audience at
// provider-construction time, which happens *before* initializers run, so the fetch has to be
// awaited here instead - see AUTH0_MIGRATION_PLAN.md D1.
async function loadRuntimeConfig(): Promise<void> {
    const response = await fetch('assets/config.json');
    window.config = await response.json();
}

(async () => {
    await loadRuntimeConfig();

    if (environment.production) {
        enableProdMode();
    }

    await bootstrapApplication(AppComponent, {
        providers: [
            // Router: the previous RouterModule.forRoot used initialNavigation:
            // 'enabledNonBlocking', which is provideRouter's default, so no feature needed.
            provideRouter(routes),
            provideAnimations(),
            provideAuth0({
                domain: environment.auth0.domain,
                clientId: environment.auth0.clientId,
                authorizationParams: {
                    redirect_uri: window.location.origin,
                    audience: environment.auth0.audience,
                    scope: 'openid profile email offline_access',
                },
                useRefreshTokens: true,
                cacheLocation: 'localstorage',
                httpInterceptor: {
                    // Only requests to our own API get an Authorization header; geoserver/WFS and
                    // the static assets/config.json fetch must stay anonymous.
                    // allowAnonymous keeps the request going out without a token when nobody is
                    // signed in (rather than failing it) - the API has genuinely anonymous
                    // endpoints, e.g. GET customRichText/{id} on the logged-out home page. This
                    // matches what the old cookie-reading AuthInterceptor did.
                    allowedList: [
                        {
                            uriMatcher: (uri: string) => uri.startsWith(`https://${environment.apiHostName}`),
                            allowAnonymous: true,
                        },
                    ],
                },
            }),
            // withInterceptorsFromDi() keeps the class-based HTTP_INTERCEPTORS below working;
            // authHttpInterceptorFn is the functional interceptor from @auth0/auth0-angular that
            // attaches the access token to everything matching the allowedList above.
            provideHttpClient(withInterceptorsFromDi(), withInterceptors([authHttpInterceptorFn])),
            // ng2-charts v6+ no longer auto-registers Chart.js controllers/scales the way
            // NgChartsModule did; without this the charts render blank.
            provideCharts(withDefaultRegisterables()),
            // ng-multiselect-dropdown is not standalone and has no provider function, so
            // its NgModule is still bridged in here. Components that use it import the
            // module directly; this covers the root-level forRoot() call.
            importProvidersFrom(NgMultiSelectDropDownModule.forRoot()),
            { provide: TINYMCE_SCRIPT_SRC, useValue: 'assets/tinymce/tinymce.min.js' },
            { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
            { provide: ErrorHandler, useClass: GlobalErrorHandlerService },
            DecimalPipe, CurrencyPipe, DatePipe,
        ]
    });
})()
    .catch(err => console.error(err));
