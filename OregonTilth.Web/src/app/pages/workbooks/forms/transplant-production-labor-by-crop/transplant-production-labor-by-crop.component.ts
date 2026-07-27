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
import { LookupTablesService } from 'src/app/services/lookup-tables/lookup-tables.service';
import { forkJoin, Subscription } from 'rxjs';
import { ButtonRendererComponent } from 'src/app/shared/components/ag-grid/button-renderer/button-renderer.component';
import { CropDto } from 'src/app/shared/models/generated/crop-dto';
import { TransplantProductionLaborActivityByCropDto } from 'src/app/shared/models/generated/transplant-production-labor-activity-by-crop-dto';
import { TransplantProductionLaborActivityDto } from 'src/app/shared/models/generated/transplant-production-labor-activity-dto';
import { PhaseDto } from 'src/app/shared/models/generated/phase-dto';
import { TransplantProductionLaborByCropCreateDto } from 'src/app/shared/models/forms/transplant-production-labor-by-crop/transplant-production-labor-by-crop-create-dto';
import { DecimalEditor } from 'src/app/shared/components/ag-grid/decimal-editor/decimal-editor.component';
import { EditableRendererComponent } from 'src/app/shared/components/ag-grid/editable-renderer/editable-renderer.component';
import { TransplantProductionInformationDto } from 'src/app/shared/models/generated/transplant-production-information-dto';
import { AgGridAngular } from 'ag-grid-angular';
import { UtilityFunctionsService } from 'src/app/services/utility-functions.service';
import { TransplantProductionStandardTimeCreateDto } from 'src/app/shared/models/forms/transplant-production-standard-times/transplant-production-standard-time-create-dto';
import { TransplantProductionStandardTimeDto } from 'src/app/shared/models/generated/transplant-production-standard-time-dto';
import { TransplantProductionStandardTimeSummaryDto } from 'src/app/shared/models/forms/transplant-production-standard-times/transplant-production-standard-time-summary-dto';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
@Component({
  selector: 'transplant-production-labor-by-crop',
  templateUrl: './transplant-production-labor-by-crop.component.html',
  styleUrls: ['./transplant-production-labor-by-crop.component.scss']
})
export class TransplantProductionLaborByCropComponent implements OnInit {
  @ViewChild('tpLaborByCropGrid') tpLaborByCropGrid: AgGridAngular;
  constructor(private cdr: ChangeDetectorRef, 
    private authenticationService: AuthenticationService, 
    private workbookService: WorkbookService,
    private lookupTablesService: LookupTablesService,
    private alertService: AlertService,
    private utilityFunctionsService: UtilityFunctionsService, 
    private breadcrumbService: BreadcrumbsService,
    private route: ActivatedRoute) { }

  private gridApi: any;
  private watchUserChangeSubscription: any;
  private currentUser: UserDetailedDto;
  public workbook: WorkbookDto;
  public richTextTypeID : number = CustomRichTextType.TPLaborByCropForm;
  public isLoadingSubmit: boolean = false;
  private workbookID: number;
  private getWorkbookRequest: any;
  private addTransplantProductionLaborByCropRequest: any;
  public model: TransplantProductionLaborByCropCreateDto;

  public getTransplantProductionLaborByCropsRequest: any;
  public transplantProductionLaborByCropDtos: TransplantProductionLaborActivityByCropDto[];

  public transplantProductionInformationDtos: TransplantProductionInformationDto[];
  private getTransplantProductionInformationDtosRequest: any;

  public transplantProductionStandardTimeDtos: TransplantProductionStandardTimeSummaryDto[];
  private getTransplantProductionStandardTimeDtosRequest: any;

  public transplantProductionLaborActivityDtos: TransplantProductionLaborActivityDto[];
  public availableTransplantProductionLaborActivityDtos: TransplantProductionLaborActivityDto[];
  private getTransplantProductionLaborActivityDtosRequest: any;

  private updateTransplantProductionLaborByCropRequest: any;
  private deleteTransplantProductionLaborByCropRequest: any;

  public columnDefs: ColDef[];

  public dropdownSettings = {};
 
  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      this.route.params.subscribe(params => {
        this.workbookID = parseInt(params['workbookID']);
        this.model = new TransplantProductionLaborByCropCreateDto({WorkbookID: this.workbookID});
      
        this.refreshData();
      });
      

    });
  }

  updateAvailableLaborActivities() {

    var selectedTpInfo = this.transplantProductionInformationDtos.find(x => x.TransplantProductionInformationID == this.model.TransplantProductionInformationID);

    if(!selectedTpInfo) {
      this.availableTransplantProductionLaborActivityDtos = [];
      return;
    }

    this.availableTransplantProductionLaborActivityDtos = this.transplantProductionLaborActivityDtos.filter(x => {
      
      var standardTimes = this.transplantProductionStandardTimeDtos.filter(y => {
        return y.TransplantProductionTrayType.TransplantProductionTrayTypeID == selectedTpInfo.TransplantProductionTrayType.TransplantProductionTrayTypeID && y.StandardTimePerUnit > 0
      })

      var laborActivityIDs = standardTimes.map(y => y.TransplantProductionLaborActivity.TransplantProductionLaborActivityID);
      var alreadyAddedLaborActivityIDsForCropAndPhase = this.transplantProductionLaborByCropDtos.filter(x => 
        x.TransplantProductionInformation.Crop.CropID == selectedTpInfo.Crop.CropID 
        && x.TransplantProductionInformation.Phase.PhaseID == selectedTpInfo.Phase.PhaseID)
        .map(y => y.TransplantProductionLaborActivity.TransplantProductionLaborActivityID);
      return laborActivityIDs.includes(x.TransplantProductionLaborActivityID) && !alreadyAddedLaborActivityIDsForCropAndPhase.includes(x.TransplantProductionLaborActivityID) 
    })
  }

  private refreshData() {
    this.getWorkbookRequest = this.workbookService.getWorkbook(this.workbookID);
    this.getTransplantProductionInformationDtosRequest = this.workbookService.getTransplantProductionInformationDtos(this.workbookID);
    this.getTransplantProductionLaborActivityDtosRequest = this.workbookService.getTransplantProductionLaborActivitiesFromTransplantProductionStandardTimes(this.workbookID);
    this.getTransplantProductionLaborByCropsRequest = this.workbookService.getTransplantProductionLaborByCrops(this.workbookID);

    this.getTransplantProductionStandardTimeDtosRequest = this.workbookService.getTransplantProductionStandardTimes(this.workbookID);

    forkJoin<[WorkbookDto, TransplantProductionInformationDto[], TransplantProductionLaborActivityDto[], TransplantProductionLaborActivityByCropDto[], TransplantProductionStandardTimeSummaryDto[]]>([this.getWorkbookRequest, this.getTransplantProductionInformationDtosRequest, this.getTransplantProductionLaborActivityDtosRequest, this.getTransplantProductionLaborByCropsRequest, this.getTransplantProductionStandardTimeDtosRequest]).subscribe(([workbookDto, transplantProductionInformationDtos, transplantProductionLaborActivityDtos, transplantProductionLaborByCrops, standardTimes]: [WorkbookDto, TransplantProductionInformationDto[], TransplantProductionLaborActivityDto[], TransplantProductionLaborActivityByCropDto[], TransplantProductionStandardTimeSummaryDto[]]) => {
      this.workbook = workbookDto;
      this.breadcrumbService.setBreadcrumbs([{label:'Workbooks', routerLink:['/workbooks']},{label:workbookDto.WorkbookName, routerLink:['/workbooks',workbookDto.WorkbookID.toString()]}, {label:'Transplant Production Labor By Crop'}]);

      this.transplantProductionInformationDtos =  transplantProductionInformationDtos;
      this.transplantProductionLaborActivityDtos = this.getUniqueTransplantProductionLaborActivityDtos(transplantProductionLaborActivityDtos);
      this.transplantProductionStandardTimeDtos = standardTimes;
      this.transplantProductionLaborByCropDtos = transplantProductionLaborByCrops;
      this.updateAvailableLaborActivities();
      this.defineColumnDefs();
      this.cdr.markForCheck();
    });

    this.dropdownSettings = {
      singleSelection: false,
      idField: 'TransplantProductionLaborActivityID',
      textField: 'TransplantProductionLaborActivityName',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 10,
      allowSearchFilter: true
    };
  }

  getUniqueTransplantProductionLaborActivityDtos(transplantProductionLaborActivityDtos: TransplantProductionLaborActivityDto[]) {
    let returnArray: TransplantProductionLaborActivityDto[] = [];
    transplantProductionLaborActivityDtos.forEach((x, i) => {
      if(returnArray.findIndex(y => {
        return y.TransplantProductionLaborActivityID == x.TransplantProductionLaborActivityID
      }) < 0) {
        returnArray.push(x);
      }
    });
    return returnArray;
  }

  defineColumnDefs() {
    var componentScope = this;
    this.columnDefs = [
      {
        headerName: 'Crop, Phase, Tray Type', 
        field: 'Crop',
        valueGetter: params => {
          var strings = [];
          strings.push(params.data.TransplantProductionInformation.Crop.CropName )
          strings.push(params.data.TransplantProductionInformation.Phase.PhaseDisplayName )
          strings.push(params.data.TransplantProductionInformation.TransplantProductionTrayType.TransplantProductionTrayTypeName )
          return strings.join(', ');
        },
        editable: false,
        sortable: true, 
        filter: true,
        resizable: true
      },
      {
        headerName: 'TP Labor Activity', 
        field: 'TransplantProductionLaborActivity',
        
        valueSetter: params => {
          params.data.TransplantProductionLaborActivity = this.transplantProductionLaborActivityDtos.find(element => {
            return element.TransplantProductionLaborActivityName == params.newValue;
          });
          return true;
        },
        valueGetter: params => {
          return params.data.TransplantProductionLaborActivity.TransplantProductionLaborActivityName;
        },
        
        sortable: true, 
        filter: true,
        resizable: true
      },
      {
        headerName: 'Notes', 
        field: 'Notes',
        editable: true,
        cellEditor: 'agLargeTextCellEditor',
        cellRendererFramework: EditableRendererComponent,
        resizable: true,
        sortable: true,
        filter: true,
        cellEditorParams: {
          maxLength: 2000,
        }
      },
      {
        headerName: 'Occurrences', 
        field: 'Occurrences',
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
        resizable: true
      },
      {
        headerName: 'Delete', valueGetter: function (params: any) {
          return { ButtonText: 'Delete', CssClasses: "btn btn-fresca btn-sm", PrimaryKey: params.data.TransplantProductionLaborActivityByCropID, ObjectDisplayName: null };
        }, cellRendererFramework: ButtonRendererComponent,
        cellRendererParams: { 
          clicked: function(field: any) {
            if(confirm(`Are you sure you want to delete this record?`)) {
              componentScope.deleteTransplantProductionLaborByCrop(field.PrimaryKey)
            }
          }
          },
        sortable: true, filter: true, width: 100, resizable: true
      },
    ]
  }

  deleteTransplantProductionLaborByCrop(transplantProductionLaborByCropID: number) {
    this.deleteTransplantProductionLaborByCropRequest = this.workbookService.deleteTransplantProductionLaborByCrop(this.workbookID, transplantProductionLaborByCropID).subscribe(transplantProductionLaborByCropDtos => {
      this.transplantProductionLaborByCropDtos = transplantProductionLaborByCropDtos;
      this.resetForm();
      this.refreshData();
      this.alertService.pushAlert(new Alert("Successfully deleted Transplant Production Labor By Crop", AlertContext.Success));
      this.cdr.detectChanges();
      this.gridApi.redrawRows();
    }, error => {

    })
  }

  onCellValueChanged(data: any) {
    var dtoToPost = data.data;

    this.updateTransplantProductionLaborByCropRequest = this.workbookService.updateTransplantProductionLaborByCrop(dtoToPost).subscribe(transplantProductionLaborByCrop => {
      data.node.setData(transplantProductionLaborByCrop);
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

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  private routeSubscription : Subscription = Subscription.EMPTY;
 ngOnDestroy(){
    this.routeSubscription.unsubscribe()
    this.watchUserChangeSubscription.unsubscribe();
    if (this.getWorkbookRequest && this.getWorkbookRequest.unsubscribe) {
      this.getWorkbookRequest.unsubscribe();
    }
    if (this.addTransplantProductionLaborByCropRequest && this.addTransplantProductionLaborByCropRequest.unsubscribe) {
      this.addTransplantProductionLaborByCropRequest.unsubscribe();
    }
    if (this.getTransplantProductionLaborByCropsRequest && this.getTransplantProductionLaborByCropsRequest.unsubscribe) {
      this.getTransplantProductionLaborByCropsRequest.unsubscribe();
    }
    if (this.updateTransplantProductionLaborByCropRequest && this.updateTransplantProductionLaborByCropRequest.unsubscribe) {
      this.updateTransplantProductionLaborByCropRequest.unsubscribe();
    }
    if (this.deleteTransplantProductionLaborByCropRequest && this.deleteTransplantProductionLaborByCropRequest.unsubscribe) {
      this.deleteTransplantProductionLaborByCropRequest.unsubscribe();
    }
    if (this.getTransplantProductionInformationDtosRequest && this.getTransplantProductionInformationDtosRequest.unsubscribe) {
      this.getTransplantProductionInformationDtosRequest.unsubscribe();
    }
    if (this.getTransplantProductionLaborActivityDtosRequest && this.getTransplantProductionLaborActivityDtosRequest.unsubscribe) {
      this.getTransplantProductionLaborActivityDtosRequest.unsubscribe();
    }

    
    this.cdr.detach();
  }

  onSubmit(transplantProductionLaborActivityForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;
    this.addTransplantProductionLaborByCropRequest = this.workbookService.addTransplantProductionLaborByCrop(this.model).subscribe(response => {
      this.transplantProductionLaborByCropDtos.push(...response);
      var transactionRows = this.gridApi.applyTransaction({add: response });
      this.gridApi.flashCells({ rowNodes: transactionRows.add });
      this.isLoadingSubmit = false;
      if(response.length > 0){
        this.alertService.pushAlert(new Alert(`Successfully added ${response.length} Transplant Production Labor(s) for Crop '${response[0].TransplantProductionInformation.Crop.CropName}'.`, AlertContext.Success));
      }else{
        this.alertService.pushAlert(new Alert(`No Transplant Production Labor By Crop was added.`, AlertContext.Info));
      }
      this.resetForm();
      
      this.cdr.detectChanges();
      
    }, error => { 
      this.isLoadingSubmit = false;
      this.cdr.detectChanges();
    });
  }

  resetForm() {
    this.model = new TransplantProductionLaborByCropCreateDto({WorkbookID: this.workbookID});
    this.updateAvailableLaborActivities();
  }

  public exportToCsv() {
    let columnsKeys = this.tpLaborByCropGrid.columnApi.getAllDisplayedColumns(); 
    let columnIds: Array<any> = []; 
    columnsKeys.forEach(keys => 
      { 
        let columnName: string = keys.getColId(); 
        columnIds.push(columnName); 
      });
    columnIds.splice(-1, 1); // remove the delete column from the download
    this.utilityFunctionsService.exportGridToCsv(this.tpLaborByCropGrid, 'Transplant-Production-Labor-By-Crop.csv', columnIds);
  }  
}