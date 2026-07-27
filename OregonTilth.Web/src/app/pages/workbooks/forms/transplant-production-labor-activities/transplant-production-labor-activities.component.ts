import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { UserDetailedDto } from 'src/app/shared/models';
import { CustomRichTextType } from 'src/app/shared/models/enums/custom-rich-text-type.enum';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { WorkbookService } from 'src/app/services/workbook/workbook.service';
import { WorkbookDto } from 'src/app/shared/models/generated/workbook-dto';
import { ColDef } from 'ag-grid-community';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { FieldLaborActivityDto } from 'src/app/shared/models/generated/field-labor-activity-dto';
import { FieldLaborActivityCreateDto } from 'src/app/shared/models/forms/field-labor-activities/field-labor-activity-create-dto';
import { FieldLaborActivityCategoryDto } from 'src/app/shared/models/generated/field-labor-activity-category-dto';
import { LookupTablesService } from 'src/app/services/lookup-tables/lookup-tables.service';
import { forkJoin, Subscription } from 'rxjs';
import { ButtonRendererComponent } from 'src/app/shared/components/ag-grid/button-renderer/button-renderer.component';
import { TransplantProductionLaborActivityCreateDto } from 'src/app/shared/models/forms/transplant-production-labor-activities/transplant-production-labor-activity-create-dto';
import { TransplantProductionLaborActivityDto } from 'src/app/shared/models/generated/transplant-production-labor-activity-dto';
import { EditableRendererComponent } from 'src/app/shared/components/ag-grid/editable-renderer/editable-renderer.component';
import { AgGridAngular } from 'ag-grid-angular';
import { UtilityFunctionsService } from 'src/app/services/utility-functions.service';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';

@Component({
  selector: 'transplant-production-labor-activities',
  templateUrl: './transplant-production-labor-activities.component.html',
  styleUrls: ['./transplant-production-labor-activities.component.scss']
})
export class TransplantProductionLaborActivitiesComponent implements OnInit {
  @ViewChild('transplantProductionLaborActivitiesGrid') transplantProductionLaborActivitiesGrid: AgGridAngular;
  constructor(private cdr: ChangeDetectorRef, 
    private authenticationService: AuthenticationService, 
    private workbookService: WorkbookService,
    private lookupTablesService: LookupTablesService,
    private alertService: AlertService,
    private utilityFunctionsService: UtilityFunctionsService, 
    private breadcrumbService: BreadcrumbsService,
    private router: Router,
    private route: ActivatedRoute) { }

  private gridApi: any;
  private watchUserChangeSubscription: any;
  private currentUser: UserDetailedDto;
  public workbook: WorkbookDto;
  public richTextTypeID : number = CustomRichTextType.TPLaborActivityForm;
  public isLoadingSubmit: boolean = false;
  private workbookID: number;
  private getWorkbookRequest: any;
  private addTransplantProductionLaborActivityRequest: any;
  public model: TransplantProductionLaborActivityCreateDto;

  public getTransplantProductionLaborActivitiesRequest: any;
  public transplantProductionLaborActivities: TransplantProductionLaborActivityDto[];

  private updateTransplantProductionLaborActivityRequest: any;
  private deleteTransplantProductionLaborActivityRequest: any;

  public columnDefs: ColDef[];
 
  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      this.route.params.subscribe(params => {
        this.workbookID = parseInt(params['workbookID']);
        this.model = new TransplantProductionLaborActivityCreateDto({WorkbookID: this.workbookID});
      
        this.refreshData();
      });
      

    });
  }

  private refreshData() {
    this.getWorkbookRequest = this.workbookService.getWorkbook(this.workbookID);
    this.getTransplantProductionLaborActivitiesRequest = this.workbookService.getTransplantProductionLaborActivities(this.workbookID);

    forkJoin<[WorkbookDto, TransplantProductionLaborActivityDto[]]>([this.getWorkbookRequest, this.getTransplantProductionLaborActivitiesRequest]).subscribe(([workbook, fieldLaborActivities]: [WorkbookDto, TransplantProductionLaborActivityDto[]]) => {
      this.workbook = workbook;
      this.breadcrumbService.setBreadcrumbs([{label:'Workbooks', routerLink:['/workbooks']},{label:workbook.WorkbookName, routerLink:['/workbooks',workbook.WorkbookID.toString()]}, {label:'Transplant Production Labor Activities'}]);

      this.transplantProductionLaborActivities = fieldLaborActivities;
      this.defineColumnDefs();
      this.cdr.markForCheck();
    });
  }

  defineColumnDefs() {
    var componentScope = this;
    this.columnDefs = [
      {
        headerName: 'TP Labor Activity', 
        field: 'TransplantProductionLaborActivityName',
        editable: true,
        cellEditor: 'agTextCellEditor',
        cellRendererFramework: EditableRendererComponent,
        sortable: true, 
        filter: true,
        resizable: true
      },
      {
        headerName: 'Delete', field: 'TransplantProductionLaborActivityID', valueGetter: function (params: any) {
          return { ButtonText: 'Delete', CssClasses: "btn btn-fresca btn-sm", PrimaryKey: params.data.TransplantProductionLaborActivityID, ObjectDisplayName: params.data.TransplantProductionLaborActivityName };
        }, cellRendererFramework: ButtonRendererComponent,
        cellRendererParams: { 
          clicked: function(field: any) {
            if(confirm(`Are you sure you want to delete the ${field.ObjectDisplayName} TP Labor Activity?`)) {
              componentScope.deleteTransplantProductionLaborActivity(field.PrimaryKey)
            }
          }
          },
        sortable: true, filter: true, width: 100, resizable: true
      },
    ]
  }

  deleteTransplantProductionLaborActivity(fieldLaborActivityID: number) {
    this.deleteTransplantProductionLaborActivityRequest = this.workbookService.deleteTransplantProductionLaborActivity(this.workbookID, fieldLaborActivityID).subscribe(transplantProductionLaborActivityDtos => {
      this.transplantProductionLaborActivities = transplantProductionLaborActivityDtos;
      this.alertService.pushAlert(new Alert("Successfully deleted Transplant Production Labor Activity", AlertContext.Success));
      this.cdr.detectChanges();
    }, error => {

    })
  }

  onCellValueChanged(data: any) {
    var dtoToPost = data.data;

    this.updateTransplantProductionLaborActivityRequest = this.workbookService.updateTransplantProductionLaborActivity(dtoToPost).subscribe(fieldLaborActivity => {
      data.node.setData(fieldLaborActivity);
      this.gridApi.flashCells({
        rowNodes: [data.node],
        columns: [data.column],
      });
      this.isLoadingSubmit = false;
    }, error => {
      this.refreshData();
      this.isLoadingSubmit = false;
      this.cdr.detectChanges();
    })

  }

  private routeSubscription : Subscription = Subscription.EMPTY;
 ngOnDestroy(){
    this.routeSubscription.unsubscribe()
    this.watchUserChangeSubscription.unsubscribe();
    if (this.getWorkbookRequest && this.getWorkbookRequest.unsubscribe) {
      this.getWorkbookRequest.unsubscribe();
    }
    if (this.addTransplantProductionLaborActivityRequest && this.addTransplantProductionLaborActivityRequest.unsubscribe) {
      this.addTransplantProductionLaborActivityRequest.unsubscribe();
    }
    if (this.getTransplantProductionLaborActivitiesRequest && this.getTransplantProductionLaborActivitiesRequest.unsubscribe) {
      this.getTransplantProductionLaborActivitiesRequest.unsubscribe();
    }
    
    if (this.updateTransplantProductionLaborActivityRequest && this.updateTransplantProductionLaborActivityRequest.unsubscribe) {
      this.updateTransplantProductionLaborActivityRequest.unsubscribe();
    }
    if (this.deleteTransplantProductionLaborActivityRequest && this.deleteTransplantProductionLaborActivityRequest.unsubscribe) {
      this.deleteTransplantProductionLaborActivityRequest.unsubscribe();
    }
    
    this.cdr.detach();
  }

  onSubmit(fieldLaborActivityForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;
    this.addTransplantProductionLaborActivityRequest = this.workbookService.addTransplantProductionLaborActivity(this.model).subscribe(response => {
      this.isLoadingSubmit = false;
      var transactionRows = this.gridApi.applyTransaction({add: [response]});
      this.gridApi.flashCells({ rowNodes: transactionRows.add });
      this.resetForm();
      this.cdr.detectChanges();
      
    }, error => { 
      this.isLoadingSubmit = false;
      this.cdr.detectChanges();
    });
  }

  resetForm() {
    this.model = new TransplantProductionLaborActivityCreateDto({WorkbookID: this.workbookID});
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  public exportToCsv() {
    let columnsKeys = this.transplantProductionLaborActivitiesGrid.columnApi.getAllDisplayedColumns(); 
    let columnIds: Array<any> = []; 
    columnsKeys.forEach(keys => 
      { 
        let columnName: string = keys.getColId(); 
        columnIds.push(columnName); 
      });
    columnIds.splice(-1, 1); // remove the delete column from the download
    this.utilityFunctionsService.exportGridToCsv(this.transplantProductionLaborActivitiesGrid, 'Transplant-Production-Labor-Activities.csv', columnIds);
  }  
}

