import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { UserDetailedDto } from 'src/app/shared/models';
import { CustomRichTextType } from 'src/app/shared/models/enums/custom-rich-text-type.enum';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UtilityFunctionsService } from 'src/app/services/utility-functions.service';
import { UserService } from 'src/app/services/user/user.service';
import { DatePipe, DecimalPipe, NgIf, NgFor } from '@angular/common';
import { WorkbookService } from 'src/app/services/workbook/workbook.service';
import { WorkbookDto } from 'src/app/shared/models/generated/workbook-dto';
import { ColDef } from 'ag-grid-community';
import { LinkRendererComponent } from 'src/app/shared/components/ag-grid/link-renderer/link-renderer.component';
import { RoleDto } from 'src/app/shared/models/generated/role-dto';
import { AlertService } from 'src/app/shared/services/alert.service';
import { GridService } from 'src/app/shared/services/grid/grid.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { CropSpecificInfoDto } from 'src/app/shared/models/generated/crop-specific-info-dto';
import { CropSpecificInfoCreateDto } from 'src/app/shared/models/forms/crop-specific-info/crop-specific-info-create-dto';
import { FieldUnitTypeDto } from 'src/app/shared/models/generated/field-unit-type-dto';
import { LookupTablesService } from 'src/app/services/lookup-tables/lookup-tables.service';
import { forkJoin, Subscription } from 'rxjs';
import { ButtonRendererComponent } from 'src/app/shared/components/ag-grid/button-renderer/button-renderer.component';
import { TpOrDsTypeDto } from 'src/app/shared/models/generated/tp-or-ds-type-dto';
import { CropDto } from 'src/app/shared/models/generated/crop-dto';
import { PhaseEnum } from 'src/app/shared/models/enums/phase.enum';
import { TpOrDsTypeEnum } from 'src/app/shared/models/enums/tp-or-ds-type.enum';
import { CropSpecificInfoSummaryDto } from 'src/app/shared/models/forms/crop-specific-info/crop-specific-info-summary-dto';
import { IntegerEditor } from 'src/app/shared/components/ag-grid/integer-editor/integer-editor.component';
import { DecimalEditor } from 'src/app/shared/components/ag-grid/decimal-editor/decimal-editor.component';
import { EditableRendererComponent } from 'src/app/shared/components/ag-grid/editable-renderer/editable-renderer.component';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { FieldLaborActivityDto } from 'src/app/shared/models/generated/field-labor-activity-dto';
import { FieldStandardTimeDto } from 'src/app/shared/models/generated/field-standard-time-dto';
import { FieldLaborByCropDto } from 'src/app/shared/models/generated/field-labor-by-crop-dto';
import { FieldUnitTypeEnum } from 'src/app/shared/models/enums/field-unit-type.enum';
import { FieldInputByCropDto } from 'src/app/shared/models/generated/field-input-by-crop-dto';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
import { AlertDisplayComponent } from '../../../../shared/components/alert-display/alert-display.component';
import { CustomRichTextComponent } from '../../../../shared/components/custom-rich-text/custom-rich-text.component';
import { FormsModule } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'crop-specific-info',
    templateUrl: './crop-specific-info.component.html',
    styleUrls: ['./crop-specific-info.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, CustomRichTextComponent, NgIf, FormsModule, NgFor, NgbTooltip, AgGridModule]
})
export class CropSpecificInfoComponent implements OnInit {
  @ViewChild('cropSpecificInfoGrid') cropSpecificInfoGrid: AgGridAngular;
  constructor(private cdr: ChangeDetectorRef, 
    private authenticationService: AuthenticationService, 
    private workbookService: WorkbookService,
    private lookupTablesService: LookupTablesService,
    private alertService: AlertService,
    private gridService: GridService,
    private breadcrumbService: BreadcrumbsService,
    private router: Router,
    private utilityFunctionsService: UtilityFunctionsService,
    private route: ActivatedRoute) { }

  private gridApi: any;
  private watchUserChangeSubscription: any;
  private currentUser: UserDetailedDto;
  public workbook: WorkbookDto;
  public richTextTypeID : number = CustomRichTextType.CropSpecificInfoForm;
  public isLoadingSubmit: boolean = false;
  private workbookID: number;
  private getWorkbookRequest: any;
  private addCropSpecificInfoRequest: any;
  public model: CropSpecificInfoCreateDto;
  
  public getCropSpecificInfosRequest: any;
  public cropSpecificInfos: CropSpecificInfoSummaryDto[];

  public getCropsRequest: any;
  public createDtos: CropSpecificInfoCreateDto[];

  public initializeCropSpecificInfoRequest: any;

  private updateCropSpecificInfoRequest: any;
  private deleteCropSpecificInfoRequest: any;

  public tpOrDsTypes: TpOrDsTypeDto[];
  public allTpOrDsTypes: TpOrDsTypeDto[];
  private getTpOrDsTypesRequest: any;

  public crops: CropDto[];

  public columnDefs: ColDef[];

  public cropDtosRequired: CropDto[] = [];

  public fieldStandardTimes: FieldStandardTimeDto[];
  public fieldLaborActivities: FieldLaborActivityDto[];
  public fieldLaborByCrops: FieldLaborByCropDto[];
  public fieldInputByCrops: FieldInputByCropDto[];
 
  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      this.route.params.subscribe(params => {
        this.workbookID = parseInt(params['workbookID']);
        this.model = new CropSpecificInfoCreateDto({WorkbookID: this.workbookID});
      
        this.refreshData();
      });
      

    });
  }

  private refreshData() {
    this.getWorkbookRequest = this.workbookService.getWorkbook(this.workbookID);
    this.getTpOrDsTypesRequest = this.lookupTablesService.getTpOrDsTypes();
    this.getCropSpecificInfosRequest = this.workbookService.getCropSpecificInfos(this.workbookID);
    this.getCropsRequest = this.workbookService.getCrops(this.workbookID);

    forkJoin<[WorkbookDto, TpOrDsTypeDto[], CropSpecificInfoSummaryDto[], CropDto[], FieldLaborByCropDto[], FieldInputByCropDto[]]>([
        this.getWorkbookRequest, 
        this.getTpOrDsTypesRequest, 
        this.getCropSpecificInfosRequest, 
        this.getCropsRequest,
        
        this.workbookService.getFieldLaborByCrops(this.workbookID),
        this.workbookService.getFieldInputByCrops(this.workbookID)
      ])
      .subscribe(([workbook, tpOrDsTypes, cropSpecificInfos, cropDtos, fieldLaborByCrops, fieldInputByCrops] 
        : [WorkbookDto, TpOrDsTypeDto[], CropSpecificInfoSummaryDto[], CropDto[], FieldLaborByCropDto[], FieldInputByCropDto[]]) => {
      this.workbook = workbook;
      this.breadcrumbService.setBreadcrumbs([{label:'Workbooks', routerLink:['/workbooks']},{label:workbook.WorkbookName, routerLink:['/workbooks',workbook.WorkbookID.toString()]}, {label:'Crop Planting Info'}]);
      this.tpOrDsTypes = tpOrDsTypes;
      this.allTpOrDsTypes = [...tpOrDsTypes];
      this.cropSpecificInfos = cropSpecificInfos;
      this.crops = cropDtos;
      this.fieldLaborByCrops = fieldLaborByCrops;
      this.fieldInputByCrops = fieldInputByCrops;
      this.refreshCropsRequired();
      this.defineColumnDefs();
      this.cdr.markForCheck();

    });
  }

  refreshCropsRequired() {
    if(this.crops && this.cropSpecificInfos) {
      var cropsIDsAlreadyAdded = this.cropSpecificInfos.map(x => {
        return x.Crop.CropID;
      })
      var requiredCrops = this.crops.filter(crop => {
        return !cropsIDsAlreadyAdded.includes(crop.CropID);
      })
      this.cropDtosRequired = requiredCrops;
    }
  }

  onSubmit(cropSpecificInfoForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;
    this.addCropSpecificInfoRequest = this.workbookService.initializeCropSpecificInfo(this.model).subscribe(response => {
      this.isLoadingSubmit = false;
      this.cropSpecificInfos.push(response);
      var transactionRows = this.gridApi.applyTransaction({add: [response]});
      this.gridApi.flashCells({
        rowNodes: transactionRows.add
      });
      this.resetForm();
      this.cdr.detectChanges();
      
    }, error => { 
      this.isLoadingSubmit = false;
      this.cdr.detectChanges();
    });
  }

  inRowSpacingRequired() {
    if(this.model && (this.model.TpOrDsTypeID == TpOrDsTypeEnum.TransplantFarmProduced || this.model.TpOrDsTypeID == TpOrDsTypeEnum.TransplantOutsourced )){
      return true;
    }
    return false;
  }

  seedCostRequired() {
    if(this.model && (this.model.TpOrDsTypeID == TpOrDsTypeEnum.DirectSeeded)){
      return true;
    }
    return false;
  }


  costOutsourcedRequired() {
    if(this.model && this.model.TpOrDsTypeID == TpOrDsTypeEnum.TransplantOutsourced){
      return true;
    }
    return false;
  }

  initializeCropSpecificInfo(createDto: CropSpecificInfoCreateDto) {

    this.initializeCropSpecificInfoRequest = this.workbookService.initializeCropSpecificInfo(createDto).subscribe(cropSpecificInfoDto => {
      this.cropSpecificInfos.push(cropSpecificInfoDto)
        var transactionRows = this.gridApi.applyTransaction({add: [cropSpecificInfoDto]});
        this.gridApi.flashCells({
          rowNodes: transactionRows.add
        });
        var createDtoIndexToRemove = this.createDtos.findIndex(x => {
          return x.CropID == createDto.CropID;// only one crop specific info for each crop
        });
        
        this.createDtos.splice(createDtoIndexToRemove, 1);
        this.cdr.detectChanges();
        
      }, error => {
  
      });
    
  }

  defineColumnDefs() {
    var componentScope = this;
    this.columnDefs = [
      {
        headerName: 'Crop', 
        field: 'Crop',
        valueFormatter: params => {
          return params.data.Crop.CropName;
        },
        valueGetter: params => {
          return params.data.Crop.CropName;
        },
        editable: false,
        sortable: true, 
        filter: true,
        pinned: 'left',
        width: 100,
        resizable: true
      },
      {
        headerName: 'TP or DS Type', 
        field: 'TpOrDsType',
        valueFormatter: function (params) {
          return params.data.TpOrDsType.TpOrDsTypeDisplayName;
        },
        valueGetter: params => {
          return params.data.TpOrDsType.TpOrDsTypeDisplayName;
        },
        sortable: true, 
        filter: true,
        resizable: true
      }, 
      {
        headerName: 'Rows Per Standard Bed', 
        field:'RowsPerStandardWidth',
        valueGetter: function(params:any) {
          return params.data.RowsPerStandardWidth
        },
        editable: true,
        cellEditor: DecimalEditor,
        sortable: true, 
        filter: true,
        cellStyle: params => {
          if (params.value) {
              return { backgroundColor: '#ccf5cc'};
          } 
          return {backgroundColor: '#ffdfd6'};
        },
        valueSetter: params => {
          params.data.RowsPerStandardWidth = params.newValue ? params.newValue : 0;
          return true;
        },
        cellRenderer: EditableRendererComponent,
        width:150,
        resizable: true
      },
      {
        headerName: 'Drip Tape Rows per Standard Bed', 
        field:'DripTapeRowsPerStandardWidth',
        valueGetter: function(params:any) {
          return params.data.DripTapeRowsPerStandardWidth
        },
        editable: true,
        cellEditor: IntegerEditor,
        cellRenderer: EditableRendererComponent,
        sortable: true, 
        filter: true,
        cellStyle: params => {
          if (params.value || params.value == 0) {
              return { backgroundColor: '#ccf5cc'};
          } 
          return {backgroundColor: '#ffdfd6'};
        },
        valueSetter: params => {
          params.data.DripTapeRowsPerStandardWidth = params.newValue ? params.newValue : 0;
          return true;
        },
        width:150,
        resizable: true
      },
     
      
      {
        headerName: 'Seed Cost per Standard Bed', 
        field:'SeedCostPerStandardUnitOfSpace',
        valueGetter: function(params:any) {
          if(params.data.TpOrDsType.TpOrDsTypeID == TpOrDsTypeEnum.DirectSeeded) {
            return params.data.SeedCostPerStandardUnitOfSpace;
          }
          return 'N/A';
        },
        editable: params => {
          return params.data.TpOrDsType.TpOrDsTypeID == TpOrDsTypeEnum.DirectSeeded;
        },
        cellEditor: DecimalEditor,
        valueFormatter: this.gridService.currencyFormatter,
        sortable: true, 
        filter: true,
        cellStyle: params => {
          if (params.data.TpOrDsType.TpOrDsTypeID == TpOrDsTypeEnum.DirectSeeded) {
            if(params.value >= 0) {
              return { backgroundColor: '#ccf5cc'};
            } else {
              {backgroundColor: '#ffdfd6'};
            }
          } 
          return {backgroundColor: '#ddd'};
        },
        cellRenderer: EditableRendererComponent,
        width:150,
        resizable: true
      },
      {
        headerName: 'In Row Spacing (inches)', 
        field:'InRowSpacing',
        valueGetter: function(params:any) {
          if(params.data.TpOrDsType.TpOrDsTypeID == TpOrDsTypeEnum.TransplantFarmProduced || params.data.TpOrDsType.TpOrDsTypeID == TpOrDsTypeEnum.TransplantOutsourced){
            return params.data.InRowSpacing;
          }
          return 'N/A';
        },
        editable: params => {
          return params.data.TpOrDsType.TpOrDsTypeID == TpOrDsTypeEnum.TransplantFarmProduced || params.data.TpOrDsType.TpOrDsTypeID == TpOrDsTypeEnum.TransplantOutsourced;
        },
        cellEditor: DecimalEditor,
        cellRenderer: EditableRendererComponent,
        sortable: true, 
        filter: true,
        cellStyle: params => {
          if((params.data.TpOrDsType.TpOrDsTypeID == TpOrDsTypeEnum.TransplantFarmProduced || params.data.TpOrDsType.TpOrDsTypeID == TpOrDsTypeEnum.TransplantOutsourced)){
            if(params.value){
              return {backgroundColor: '#ccf5cc'};
            } else {
              return {backgroundColor: '#ffdfd6'};
            }
          }
          return { backgroundColor: '#ddd'};
        },
        width:150,
        resizable: true
      },
      {
        headerName: 'Transplant Production Cost Outsourced', 
        field:'TransplantProductionCostOutsourced',
        valueGetter: function(params:any) {
          if(params.data.TpOrDsType.TpOrDsTypeID == TpOrDsTypeEnum.TransplantOutsourced){
            return params.data.TransplantProductionCostOutsourced;
          }
          return 'N/A';
        },
        editable: params => {
          return params.data.TpOrDsType.TpOrDsTypeID == TpOrDsTypeEnum.TransplantOutsourced;
        },
        cellEditor: DecimalEditor,
        cellRenderer: EditableRendererComponent,
        valueFormatter: this.gridService.currencyFormatter,
        sortable: true, 
        filter: true,
        cellStyle: params => {
          if(params.data.TpOrDsType.TpOrDsTypeID == TpOrDsTypeEnum.TransplantOutsourced){
            if(params.value >= 0){
              return {backgroundColor: '#ccf5cc'};             
            } else {
              return {backgroundColor: '#ffdfd6'};
            }
          }
          if (params.value) {
              return { backgroundColor: '#ddd'};
          } 
        },
        width:150,
        resizable: true
      },
      {
        headerName: 'Delete', field: 'CropSpecificInfoID', valueGetter: function (params: any) {
          return { ButtonText: 'Delete', CssClasses: "btn btn-fresca btn-sm", PrimaryKey: params.data.CropSpecificInfoID, ObjectDisplayName: params.data.CropSpecificInfoName };
        }, cellRenderer: ButtonRendererComponent,
        cellRendererParams: { 
          clicked: function(field: any) {
            if(confirm(`Are you sure you want to delete the ${field.ObjectDisplayName} Crop Planting Info?`)) {
              componentScope.deleteCropSpecificInfo(field.PrimaryKey)
            }
          }
          },
        sortable: true, filter: true, width: 100, resizable: true
      },
    ]
  }

  deleteCropSpecificInfo(cropSpecificInfoID: number) {
    this.deleteCropSpecificInfoRequest = this.workbookService.deleteCropSpecificInfo(this.workbookID, cropSpecificInfoID).subscribe(cropSpecificInfoDtos => {
      var rowToRemove = this.gridApi.getRowNode(cropSpecificInfoID.toString());
      this.gridApi.applyTransaction({remove:[rowToRemove.data]})

      var index = this.cropSpecificInfos.findIndex(x => {
        return x.CropSpecificInfoID == cropSpecificInfoID;
      })
      this.cropSpecificInfos.splice(index, 1);

      this.alertService.pushAlert(new Alert("Successfully deleted Crop Planting Info", AlertContext.Success));
      this.refreshCropsRequired();
      this.cdr.detectChanges();
    }, error => {

    })
  }

  onCellValueChanged(data: any) {
    var dtoToPost = data.data;

    this.updateCropSpecificInfoRequest = this.workbookService.updateCropSpecificInfo(dtoToPost).subscribe(cropSpecificInfo => {
      data.node.setData(cropSpecificInfo);
      this.gridApi.flashCells({
        rowNodes: [data.node],
        columns: [data.column]
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

  getRowId(params)  {
    return params.data.CropSpecificInfoID.toString();
  }

  private routeSubscription : Subscription = Subscription.EMPTY;
 ngOnDestroy(){
    this.routeSubscription.unsubscribe()
    this.watchUserChangeSubscription.unsubscribe();
    if (this.getWorkbookRequest && this.getWorkbookRequest.unsubscribe) {
      this.getWorkbookRequest.unsubscribe();
    }
    if (this.addCropSpecificInfoRequest && this.addCropSpecificInfoRequest.unsubscribe) {
      this.addCropSpecificInfoRequest.unsubscribe();
    }
    if (this.getCropSpecificInfosRequest && this.getCropSpecificInfosRequest.unsubscribe) {
      this.getCropSpecificInfosRequest.unsubscribe();
    }
    if (this.getCropsRequest && this.getCropsRequest.unsubscribe) {
      this.getCropsRequest.unsubscribe();
    }
    if (this.updateCropSpecificInfoRequest && this.updateCropSpecificInfoRequest.unsubscribe) {
      this.updateCropSpecificInfoRequest.unsubscribe();
    }
    if (this.deleteCropSpecificInfoRequest && this.deleteCropSpecificInfoRequest.unsubscribe) {
      this.deleteCropSpecificInfoRequest.unsubscribe();
    }
    
    this.cdr.detach();
  }



  resetForm() {
    this.model = new CropSpecificInfoCreateDto({WorkbookID: this.workbookID});
    this.refreshCropsRequired();
  }
  public exportToCsv() {
    let columnsKeys = this.cropSpecificInfoGrid.api.getAllDisplayedColumns(); 
    let columnIds: Array<any> = []; 
    columnsKeys.forEach(keys => 
      { 
        let columnName: string = keys.getColId(); 
        columnIds.push(columnName); 
      });
    columnIds.splice(-1, 1); // remove the delete column from the download
    this.utilityFunctionsService.exportGridToCsv(this.cropSpecificInfoGrid, 'Crop-Specific-Information.csv', columnIds);
  }  

  cropSelectionChanged(cropID: string) {

    /**
     *  look at the Field Labor Activities that have been selected on the Field Labor by Crop for that crop. 
     * Then look at the Field Labor Time Studies form. If any of the Field Labor Activities that have been selected 
     * for the crop on Field Labor by Crop use the Field Unit “Transplant” on Field Labor Time Studies,
     *  then don’t allow the user to select “DS” in the field TP Type or DS on the Crop Planting Info form for that crop.
     */
    var fieldLaborByCrops = this.fieldLaborByCrops.filter(x => x.Crop.CropID == parseInt(cropID) && x.FieldStandardTime.FieldUnitType.FieldUnitTypeID == FieldUnitTypeEnum.Transplants)

    /**
     * When a crop is entered on the Crop Planting Info form, look at the Field Inputs that have been selected on the 
     * Field Input by Crop for that crop. If any of the Field Inputs that have been selected for the crop on 
     * Field Input by Crop use the Field Unit “Transplant”  on Field Input Costs, 
     * then don’t allow the user to select “DS” in the field TP Type or DS on the Crop Planting Info form.
     */
    var fieldInputsByCrops = this.fieldInputByCrops.filter((x : any) => x.Crop.CropID == parseInt(cropID) && x.FieldInputCost.FieldUnitTypeID == FieldUnitTypeEnum.Transplants)

    if(fieldLaborByCrops.length > 0 || fieldInputsByCrops.length > 0 ){
      this.tpOrDsTypes = this.allTpOrDsTypes.filter(x => x.TpOrDsTypeID != TpOrDsTypeEnum.DirectSeeded);
    } else {
      this.tpOrDsTypes = this.allTpOrDsTypes;
    }

  }
}

