import { enableProdMode, APP_INITIALIZER, ErrorHandler, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { DecimalPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';

import { environment } from './environments/environment';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { AppInitService, init_app } from './app/app.init';
import { AuthInterceptor } from './app/shared/interceptors/auth-interceptor';
import { HttpErrorInterceptor } from './app/shared/interceptors/httpErrorInterceptor';
import { GlobalErrorHandlerService } from './app/shared/services/global-error-handler.service';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        // Router: the previous RouterModule.forRoot used initialNavigation:
        // 'enabledNonBlocking', which is provideRouter's default, so no feature needed.
        provideRouter(routes),
        provideAnimations(),
        // withInterceptorsFromDi() keeps the two class-based HTTP_INTERCEPTORS below
        // working; they are DI-style interceptors, not functional ones.
        provideHttpClient(withInterceptorsFromDi()),
        provideOAuthClient(),
        // ng2-charts v6+ no longer auto-registers Chart.js controllers/scales the way
        // NgChartsModule did; without this the charts render blank.
        provideCharts(withDefaultRegisterables()),
        // ng-multiselect-dropdown is not standalone and has no provider function, so
        // its NgModule is still bridged in here. Components that use it import the
        // module directly; this covers the root-level forRoot() call.
        importProvidersFrom(NgMultiSelectDropDownModule.forRoot()),
        { provide: TINYMCE_SCRIPT_SRC, useValue: 'assets/tinymce/tinymce.min.js' },
        CookieService,
        AppInitService,
        { provide: APP_INITIALIZER, useFactory: init_app, deps: [AppInitService], multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
        { provide: ErrorHandler, useClass: GlobalErrorHandlerService },
        DecimalPipe, CurrencyPipe, DatePipe,
    ]
})
  .catch(err => console.error(err));
