import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UserDetailedDto } from 'src/app/shared/models';
import { CustomRichTextType } from 'src/app/shared/models/enums/custom-rich-text-type.enum';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { DatePipe, DecimalPipe } from '@angular/common';
import { WorkbookService } from 'src/app/services/workbook/workbook.service';
import { WorkbookDto } from 'src/app/shared/models/generated/workbook-dto';
import { ColDef } from 'ag-grid-community';
import { LinkRendererComponent } from 'src/app/shared/components/ag-grid/link-renderer/link-renderer.component';
import { ButtonRendererComponent } from 'src/app/shared/components/ag-grid/button-renderer/button-renderer.component';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { AlertService } from 'src/app/shared/services/alert.service';
import { Router, RouterLink } from '@angular/router';
import { GridService } from 'src/app/shared/services/grid/grid.service';
import { FieldDefinitionGridHeaderComponent } from 'src/app/shared/components/field-definition-grid-header/field-definition-grid-header.component';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
import { AlertDisplayComponent } from '../../shared/components/alert-display/alert-display.component';
import { CustomRichTextComponent } from '../../shared/components/custom-rich-text/custom-rich-text.component';
import { AgGridModule } from 'ag-grid-angular';

@Component({
    selector: 'workbooks',
    templateUrl: './workbooks.component.html',
    styleUrls: ['./workbooks.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, RouterLink, CustomRichTextComponent, AgGridModule]
})
export class WorkbooksComponent implements OnInit {

  constructor(private cdr: ChangeDetectorRef, 
    private authenticationService: AuthenticationService, 
    private datePipe: DatePipe,
    private workbookService: WorkbookService,
    private alertService: AlertService,
    private gridService: GridService,
    private breadcrumbService: BreadcrumbsService,
    private router: Router) { }

  private watchUserChangeSubscription: any;
  private currentUser: UserDetailedDto;
  public columnDefs: ColDef[];
  public richTextTypeID : number = CustomRichTextType.Workbooks;
  
  private getWorkbooksRequest: any;
  public workbooks: WorkbookDto[];

  private deleteWorkbookRequest: any;

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([{label: "Workbooks"}]);
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      var workbookComponentScope = this;

      this.refreshData();

      let _datePipe = this.datePipe;
      this.columnDefs = [
        {
          headerName: 'Workbook Name',
          field: 'WorkbookName',
          valueGetter: function (params: any) {
            return { LinkValue: params.data.WorkbookID, LinkDisplay: params.data.WorkbookName };
          }, cellRendererFramework: LinkRendererComponent,
          cellRendererParams: { inRouterLink: "/workbooks/" },
          filterValueGetter: function (params: any) {
            return params.data.WorkbookName;
          },
          comparator: function (id1: any, id2: any) {
            let link1 = id1.LinkDisplay;
            let link2 = id2.LinkDisplay;
            if (link1 < link2) {
              return -1;
            }
            if (link1 > link2) {
              return 1;
            }
            return 0;
          },
          sortable: true, filter: true, width: 170
        },
        {
          headerComponentFramework: FieldDefinitionGridHeaderComponent, headerComponentParams: {fieldDefinitionType: 'AverageHourlyWage'},
          cellEditor: 'agTextCellEditor',
          field: 'AverageHourlyWage',
          valueFormatter: this.gridService.currencyFormatter,
          sortable: true, filter: true, width: 160,
          cellClass: 'not-editable'
        },
        {
          headerComponentFramework: FieldDefinitionGridHeaderComponent, headerComponentParams: {fieldDefinitionType: 'StandardUnitOfSpaceLength'}, 
          cellEditor: 'agTextCellEditor',
          field: 'StandardUnitOfSpaceLength',
          sortable: true, filter: true, width: 200,
          cellClass: 'not-editable'
        },
        {
          headerComponentFramework: FieldDefinitionGridHeaderComponent, headerComponentParams: {fieldDefinitionType: 'StandardUnitOfSpaceWidth'}, 
          cellEditor: 'agTextCellEditor',
          field: 'StandardUnitOfSpaceWidth',
          sortable: true, filter: true, width: 200,
          cellClass: 'not-editable'
        },
        {
          headerName: 'Create Date', field: 'CreateDate', valueFormatter: function (params) {
            return _datePipe.transform(params.value, "M/d/yyyy")
          },
          filterValueGetter: function (params: any) {
            return _datePipe.transform(params.data.Date, "M/d/yyyy");
          },
          filterParams: {
            // provide comparator function
            comparator: function (filterLocalDate, cellValue) {
              var dateAsString = cellValue;
              if (dateAsString == null) return -1;
              var cellDate = Date.parse(dateAsString);
              const filterLocalDateAtMidnight = filterLocalDate.getTime();
              if (filterLocalDateAtMidnight == cellDate) {
                return 0;
              }
              if (cellDate < filterLocalDateAtMidnight) {
                return -1;
              }
              if (cellDate > filterLocalDateAtMidnight) {
                return 1;
              }
            }
          },
          comparator: function (id1: any, id2: any) {
            if (id1 < id2) {
              return -1;
            }
            if (id1 > id2) {
              return 1;
            }
            return 0;
          },
          sortable: true, filter: 'agDateColumnFilter', width: 145,
          cellClass: 'not-editable'
        },
        {
          headerName: 'Delete', field: 'WorkbookID', valueGetter: function (params: any) {
            return { ButtonText: 'Delete', CssClasses: "btn btn-fresca btn-sm", PrimaryKey: params.data.WorkbookID, ObjectDisplayName: params.data.WorkbookName };
          }, cellRendererFramework: ButtonRendererComponent,
          cellRendererParams: { 
            clicked: function(field: any) {
              if(confirm(`Are you sure you want to delete the ${field.ObjectDisplayName} Workbook?`)) {
                workbookComponentScope.deleteWorkbook(field.PrimaryKey)
              }
            }
           },
          sortable: true, filter: true, width: 100
        },
        {
          headerName: 'Edit', field: 'WorkbookID', valueGetter: function (params: any) {
            return { ButtonText: 'Edit', CssClasses: "btn btn-fresca btn-sm", PrimaryKey: params.data.WorkbookID, ObjectDisplayName: params.data.WorkbookName };
          }, cellRendererFramework: ButtonRendererComponent,
          cellRendererParams: { 
            clicked: function(field: any) {
              workbookComponentScope.router.navigateByUrl(`/workbooks/${field.PrimaryKey}/edit`).then(x => {
                
              });
            }
           },
          sortable: true, filter: true, width: 100
        },
        {
          headerName: 'Duplicate', 
          valueGetter: function (params: any) {
            return { ButtonText: 'Duplicate', CssClasses: "btn btn-fresca btn-sm", PrimaryKey: params.data.WorkbookID, ObjectDisplayName: params.data.WorkbookName };
          }, cellRendererFramework: ButtonRendererComponent,
          cellRendererParams: { 
            clicked: function(field: any) {
                workbookComponentScope.router.navigateByUrl(`/workbooks/${field.PrimaryKey}/duplicate`).then(x => {
              });
            }
           },
          sortable: true, filter: true, width: 125
        }
      ];
        
      this.columnDefs.forEach(x => {
        x.resizable = true;
      });

    });
  }

  ngOnDestroy() {
    if (this.watchUserChangeSubscription && this.watchUserChangeSubscription.unsubscribe) {
      this.watchUserChangeSubscription.unsubscribe();
    }

    if (this.getWorkbooksRequest && this.getWorkbooksRequest.unsubscribe) {
      this.getWorkbooksRequest.unsubscribe();
    }

    if (this.deleteWorkbookRequest && this.deleteWorkbookRequest.unsubscribe) {
      this.deleteWorkbookRequest.unsubscribe();
    }
    this.cdr.detach();
  }

  refreshData(){
    this.getWorkbooksRequest = this.workbookService.getWorkbooks(this.currentUser).subscribe(workbooks => {
      this.workbooks = workbooks;
    });
  }

  deleteWorkbook(workbookID: number) {
    this.deleteWorkbookRequest = this.workbookService.deleteWorkbook(workbookID).subscribe(results => {
      this.refreshData();
      this.alertService.pushAlert(new Alert("Successfully deleted Workbook", AlertContext.Success));
    })
  }
}
