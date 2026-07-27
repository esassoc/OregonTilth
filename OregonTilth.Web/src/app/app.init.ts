import { Injectable } from '@angular/core';;
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
declare var window: any;

@Injectable()
export class AppInitService {

  // This is the method you want to call at bootstrap
  // Important: It should return a Promise
  public init() {
    return from(
        fetch('assets/config.json').then(function(response) {
          return response.json();
        })
      ).pipe(
        map((config) => {
        config.keystoneAuthConfiguration.redirectUri = window.location.origin + config.keystoneAuthConfiguration.redirectUriRelative;
        config.keystoneAuthConfiguration.postLogoutRedirectUri = window.location.origin + config.keystoneAuthConfiguration.postLogoutRedirectUri
        window.config = config;
        return;
      })).toPromise();
  }
}

// APP_INITIALIZER factory. Lived in app.module.ts until that module was removed as
// part of the standalone migration; it belongs next to the service it initialises.
export function init_app(appLoadService: AppInitService) {
  return () => appLoadService.init().then(() => {

  });
}