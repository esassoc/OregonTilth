import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UserDetailedDto } from 'src/app/shared/models';
import { RoleEnum } from 'src/app/shared/models/enums/role.enum';
import { environment } from 'src/environments/environment';
import { CustomRichTextType } from 'src/app/shared/models/enums/custom-rich-text-type.enum';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
import { AlertDisplayComponent } from '../../../shared/components/alert-display/alert-display.component';
import { NgIf } from '@angular/common';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { CustomRichTextComponent } from '../../../shared/components/custom-rich-text/custom-rich-text.component';

@Component({
    selector: 'app-home-index',
    templateUrl: './home-index.component.html',
    styleUrls: ['./home-index.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, NgIf, NgbAlert, CustomRichTextComponent]
})
export class HomeIndexComponent implements OnInit, OnDestroy {
    public watchUserChangeSubscription: any;
    public currentUser: UserDetailedDto;

    public notLoggedInRichTextID : number = CustomRichTextType.Homepage;
    public loggedInRichTextID : number = CustomRichTextType.HomePageLoggedIn;
    public disabledRichTextID: number = CustomRichTextType.UserDisabled;
    public unassignedRichTextID: number = CustomRichTextType.UserUnassigned;

    public displayNotLoggedInRichTextForAdmin : boolean = false;

    constructor(private authenticationService: AuthenticationService,
        private breadcrumbService: BreadcrumbsService,
    ) {
    }

    public ngOnInit(): void {
        this.breadcrumbService.setBreadcrumbs([{label: "Home"}]);
        if (localStorage.getItem("loginOnReturn")){
            localStorage.removeItem("loginOnReturn");
            this.authenticationService.login();
        }
        this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => { 
            this.currentUser = currentUser;
        });
    }

    ngOnDestroy(): void {
      this.watchUserChangeSubscription.unsubscribe();
    }

    public userIsUnassigned(){
        if (!this.currentUser){
            return false; // doesn't exist != unassigned
        }
        
        return this.currentUser.Role.RoleID === RoleEnum.Unassigned;
    }

    public userRoleIsDisabled(){
        if (!this.currentUser){
            return false; // doesn't exist != unassigned
        }
        
        return this.currentUser.Role.RoleID === RoleEnum.Disabled;
    }

    public userRoleIsEnabled() {
        if (!this.currentUser){
            return false; // doesn't exist != unassigned
        }
        
        return this.currentUser.Role.RoleID === RoleEnum.Admin || this.currentUser.Role.RoleID == RoleEnum.Normal;
    }

    public userRoleIsAdmin() {
        if (!this.currentUser){
            return false; // doesn't exist != unassigned
        }
        
        return this.currentUser.Role.RoleID === RoleEnum.Admin;
    }

    public isUserAnAdministrator(){
        return this.authenticationService.isUserAnAdministrator(this.currentUser);
    }

    public login(): void {
        this.authenticationService.login();
    }

    public createAccount(): void{
        this.authenticationService.createAccount();
    }

    public forgotPasswordUrl() :string{
        return `${environment.keystoneSupportBaseUrl}/ForgotPassword`;
    }

    public forgotUsernameUrl() :string{
        return `${environment.keystoneSupportBaseUrl}/ForgotUsername`;
    }

    public keystoneSupportUrl():string{
        return `${environment.keystoneSupportBaseUrl}/Support/20`;
    }

    public platformLongName():string{
        return environment.platformLongName;
    }

    public platformShortName():string{
        return environment.platformShortName;
    }

    public leadOrganizationLongName(): string{
        return environment.leadOrganizationLongName;
    }

    public leadOrganizationHomeUrl(): string{
        return environment.leadOrganizationHomeUrl;
    }
}
