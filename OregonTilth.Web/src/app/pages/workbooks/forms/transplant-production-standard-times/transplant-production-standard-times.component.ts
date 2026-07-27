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
import { forkJoin, Subscription } from 'rxjs';
import { LookupTablesService } from 'src/app/services/lookup-tables/lookup-tables.service';
import { TimeStudyCellRendererComponent } from 'src/app/shared/components/ag-grid/time-study-cell-renderer/time-study-cell-renderer.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TimeStudyModal } from 'src/app/shared/components/ag-grid/time-study-modal/time-study-modal.component';
import { DecimalEditor } from 'src/app/shared/components/ag-grid/decimal-editor/decimal-editor.component';
import { TransplantProductionLaborActivityDto } from 'src/app/shared/models/generated/transplant-production-labor-activity-dto';
import { TransplantProductionTrayTypeDto } from 'src/app/shared/models/generated/transplant-production-tray-type-dto';
import { TransplantProductionStandardTimeCreateDto } from 'src/app/shared/models/forms/transplant-production-standard-times/transplant-production-standard-time-create-dto';
import { TransplantProductionStandardTimeSummaryDto } from 'src/app/shared/models/forms/transplant-production-standard-times/transplant-production-standard-time-summary-dto';
import { UtilityFunctionsService } from 'src/app/services/utility-functions.service';
import { AgGridAngular } from 'ag-grid-angular';
import { EditableRendererComponent } from 'src/app/shared/components/ag-grid/editable-renderer/editable-renderer.component';
import { ButtonRendererComponent } from 'src/app/shared/components/ag-grid/button-renderer/button-renderer.component';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';

@Component({
  selector: 'transplant-production-standard-times',
  templateUrl: './transplant-production-standard-times.component.html',
  styleUrls: ['./transplant-production-standard-times.component.scss']
})
export class TransplantProductionStandardTimesComponent implements OnInit {

  @ViewChild('upsertAllocationPlan') upsertEntity: any;
  @ViewChild('timeStudyModal') timeStudyModalEntity: any;
  @ViewChild('tpStandardTimesGrid') tpStandardTimesGrid: AgGridAngular;

  constructor(private cdr: ChangeDetectorRef, 
    private authenticationService: AuthenticationService, 
    private workbookService: WorkbookService,
    private lookupTablesService: LookupTablesService,
    private utilityFunctionsService: UtilityFunctionsService,
    private alertService: AlertService,
    private breadcrumbService: BreadcrumbsService,
    private route: ActivatedRoute,
    private modalService: NgbModal) { }

  private gridApi: any;
  private watchUserChangeSubscription: any;
  private currentUser: UserDetailedDto;
  public workbook: WorkbookDto;
  public richTextTypeID : number = CustomRichTextType.TPStandardTimesForm;
  public isLoadingSubmit: boolean = false;
  private workbookID: number;
  private getWorkbookRequest: any;

  public model: TransplantProductionStandardTimeCreateDto;

  public getTransplantProductionStandardTimesRequest: any;
  public transplantProductionStandardTimes: TransplantProductionStandardTimeSummaryDto[];

  public getTransplantProductionLaborActivitiesRequest: any;
  public transplantProductionLaborActivities: TransplantProductionLaborActivityDto[];

  public getTransplantProductionTrayTypesRequest: any;
  public trayTypes: TransplantProductionTrayTypeDto[];

  public columnDefs: ColDef[];

  public initializeStandardTimeRequest: any;
 
  public modalReference: NgbModalRef;
  public closeResult: string;

  public updateStandardTimeRequest: any;
  private deleteStandardTimeRequest: any;
  
  getRowNodeId(data)  {
    return data.TransplantProductionStandardTimeID.toString();
  }
  
  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      this.route.params.subscribe(params => {
        this.workbookID = parseInt(params['workbookID']);
        this.refreshData();
      });
      
      

    });
  }
  private refreshData() {
    this.getWorkbookRequest = this.workbookService.getWorkbook(this.workbookID);
    this.getTransplantProductionStandardTimesRequest = this.workbookService.getTransplantProductionStandardTimes(this.workbookID);
    this.getTransplantProductionLaborActivitiesRequest = this.workbookService.getTransplantProductionLaborActivities(this.workbookID);
    this.getTransplantProductionTrayTypesRequest = this.workbookService.getTransplantProductionTrayTypes(this.workbookID);

    forkJoin<[WorkbookDto, TransplantProductionStandardTimeSummaryDto[], TransplantProductionLaborActivityDto[], TransplantProductionTrayTypeDto[]]>(
      [
        this.getWorkbookRequest,
        this.getTransplantProductionStandardTimesRequest,
        this.getTransplantProductionLaborActivitiesRequest,
        this.getTransplantProductionTrayTypesRequest,
      ]).subscribe((
        [
          workbook,
          transplantProductionStandardTimeDtos,
          transplantProductionLaborActivityDtos,
          transplantProductionTrayTypeDtos,
        ]: [
            WorkbookDto,
            TransplantProductionStandardTimeSummaryDto[],
            TransplantProductionLaborActivityDto[],
            TransplantProductionTrayTypeDto[]
          ]) => {
        this.workbook = workbook;
        this.breadcrumbService.setBreadcrumbs([{label:'Workbooks', routerLink:['/workbooks']},{label:workbook.WorkbookName, routerLink:['/workbooks',workbook.WorkbookID.toString()]}, {label:'Transplant Production Time Studies'}]);
        this.transplantProductionStandardTimes = transplantProductionStandardTimeDtos;

        this.transplantProductionLaborActivities = transplantProductionLaborActivityDtos;
        this.trayTypes = transplantProductionTrayTypeDtos;


        this.defineColumnDefs();
        this.cdr.markForCheck();
      });

    this.model = new TransplantProductionStandardTimeCreateDto({ WorkbookID: this.workbookID });
  }

  onSubmit(fieldLaborActivityForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;


    this.initializeStandardTimeRequest = this.workbookService.initializeTransplantProductionTimeStudy(this.model).subscribe(response => {
      var transactionRows = this.gridApi.applyTransaction({add: [response] });
      this.gridApi.flashCells({ rowNodes: transactionRows.add });
      this.isLoadingSubmit = false;
      
      this.resetForm();
      this.cdr.detectChanges();
      
    }, error => { 
      this.isLoadingSubmit = false;
      this.cdr.detectChanges();
    });

  }


  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  defineColumnDefs() {
    var componentScope = this;
    this.columnDefs = [
      {
        headerName: 'TP Labor Activity', 
        field: 'TransplantProductionLaborActivity',
        valueFormatter: function (params) {
          return params.value ? params.value : '';
        },
        valueSetter: params => {
          params.data.TransplantProductionLaborActivity = this.transplantProductionLaborActivities.find(element => {
            return element.TransplantProductionLaborActivityName == params.newValue;
          });
          return true;
        },
        valueGetter: params => {
          return params.data.TransplantProductionLaborActivity ? params.data.TransplantProductionLaborActivity.TransplantProductionLaborActivityName : '';
        },
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: this.transplantProductionLaborActivities.map(x => x.TransplantProductionLaborActivityName)
        },
        cellRendererFramework: EditableRendererComponent,
        editable:true,
        sortable: true, 
        filter: true,
        resizable: true,
        width:150
      },
      {
        headerName: 'TP Tray Type', 
        field: 'TrayType',
        valueFormatter: function (params) {
          return params.value ? params.value : '';
        },
        valueSetter: params => {
          params.data.TransplantProductionTrayType = this.trayTypes.find(element => {
            return element.TransplantProductionTrayTypeName == params.newValue;
          });
          return true;
        },
        valueGetter: params => {
          return params.data.TransplantProductionTrayType ? params.data.TransplantProductionTrayType.TransplantProductionTrayTypeName : '';
        },
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: this.trayTypes.map(x => x.TransplantProductionTrayTypeName)
        },
        cellRendererFramework: EditableRendererComponent,
        editable:true,
        sortable: true, 
        filter: true,
        resizable: true,
        width:150
      },
      {
        headerName: 'Avg Min Per Tray', 
        valueGetter: function(params:any) {
          if(params.data.TimeStudies.length > 0) {
            var avgArray = params.data.TimeStudies.map(element => {
                return {
                    x: element.Duration / element.Units
                };
            });
            var sumOfAvgs = avgArray.map(element => element.x).reduce((a, b) => a + b, 0)
            var avgOfAvgs = sumOfAvgs / avgArray.length;
            return avgOfAvgs.toFixed(4);
          }
          return 'N/A';
        },
        sortable: true, 
        resizable: true,
        filter: true
      },
      {
        headerName: 'Standard Rate', 
        field:'StandardTimePerUnit',
        valueGetter: function(params:any) {
          var number = parseFloat(params.data.StandardTimePerUnit);
          return number ? number.toFixed(4) : null
        },
        editable: true,
        cellEditorFramework: DecimalEditor,
        sortable: true, 
        filter: true,
        cellStyle: params => {
          if (params.value) {
              return { backgroundColor: '#ccf5cc'};
          } 
          return {backgroundColor: '#ffdfd6'};
        },
        cellRendererFramework: EditableRendererComponent,
        width:150
      },
      {
        headerName: 'Time Study Progress', 
        field: 'TimeStudies',
        valueGetter: function (params: any) {
          var downloadDisplay = TimeStudyCellRendererComponent.downloadDisplay(params.data)
          return { TransplantProductionStandardTime: params.data, count: params.data.TimeStudies.length, DownloadDisplay: downloadDisplay };
        }, 
        cellRendererFramework: TimeStudyCellRendererComponent,
        cellRendererParams: { 
          clicked: function(data: any) {
            componentScope.launchModal(TimeStudyModal, 'Transplant Production Time Studies', data.TransplantProductionStandardTime);
          }
        },
        sortable: false, 
        filter: true,
        resizable: false,
        width:300
      },
      {
        headerName: 'Delete', valueGetter: function (params: any) {
          return { ButtonText: 'Delete', CssClasses: "btn btn-fresca btn-sm", PrimaryKey: params.data.TransplantProductionStandardTimeID, ObjectDisplayName: null };
        }, cellRendererFramework: ButtonRendererComponent,
        cellRendererParams: { 
          clicked: function(field: any) {
            if(confirm(`Are you sure you want to delete this record?`)) {
              componentScope.deleteTransplantProductionStandardTime(field.PrimaryKey)
            }
          }
          },
        sortable: true, filter: true, width: 100
      },
    ]
  }

  deleteTransplantProductionStandardTime(transplantProductionStandardTimeID: number) {
    this.deleteStandardTimeRequest = this.workbookService.deleteTransplantProductionStandardTime(this.workbookID, transplantProductionStandardTimeID).subscribe(fieldStandardTimeDtos => {
      var rowToRemove = this.gridApi.getRowNode(transplantProductionStandardTimeID.toString());
      this.gridApi.applyTransaction({remove:[rowToRemove.data]})
      this.alertService.pushAlert(new Alert("Successfully deleted Time Study", AlertContext.Success));
      this.cdr.detectChanges();
    }, error => {

    })
  }

  public launchModal(modalContent: any, modalTitle: string, transplantProductionStandardTime: TransplantProductionStandardTimeSummaryDto) {
    this.modalReference = this.modalService.open(modalContent, { size:'xl', windowClass : "time-studies-modal", ariaLabelledBy: modalTitle, backdrop: 'static', keyboard: false });
    this.modalReference.componentInstance.transplantProductionStandardTime = transplantProductionStandardTime;
    this.modalReference.componentInstance.activityDisplayString = this.getDisplayNameForTimeStudy(transplantProductionStandardTime);
    this.modalReference.componentInstance.unitsLabel = "Number of Trays";
    this.modalReference.result.then((result) => {
      if(result.TransplantProductionStandardTimeID) {
        var rowNode = this.gridApi.getRowNode(result.TransplantProductionStandardTimeID);
        rowNode.setData(result);
      }
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }

  public getDisplayNameForTimeStudy(transplantProductionStandardTime: TransplantProductionStandardTimeSummaryDto): string {
    var returnString = transplantProductionStandardTime.TransplantProductionLaborActivity.TransplantProductionLaborActivityName + ' - ' + transplantProductionStandardTime.TransplantProductionTrayType.TransplantProductionTrayTypeName;
    return returnString;
  }

  onCellValueChanged(data: any) {
    var dtoToPost = data.data;
    this.updateStandardTimeRequest = this.workbookService.updateTransplantProductionStandardTime(dtoToPost).subscribe(standardTime => {
      data.node.setData(standardTime);
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
    if (this.getTransplantProductionStandardTimesRequest && this.getTransplantProductionStandardTimesRequest.unsubscribe) {
      this.getTransplantProductionStandardTimesRequest.unsubscribe();
    }
    if (this.getTransplantProductionLaborActivitiesRequest && this.getTransplantProductionLaborActivitiesRequest.unsubscribe) {
      this.getTransplantProductionLaborActivitiesRequest.unsubscribe();
    }
    if (this.getTransplantProductionTrayTypesRequest && this.getTransplantProductionTrayTypesRequest.unsubscribe) {
      this.getTransplantProductionTrayTypesRequest.unsubscribe();
    }
    
    if (this.initializeStandardTimeRequest && this.initializeStandardTimeRequest.unsubscribe) {
      this.initializeStandardTimeRequest.unsubscribe();
    }
    if (this.deleteStandardTimeRequest && this.deleteStandardTimeRequest.unsubscribe) {
      this.deleteStandardTimeRequest.unsubscribe();
    }
    
    this.cdr.detach();
  }

  resetForm() {
    this.model = new TransplantProductionStandardTimeCreateDto({WorkbookID: this.workbookID});
  }

  public exportToCsv() {
    let columnsKeys = this.tpStandardTimesGrid.columnApi.getAllDisplayedColumns(); 
    let columnIds: Array<any> = []; 
    columnsKeys.forEach(keys => 
      { 
        let columnName: string = keys.getColId(); 
        columnIds.push(columnName); 
      });
    
    columnIds.splice(-1, 1);
    this.utilityFunctionsService.exportGridToCsv(this.tpStandardTimesGrid, 'Transplant-Production-Time-Studies.csv', columnIds);
  }  

}

