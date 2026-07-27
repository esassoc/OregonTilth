import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UserDetailedDto } from 'src/app/shared/models';
import { CustomRichTextType } from 'src/app/shared/models/enums/custom-rich-text-type.enum';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UtilityFunctionsService } from 'src/app/services/utility-functions.service';
import { UserService } from 'src/app/services/user/user.service';
import { DatePipe, DecimalPipe, NgIf } from '@angular/common';
import { WorkbookService } from 'src/app/services/workbook/workbook.service';
import { WorkbookDto } from 'src/app/shared/models/generated/workbook-dto';
import { ColDef } from 'ag-grid-community';
import { LinkRendererComponent } from 'src/app/shared/components/ag-grid/link-renderer/link-renderer.component';
import { RoleDto } from 'src/app/shared/models/generated/role-dto';
import { AlertService } from 'src/app/shared/services/alert.service';
import { Router, RouterLink } from '@angular/router';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
import { WorkbookCreatedService } from 'src/app/shared/services/workbook-created.service';
import { AlertDisplayComponent } from '../../../shared/components/alert-display/alert-display.component';
import { CustomRichTextComponent } from '../../../shared/components/custom-rich-text/custom-rich-text.component';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'new-workbook',
    templateUrl: './new-workbook.component.html',
    styleUrls: ['./new-workbook.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, CustomRichTextComponent, NgIf, FormsModule, RouterLink]
})
export class NewWorkbookComponent implements OnInit {

  constructor(private cdr: ChangeDetectorRef, 
    private authenticationService: AuthenticationService, 
    private workbookService: WorkbookService,
    private alertService: AlertService,
    private workbookCreatedService: WorkbookCreatedService,
    private breadcrumbService: BreadcrumbsService,
    private router: Router) { }

  private watchUserChangeSubscription: any;
  private currentUser: UserDetailedDto;
  public columnDefs: ColDef[];
  public richTextTypeID : number = CustomRichTextType.WorkbookAddEdit;
  public model: WorkbookDto;
  public roles: Array<RoleDto>;
  public isLoadingSubmit: boolean = false;
  
  public createWorkbookRequest: any;

  onSubmit(editUserForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;

    this.createWorkbookRequest = this.workbookService.createWorkbook(this.model).subscribe(response => {
      this.isLoadingSubmit = false;
      this.router.navigate(["/workbooks", response.WorkbookID]).then(x => {
        this.workbookCreatedService.setWorkbookCreated(response);
        this.alertService.pushAlert(new Alert("Successfully created Workbook.", AlertContext.Success));
      });
    }, error => { 
      this.isLoadingSubmit = false;
      this.cdr.detectChanges();
    });
  }

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([{label: "Workbooks", routerLink: ["/workbooks"]}, {label: "New Workbook"}]);
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      this.model = new WorkbookDto();
    });
  }

  ngOnDestroy() {
    this.watchUserChangeSubscription.unsubscribe();
    if (this.createWorkbookRequest && this.createWorkbookRequest.unsubscribe) {
      this.createWorkbookRequest.unsubscribe();
    }
    
    
    this.cdr.detach();
  }

}
