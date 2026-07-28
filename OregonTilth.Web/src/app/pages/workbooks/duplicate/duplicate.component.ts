import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ColDef } from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { WorkbookService } from 'src/app/services/workbook/workbook.service';
import { UserDetailedDto } from 'src/app/shared/models';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { CustomRichTextType } from 'src/app/shared/models/enums/custom-rich-text-type.enum';
import { RoleDto } from 'src/app/shared/models/generated/role-dto';
import { WorkbookDto } from 'src/app/shared/models/generated/workbook-dto';
import { AlertService } from 'src/app/shared/services/alert.service';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
import { AlertDisplayComponent } from '../../../shared/components/alert-display/alert-display.component';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'oregontilth-duplicate',
    templateUrl: './duplicate.component.html',
    styleUrls: ['./duplicate.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, NgIf, FormsModule, RouterLink]
})
export class DuplicateComponent implements OnInit {

  constructor(private cdr: ChangeDetectorRef, 
    private authenticationService: AuthenticationService, 
    private workbookService: WorkbookService,
    private alertService: AlertService,
    private breadcrumbService: BreadcrumbsService,
    private router: Router,
    private route: ActivatedRoute) { }

  private watchUserChangeSubscription: any;
  private currentUser: UserDetailedDto;
  public columnDefs: ColDef[];
  public workbook: WorkbookDto;
  public isLoadingSubmit: boolean = false;
  private workbookID: number;
  private getWorkbookRequest: any;

  public duplicateWorkbookRequest: any;
  public workbookCopyName: string;

  onSubmit(duplicateWorkbookForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;

    this.duplicateWorkbookRequest = this.workbookService.duplicateWorkbook(this.workbook.WorkbookID, this.workbookCopyName).subscribe(response => {
      this.isLoadingSubmit = false;
      this.router.navigate(["/workbooks", response.WorkbookID]).then(x => {
        this.alertService.pushAlert(new Alert("Successfully duplicated Workbook.", AlertContext.Success));
      });
    }, error => { 
      this.isLoadingSubmit = false;
      this.cdr.detectChanges();
    });
  }
  private routeSubscription : Subscription = Subscription.EMPTY;
  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;

      this.workbookID = parseInt(this.route.snapshot.paramMap.get("workbookID"));

      this.getWorkbookRequest = this.workbookService.getWorkbook(this.workbookID).subscribe(workbook => {
        this.workbook = workbook;
        this.breadcrumbService.setBreadcrumbs([{label:'Workbooks', routerLink:['/workbooks']},{label:`Duplicate ${workbook.WorkbookName}`}]);

        this.workbookCopyName = workbook.WorkbookName + " (Copy)";
      })
      
    });
  }

  ngOnDestroy() {
    this.watchUserChangeSubscription.unsubscribe();
    if (this.duplicateWorkbookRequest && this.duplicateWorkbookRequest.unsubscribe) {
      this.duplicateWorkbookRequest.unsubscribe();
    }
    if (this.getWorkbookRequest && this.getWorkbookRequest.unsubscribe) {
      this.getWorkbookRequest.unsubscribe();
    }
    
    this.cdr.detach();
  }

}
