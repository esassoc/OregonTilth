declare var window: any;

export class DynamicEnvironment {
    private _production: boolean;

    constructor(_production: boolean){
        this._production = _production
    }

    public get production() {
        if (window.config) {
            return window.config.production;
        } else return this._production;
    }

    public get staging() {
        return window.config.staging;
    }

    public get dev() {
        return window.config.dev;
    }

    public get apiHostName() {
        return window.config.apiHostName;
    }

    public get geoserverMapServiceUrl() {
        return window.config.geoserverMapServiceUrl;
    }

    public get auth0(): { domain: string, clientId: string, audience: string } {
        return window.config.auth0;
    }

    public get platformLongName(){
        return window.config.platformLongName;
    }

    public get platformShortName(){
        return window.config.platformShortName;
    }

    public get leadOrganizationLongName(){
        return window.config.leadOrganizationLongName;
    }

    public get leadOrganizationHomeUrl(){
        return window.config.leadOrganizationHomeUrl;
    }

    public get appInsightsInstrumentationKey() {
        return window.config.appInsightsInstrumentationKey;
    }
}
