import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { ApiRouteService } from '../api-route/api-route.service';
import { Router } from '@angular/router';
import { Observable, throwError as _throw } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BusyService } from '../busy/busy.service';
import { AlertService } from '../alert.service';
import { Alert } from 'src/app/shared/models/alert';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { AlertContext } from '../../models/enums/alert-context.enum';


@Injectable({
    providedIn: 'root'
})
export class ApiService {

    // AuthenticationService is resolved lazily through the Injector: it depends on UserService,
    // which depends on this service, so injecting it directly would be a DI cycle.
    constructor(private busyService: BusyService, private apiRoute: ApiRouteService, private http: HttpClient, private alertService: AlertService, private injector: Injector, private router: Router, ) {
    }

    postToApi(relativeRoute: string, data: any): Observable<any> {

        this.busyService.setBusy(true);

        if (relativeRoute.startsWith('/')) {
            relativeRoute = relativeRoute.substring(1, relativeRoute.length);
        }

        data = JSON.parse(JSON.stringify(data, this.requestCleaner));

        const baseRoute = this.apiRoute.getRoute();
        const route = `${baseRoute}/${relativeRoute}`;

        return this.http.post(route, data)
            .pipe(
                map((response: any) => {
                    return this.handleResponse(response);
                }),
                catchError((error: any) => {
                    return this.handleError(error);
                })
            );
    }

    getFromApi(relativeRoute: string): Observable<any> {

        this.busyService.setBusy(true);

        if (relativeRoute.startsWith('/')) {
            relativeRoute = relativeRoute.substring(1, relativeRoute.length);
        }

        const baseRoute = this.apiRoute.getRoute();
        const route = `${baseRoute}/${relativeRoute}`;
        const result = this.http.get(route)
            .pipe(
                map((response: any) => {
                    return this.handleResponse(response);
                }),
                catchError((error: any) => {
                    return this.handleError(error);
                })
            );
        return result;
    }

    putToApi(relativeRoute: string, data: any): Observable<any> {

        this.busyService.setBusy(true);

        if (relativeRoute.startsWith('/')) {
            relativeRoute = relativeRoute.substring(1, relativeRoute.length);
        }

        data = JSON.parse(JSON.stringify(data, this.requestCleaner));

        const baseRoute = this.apiRoute.getRoute();
        const route = `${baseRoute}/${relativeRoute}`;

        return this.http.put(route, data)
            .pipe(
                map((response: any) => {
                    return this.handleResponse(response);
                }),
                catchError((error: any) => {
                    return this.handleError(error);
                })
            );
    }

    deleteToApi(relativeRoute: string): Observable<any> {

        this.busyService.setBusy(true);
        if (relativeRoute.startsWith('/')) {
            relativeRoute = relativeRoute.substring(1, relativeRoute.length);
        }
        const baseRoute = this.apiRoute.getRoute();
        const route = `${baseRoute}/${relativeRoute}`;

        return this.http.delete(route)
            .pipe(
                map((response: any) => {
                    return this.handleResponse(response);
                }),
                catchError((error: any) => {
                    return this.handleError(error);
                })
            );
    }



    handleResponse(response: any): Observable<any> {
        this.busyService.setBusy(false);
        return response;
    }

    private handleError(error: any, supressErrorMessage = false, clearBusyGlobally = true): Observable<any> {
        if (clearBusyGlobally) {
            this.busyService.setBusy(false);
        }
        if (!supressErrorMessage) {
            if (error && (error.status === 401)) {
                this.alertService.pushAlert(new Alert("Access token expired..."));
                this.injector.get(AuthenticationService).forcedLogout();
            } else if (error && (error.status === 403)) {
                this.alertService.pushNotFoundUnauthorizedAlert();
                this.router.navigate(["/"]);
            } else if (error.error && typeof error.error === 'string') {
                this.alertService.pushNotFoundUnauthorizedAlert();
                var newAlert = new Alert(error.error);
                newAlert.uniqueCode = error.error;
                this.alertService.pushAlert(newAlert);
            } else if (error.error && error.status === 404) {
                // let the caller handle not found appropriate to whatever it was doing
            } else if (error.error.errors) {
                for (const key of Object.keys(error.error.errors)) {
                    
                    const newLocal = new Alert((error.error.errors[key] as string[]).map((fe: string) => { return key + ": " + fe; }).join(","));
                    newLocal.uniqueCode = key + error.error.errors[key];
                    this.alertService.pushAlert(newLocal);
                }
            } else if (error.error && !(error.error instanceof ProgressEvent)) {
                for (const key of Object.keys(error.error)) {
                    // FIXME: will break if errror.error[key] is not a string[]
                    const newLocal = new Alert((error.error[key] as string[]).map((fe: string) => { return key + ": " + fe; }).join(","));
                    newLocal.uniqueCode = key + error.error[key];
                    this.alertService.pushAlert(newLocal);
                }
            } else {
                this.alertService.pushAlert(new Alert("Oops! Something went wrong and we couldn't complete the action..."));
            }
        }

        return _throw(error);
    }

    private requestCleaner(name: string, val: any) {
        if ((name || '').toString().indexOf('$') === 0) {
            return undefined; // remove from data
        } else {
            return val; // return as is
        }
    }
}
