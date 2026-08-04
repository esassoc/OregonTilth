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
import { FieldLaborByCropCreateDto } from 'src/app/shared/models/forms/field-labor-by-crop/field-labor-by-crop-create-dto';
import { FieldLaborByCropDto } from 'src/app/shared/models/generated/field-labor-by-crop-dto';
import { CropDto } from 'src/app/shared/models/generated/crop-dto';
import { DecimalEditor } from 'src/app/shared/components/ag-grid/decimal-editor/decimal-editor.component';
import { EditableRendererComponent } from 'src/app/shared/components/ag-grid/editable-renderer/editable-renderer.component';
import { FieldStandardTimeDto } from 'src/app/shared/models/generated/field-standard-time-dto';
import { FieldStandardTimeSummaryDto } from 'src/app/shared/models/forms/field-standard-times/field-standard-time-summary-dto';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { UtilityFunctionsService } from 'src/app/services/utility-functions.service';
import { CropSpecificInfoSummaryDto } from 'src/app/shared/models/forms/crop-specific-info/crop-specific-info-summary-dto';
import { TpOrDsTypeEnum } from 'src/app/shared/models/enums/tp-or-ds-type.enum';
import { FieldUnitTypeEnum } from 'src/app/shared/models/enums/field-unit-type.enum';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
import { HarvestPostHarvestStandardTimeSummaryDto } from 'src/app/shared/models/forms/harvest-post-harvest-standard-times/harvest-post-harvest-standard-time-summary-dto';
import { AlertDisplayComponent } from '../../../../shared/components/alert-display/alert-display.component';
import { CustomRichTextComponent } from '../../../../shared/components/custom-rich-text/custom-rich-text.component';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'field-labor-by-crop',
    templateUrl: './field-labor-by-crop.component.html',
    styleUrls: ['./field-labor-by-crop.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, CustomRichTextComponent, NgIf, FormsModule, NgFor, NgMultiSelectDropDownModule, NgbTooltip, AgGridModule]
})
export class FieldLaborByCropComponent implements OnInit {
  @ViewChild('fieldLaborByCropGrid') fieldLaborByCropGrid: AgGridAngular;
  constructor(private cdr: ChangeDetectorRef, 
    private authenticationService: AuthenticationService, 
    private workbookService: WorkbookService,
    private lookupTablesService: LookupTablesService,
    private alertService: AlertService,
    private router: Router,
    private utilityFunctionsService: UtilityFunctionsService, 
    private breadcrumbService: BreadcrumbsService,
    private route: ActivatedRoute) { }

  private gridApi: any;
  private watchUserChangeSubscription: any;
  private currentUser: UserDetailedDto;
  public workbook: WorkbookDto;
  public richTextTypeID : number = CustomRichTextType.FieldLaborByCropForm;
  public isLoadingSubmit: boolean = false;
  private workbookID: number;
  private getWorkbookRequest: any;
  private addFieldLaborByCropRequest: any;
  public model: FieldLaborByCropCreateDto;

  public getFieldLaborByCropsRequest: any;
  public fieldLaborByCropDtos: FieldLaborByCropDto[];

  public cropDtos: CropDto[];
  private getCropDtosRequest: any;

  public fieldStandardTimeDtos: FieldStandardTimeSummaryDto[];
  public allFieldStandardTimeDtos: FieldStandardTimeSummaryDto[];
  private getFieldStandardTimeDtosRequest: any;

  public cropSpecificInfos: CropSpecificInfoSummaryDto[];

  private updateFieldLaborByCropRequest: any;
  private deleteFieldLaborByCropRequest: any;

  public columnDefs: ColDef[];
  public dropdownSettings = {};
 
  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      this.route.params.subscribe(params => {
        this.workbookID = parseInt(params['workbookID']);
        this.model = new FieldLaborByCropCreateDto({WorkbookID: this.workbookID});
      
        this.refreshData();
      });
      

    });
  }

  private refreshData() {
    this.getWorkbookRequest = this.workbookService.getWorkbook(this.workbookID);
    this.getCropDtosRequest = this.workbookService.getCrops(this.workbookID);
    this.getFieldStandardTimeDtosRequest = this.workbookService.getFieldStandardTimes(this.workbookID);
    
    this.getFieldLaborByCropsRequest = this.workbookService.getFieldLaborByCrops(this.workbookID);


    forkJoin<[WorkbookDto, CropDto[], FieldStandardTimeSummaryDto[], FieldLaborByCropDto[], CropSpecificInfoSummaryDto[], HarvestPostHarvestStandardTimeSummaryDto[]]>([this.getWorkbookRequest, this.getCropDtosRequest, this.getFieldStandardTimeDtosRequest, this.getFieldLaborByCropsRequest, this.workbookService.getCropSpecificInfos(this.workbookID), this.workbookService.getHarvestPostHarvestStandardTimes(this.workbookID)])
    .subscribe(([workbookDto, cropDtos, fieldStandardTimeDtos, fieldLaborByCrops, cropSpecificInfos, harvestPostHarvestStandardTimes]: [WorkbookDto, CropDto[], FieldStandardTimeSummaryDto[], FieldLaborByCropDto[], CropSpecificInfoSummaryDto[], HarvestPostHarvestStandardTimeSummaryDto[]]) => {
      this.workbook = workbookDto;
      this.breadcrumbService.setBreadcrumbs([{label:'Workbooks', routerLink:['/workbooks']},{label:workbookDto.WorkbookName, routerLink:['/workbooks',workbookDto.WorkbookID.toString()]}, {label:'Field Labor By Crop'}]);

      let validCrops = harvestPostHarvestStandardTimes.filter(x => x.StandardTimePerUnit > 0).map(x => x.Crop.CropID);
      this.cropDtos = cropDtos.filter(x => validCrops.includes(x.CropID));

      this.fieldStandardTimeDtos = fieldStandardTimeDtos.filter(x => {
        return x.StandardTimePerUnit > 0;
      });

      this.allFieldStandardTimeDtos = [... this.fieldStandardTimeDtos];
      this.fieldLaborByCropDtos = fieldLaborByCrops;
      this.cropSpecificInfos = cropSpecificInfos;
      this.defineColumnDefs();
      this.cdr.markForCheck();
    });

    this.dropdownSettings = {
      singleSelection: false,
      idField: 'FieldStandardTimeID',
      textField: 'FieldLaborActivityAndLaborTypeNameForDropdown',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 10,
      allowSearchFilter: true
    };
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  defineColumnDefs() {
    var componentScope = this;
    this.columnDefs = [
      {
        headerName: 'Crop', 
        field: 'Crop',
        editable: true,
        valueSetter: params => {
          params.data.Crop = this.cropDtos.find(element => {
            return element.CropName == params.newValue;
          });
          return true;
        },
        valueGetter: params => {
          return params.data.Crop ? params.data.Crop.CropName : '';
        },
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: this.cropDtos.map(x => x.CropName)
        },
        cellRenderer: EditableRendererComponent,
        sortable: true, 
        filter: true,
        resizable: true,
        
      },
      {
        headerName: 'Field Labor Activity', 
        field: 'FieldStandardTime.FieldLaborActivity.FieldLaborActivityName',
        editable: false,
        sortable: true, 
        filter: true,
        resizable: true
      },
      {
        headerName: 'Labor Type', 
        field: 'FieldStandardTime.LaborType.LaborTypeDisplayName',
        editable: false,
        sortable: true, 
        filter: true,
        resizable: true
      },
      {
        headerName: 'Notes', 
        field: 'Notes',
        editable: true,
        cellEditor: 'agLargeTextCellEditor',
        cellRenderer: EditableRendererComponent,
        resizable: true,
        cellEditorParams: {
          maxLength: 2000,
        },
      },
      {
        headerName: 'Occurrences', 
        field: 'Occurrences',
        editable: true,
        cellEditor: DecimalEditor,
        cellRenderer: EditableRendererComponent,
        sortable: true, 
        filter: true,
        cellStyle: params => {
          if (params.value) {
              return { backgroundColor: '#ccf5cc'};
          } 
          return {backgroundColor: '#ffdfd6'};
        },
        resizable: true
      },
      {
        headerName: 'Delete', valueGetter: function (params: any) {
          return { ButtonText: 'Delete', CssClasses: "btn btn-fresca btn-sm", PrimaryKey: params.data.FieldLaborByCropID, ObjectDisplayName: null };
        }, cellRenderer: ButtonRendererComponent,
        cellRendererParams: { 
          clicked: function(field: any) {
            if(confirm(`Are you sure you want to delete this record?`)) {
              componentScope.deleteFieldLaborByCrop(field.PrimaryKey)
            }
          }
          },
        sortable: true, filter: true, width: 100, resizable: true
      },
    ]
  }

  deleteFieldLaborByCrop(fieldLaborByCropID: number) {
    this.deleteFieldLaborByCropRequest = this.workbookService.deleteFieldLaborByCrop(this.workbookID, fieldLaborByCropID).subscribe(fieldLaborByCropDtos => {
      this.fieldLaborByCropDtos = fieldLaborByCropDtos;
      this.alertService.pushAlert(new Alert("Successfully deleted Field Labor By Crop", AlertContext.Success));
      this.cdr.detectChanges();
    }, error => {

    })
  }

  onCellValueChanged(data: any) {
    var dtoToPost = data.data;

    this.updateFieldLaborByCropRequest = this.workbookService.updateFieldLaborByCrop(dtoToPost).subscribe(fieldLaborByCrop => {
      data.node.setData(fieldLaborByCrop);
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
    if (this.addFieldLaborByCropRequest && this.addFieldLaborByCropRequest.unsubscribe) {
      this.addFieldLaborByCropRequest.unsubscribe();
    }
    if (this.getFieldLaborByCropsRequest && this.getFieldLaborByCropsRequest.unsubscribe) {
      this.getFieldLaborByCropsRequest.unsubscribe();
    }
    if (this.updateFieldLaborByCropRequest && this.updateFieldLaborByCropRequest.unsubscribe) {
      this.updateFieldLaborByCropRequest.unsubscribe();
    }
    if (this.deleteFieldLaborByCropRequest && this.deleteFieldLaborByCropRequest.unsubscribe) {
      this.deleteFieldLaborByCropRequest.unsubscribe();
    }
    if (this.getCropDtosRequest && this.getCropDtosRequest.unsubscribe) {
      this.getCropDtosRequest.unsubscribe();
    }
    if (this.getFieldStandardTimeDtosRequest && this.getFieldStandardTimeDtosRequest.unsubscribe) {
      this.getFieldStandardTimeDtosRequest.unsubscribe();
    }

    
    this.cdr.detach();
  }

  onSubmit(fieldLaborByCropForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;


    this.addFieldLaborByCropRequest = this.workbookService.addFieldLaborByCrop(this.model).subscribe(response => {
      var transactionRows = this.gridApi.applyTransaction({add: response });
      this.gridApi.flashCells({
        rowNodes: transactionRows.add
      });
      this.isLoadingSubmit = false;
      if(response.length > 0){

        var successMessage = `Successfully added ${response.length} Field Labor By Crop(s) for Crop '${response[0].Crop.CropName}'.`;
        
        if(response.length < this.model.FieldStandardTimes.length) {
          var inputIDsAdded = response.map(x => x.FieldStandardTime.FieldStandardTimeID);
          var inputsNotAdded = this.model.FieldStandardTimes.filter(x => !inputIDsAdded.includes(x.FieldStandardTimeID));
          var inputsNotAddedString = inputsNotAdded.map(x => '<strong>\'' + x.FieldLaborActivityAndLaborTypeNameForDropdown + '\'</strong>').join(', ');
          successMessage += `<br><strong>NOTE:</strong> Could not add the Field Inputs ${inputsNotAddedString} because they have already been entered for this Crop.`;
        }




        this.alertService.pushAlert(new Alert(successMessage, AlertContext.Success));






      }else{
        var activitiesString = this.model.FieldStandardTimes.map(x => '<strong>\'' + x.FieldLaborActivityAndLaborTypeNameForDropdown + '\'</strong>').join(', ');

        var infoMessage = `Could not add the Field Labor Activities ${activitiesString} because they have already been entered for this Crop.`;

        this.alertService.pushAlert(new Alert(infoMessage, AlertContext.Info));
      }
      this.resetForm();
      this.cdr.detectChanges();
      
    }, error => { 
      this.isLoadingSubmit = false;
      this.cdr.detectChanges();
    });

  }

  cropSelectionChanged(cropID: string) {
    /**
     *  check the Crop Planting Info form to see if the TP Type or DS has DS selected for a crop when that 
     *  crop is linked to Field Labor Activities on Field Labor by Crop, where the Field Unit for the Field Labor Activity
     *  is “Transplant” on Field Labor Time Studies. If this is the case, don’t allow them to select the Field Labor Activity for the Crop. 
     */
    var directSeededInfos = this.cropSpecificInfos.filter(x => x.TpOrDsType.TpOrDsTypeID == TpOrDsTypeEnum.DirectSeeded && x.Crop.CropID == parseInt(cropID));
    if(directSeededInfos.length > 0) {
      this.fieldStandardTimeDtos = this.allFieldStandardTimeDtos.filter(x => x.FieldUnitType.FieldUnitTypeID != FieldUnitTypeEnum.Transplants)
    } else {
      this.fieldStandardTimeDtos = this.allFieldStandardTimeDtos;
    }
  }

  resetForm() {
    this.model = new FieldLaborByCropCreateDto({WorkbookID: this.workbookID});
  }

  public exportToCsv() {
    let columnsKeys = this.fieldLaborByCropGrid.api.getAllDisplayedColumns(); 
    let columnIds: Array<any> = []; 
    columnsKeys.forEach(keys => 
      { 
        let columnName: string = keys.getColId(); 
        columnIds.push(columnName); 
      });
    columnIds.splice(-1, 1); // remove the delete column from the download
    this.utilityFunctionsService.exportGridToCsv(this.fieldLaborByCropGrid, 'Field-Labor-By-Crop.csv', columnIds);
  }  
}

