import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { UserDetailedDto } from 'src/app/shared/models';
import { CustomRichTextType } from 'src/app/shared/models/enums/custom-rich-text-type.enum';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { WorkbookService } from 'src/app/services/workbook/workbook.service';
import { WorkbookDto } from 'src/app/shared/models/generated/workbook-dto';
import { ColDef } from 'ag-grid-community';
import { AlertService } from 'src/app/shared/services/alert.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LookupTablesService } from 'src/app/services/lookup-tables/lookup-tables.service';
import { forkJoin, Subscription } from 'rxjs';
import { ButtonRendererComponent } from 'src/app/shared/components/ag-grid/button-renderer/button-renderer.component';
import { GridService } from 'src/app/shared/services/grid/grid.service';
import { DecimalEditor } from 'src/app/shared/components/ag-grid/decimal-editor/decimal-editor.component';
import { CropDto } from 'src/app/shared/models/generated/crop-dto';
import { CropUnitDto } from 'src/app/shared/models/generated/crop-unit-dto';
import { CropYieldInformationSummaryDto } from 'src/app/shared/models/forms/crop-yield-information/crop-yield-information-summary-dto';
import { CropYieldInformationCreateDto } from 'src/app/shared/models/forms/crop-yield-information/crop-yield-information-create-dto';
import { EditableRendererComponent } from 'src/app/shared/components/ag-grid/editable-renderer/editable-renderer.component';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { UtilityFunctionsService } from 'src/app/services/utility-functions.service';
import { AvailableCropYieldInformationDto } from 'src/app/shared/models/forms/crop-yield-information/available-crop-yield-information-dto';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
import { AlertDisplayComponent } from '../../../../shared/components/alert-display/alert-display.component';
import { CustomRichTextComponent } from '../../../../shared/components/custom-rich-text/custom-rich-text.component';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'crop-yield-information',
    templateUrl: './crop-yield-information.component.html',
    styleUrls: ['./crop-yield-information.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, CustomRichTextComponent, NgIf, RouterLink, FormsModule, NgFor, NgbTooltip, AgGridModule]
})
export class CropYieldInformationComponent implements OnInit {
  @ViewChild('cropYieldInformationGrid') cropYieldInformationGrid: AgGridAngular;
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
  
  public isLoadingSubmit: boolean = false;
  private workbookID: number;
  private getWorkbookRequest: any;
  
  public model: CropYieldInformationCreateDto;
  public richTextTypeID : number = CustomRichTextType.CropYieldInfoForm;

  public getCropYieldInformationDtosRequest: any;
  public cropYieldInformations: CropYieldInformationSummaryDto[];
  public availableCropCropUnitCombinationsRequest: any;
  public allAvailableCropCropUnitCombinations: AvailableCropYieldInformationDto[];
  public availableCropCropUnitCombinations: AvailableCropYieldInformationDto[];
  public selectedAvailableCropCropUnitCombination: AvailableCropYieldInformationDto;

  public getCropsRequest: any;
  public crops: CropDto[];

  public getCropUnitsRequest: any;
  public cropUnits: CropUnitDto[];

  private addCropYieldInformationRequest: any;
  private updateCropYieldInfoRequest: any;
  private deleteCropYieldInfoRequest: any;

  public columnDefs: ColDef[];
 
  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      this.route.params.subscribe(params => {
        this.workbookID = parseInt(params['workbookID']);
        this.model = new CropYieldInformationCreateDto({WorkbookID: this.workbookID});
      
        this.refreshData();
      });


    });
  }

  private refreshData() {
    this.getWorkbookRequest = this.workbookService.getWorkbook(this.workbookID);
    this.getCropsRequest = this.workbookService.getCrops(this.workbookID);
    this.getCropUnitsRequest = this.workbookService.getCropUnits(this.workbookID);
    this.getCropYieldInformationDtosRequest = this.workbookService.getCropYieldInformation(this.workbookID);
    this.availableCropCropUnitCombinationsRequest = this.workbookService.getAvailableCropUnitCombinationsForCropYieldInformation(this.workbookID);

    forkJoin<[WorkbookDto, CropDto[], CropUnitDto[], CropYieldInformationSummaryDto[], AvailableCropYieldInformationDto[]]>([this.getWorkbookRequest, this.getCropsRequest, this.getCropUnitsRequest, this.getCropYieldInformationDtosRequest, this.availableCropCropUnitCombinationsRequest]).subscribe(([workbook, cropDtos, cropUnitDtos, cropYieldInfoDtos, availableCropCropUnitCombinations]: [WorkbookDto, CropDto[], CropUnitDto[], CropYieldInformationSummaryDto[], AvailableCropYieldInformationDto[]]) => {
      this.workbook = workbook;
      this.breadcrumbService.setBreadcrumbs([{label:'Workbooks', routerLink:['/workbooks']},{label:workbook.WorkbookName, routerLink:['/workbooks',workbook.WorkbookID.toString()]}, {label:'Crop Yield and Price Information'}]);
      this.crops = cropDtos;
      this.cropUnits = cropUnitDtos;
      this.cropYieldInformations = cropYieldInfoDtos;
      this.allAvailableCropCropUnitCombinations = availableCropCropUnitCombinations;
      this.filterAvailableCombinations();
      this.defineColumnDefs();
      this.cdr.markForCheck();
    });
  }

  filterAvailableCombinations() {
    this.availableCropCropUnitCombinations = this.allAvailableCropCropUnitCombinations.filter(x => {
      var alreadyAdded = this.cropYieldInformations.filter(y => y.Crop.CropID == x.CropID && y.CropUnit.CropUnitID == x.CropUnitID).length > 0;
      return !alreadyAdded     
    })
    
  }


  selectedCropCropUnit() {
    this.model.CropID = this.selectedAvailableCropCropUnitCombination.CropID;
    this.model.CropUnitID = this.selectedAvailableCropCropUnitCombination.CropUnitID;
  }

  defineColumnDefs() {
    var componentScope = this;
    this.columnDefs = [
      {
        headerName: 'Crop', 
        field: 'Crop',
        valueFormatter: function (params) {
          return params.value ? params.value : '';
        },
        valueSetter: params => {
          params.data.Crop = this.crops.find(element => {
            return element.CropName == params.newValue;
          });
          return true;
        },
        valueGetter: params => {
          return params.data.Crop ? params.data.Crop.CropName : '';
        },
        // cellEditor: 'agSelectCellEditor',
        // cellEditorParams: {
        //   values: this.crops.map(x => x.CropName)
        // },
        // cellRenderer: EditableRendererComponent,
        //editable:true,
        sortable: true, 
        filter: true,
        resizable: true,
        width:150
      },
      {
        headerName: 'Crop Unit', 
        field: 'Crop',
        valueFormatter: function (params) {
          return params.value ? params.value : '';
        },
        valueSetter: params => {
          params.data.CropUnit = this.cropUnits.find(element => {
            return element.CropUnitName == params.newValue;
          });
          return true;
        },
        valueGetter: params => {
          return params.data.CropUnit ? params.data.CropUnit.CropUnitName : '';
        },
        // cellEditor: 'agSelectCellEditor',
        // cellEditorParams: {
        //   values: this.cropUnits.map(x => x.CropUnitName)
        // },
        // cellRenderer: EditableRendererComponent,
        // editable:true,
        sortable: true, 
        filter: true,
        resizable: true,
        width:150
      },
      {
        headerName: 'Price Per Crop Unit', 
        field:'PricePerCropUnit',
        valueFormatter: this.gridService.currencyFormatter,
        valueGetter: function(params:any) {
          return params.data.PricePerCropUnit
        },
        editable: true,
        cellEditor: DecimalEditor,
        sortable: true, 
        filter: true,
        cellStyle: params => {
          if (params.value >= 0) {
              return { backgroundColor: '#ccf5cc'};
          } 
          return {backgroundColor: '#ffdfd6'};
        },
        cellRenderer: EditableRendererComponent,
        width:150,
        resizable: true,
      },
      {
        headerName: 'Harvested Yield per Standard Bed', 
        field:'HarvestedYieldPerStandardUnitOfSpace',
        valueGetter: function(params:any) {
          return params.data.HarvestedYieldPerStandardUnitOfSpace
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
        cellRenderer: EditableRendererComponent,
        width:150,
        resizable: true,
      },
      {
        headerName: 'Marketable Yield per Standard Bed', 
        field:'MarketableYieldPerStandardUnitOfSpace',
        valueGetter: function(params:any) {
          return params.data.MarketableYieldPerStandardUnitOfSpace
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
        cellRenderer: EditableRendererComponent,
        width:150,
        resizable: true,
      },
      
      {
        headerName: 'Crop-Specific Post-Harvest Input Cost', 
        field:'PackagingCostPerCropUnit',
        valueFormatter: this.gridService.currencyFormatter,
        valueGetter: function(params:any) {
          return params.data.PackagingCostPerCropUnit
        },
        editable: true,
        cellEditor: DecimalEditor,
        sortable: true, 
        filter: true,
        cellStyle: params => {
          if (params.value || params.value == 0) {
              return { backgroundColor: '#ccf5cc'};
          } 
          return {backgroundColor: '#ffdfd6'};
        },
        cellRenderer: EditableRendererComponent,
        width:150,
        resizable: true,
      },
      {
        headerName: 'Delete', field: 'CropYieldInformationID', valueGetter: function (params: any) {
          return { ButtonText: 'Delete', CssClasses: "btn btn-fresca btn-sm", PrimaryKey: params.data.CropYieldInformationID, ObjectDisplayName: '' };
        }, cellRenderer: ButtonRendererComponent,
        cellRendererParams: { 
          clicked: function(field: any) {
            if(confirm(`Are you sure you want to delete this record?`)) {
              componentScope.deleteCropYieldInformation(field.PrimaryKey)
            }
          }
          },
        sortable: true, filter: true, width: 100
      },
    ]
  }

  

  deleteCropYieldInformation(cropYieldInformationID: number) {
    this.deleteCropYieldInfoRequest = this.workbookService.deleteCropYieldInformation(this.workbookID, cropYieldInformationID).subscribe(response => {
      var rowToRemove = this.gridApi.getRowNode(cropYieldInformationID.toString());
      this.gridApi.applyTransaction({remove:[rowToRemove.data]})
      this.refreshData();
      this.cdr.detectChanges();
    }, error => {

    })
  }

  onCellValueChanged(data: any) {
    var dtoToPost = data.data;

    this.updateCropYieldInfoRequest = this.workbookService.updateCropYieldInformation(dtoToPost).subscribe(cropYieldInfoDto => {
      data.node.setData(cropYieldInfoDto);
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

  private routeSubscription : Subscription = Subscription.EMPTY;
 ngOnDestroy(){
    this.routeSubscription.unsubscribe()
    this.watchUserChangeSubscription.unsubscribe();
    if (this.getWorkbookRequest && this.getWorkbookRequest.unsubscribe) {
      this.getWorkbookRequest.unsubscribe();
    }
    if (this.addCropYieldInformationRequest && this.addCropYieldInformationRequest.unsubscribe) {
      this.addCropYieldInformationRequest.unsubscribe();
    }
    if (this.getCropsRequest && this.getCropsRequest.unsubscribe) {
      this.getCropsRequest.unsubscribe();
    }

    if (this.updateCropYieldInfoRequest && this.updateCropYieldInfoRequest.unsubscribe) {
      this.updateCropYieldInfoRequest.unsubscribe();
    }
    if (this.deleteCropYieldInfoRequest && this.deleteCropYieldInfoRequest.unsubscribe) {
      this.deleteCropYieldInfoRequest.unsubscribe();
    }
    
    this.cdr.detach();
  }

  onSubmit(cropYieldInformationForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;
    this.addCropYieldInformationRequest = this.workbookService.addCropYieldInformation(this.model).subscribe(response => {
      this.isLoadingSubmit = false;
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

  resetForm() {
    this.model = new CropYieldInformationCreateDto({WorkbookID: this.workbookID});
    this.refreshData();
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  getRowId(params)  {
    return params.data.CropYieldInformationID.toString();
  }
  public exportToCsv() {
    let columnsKeys = this.cropYieldInformationGrid.api.getAllDisplayedColumns(); 
    let columnIds: Array<any> = []; 
    columnsKeys.forEach(keys => 
      { 
        let columnName: string = keys.getColId(); 
        columnIds.push(columnName); 
      });
    columnIds.splice(-1, 1); // remove the delete column from the download
    this.utilityFunctionsService.exportGridToCsv(this.cropYieldInformationGrid, 'Crop-Yield-Information.csv', columnIds);
  }  
}

