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
import { FieldInputByCropDto } from 'src/app/shared/models/generated/field-input-by-crop-dto';
import { FieldInputByCropCreateDto } from 'src/app/shared/models/forms/field-input-by-crop/field-input-by-crop-create-dto';
import { FieldInputCostDto } from 'src/app/shared/models/generated/field-input-cost-dto';
import { DecimalEditor } from 'src/app/shared/components/ag-grid/decimal-editor/decimal-editor.component';
import { EditableRendererComponent } from 'src/app/shared/components/ag-grid/editable-renderer/editable-renderer.component';
import { UtilityFunctionsService } from 'src/app/services/utility-functions.service';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { CropSpecificInfoSummaryDto } from 'src/app/shared/models/forms/crop-specific-info/crop-specific-info-summary-dto';
import { FieldUnitTypeEnum } from 'src/app/shared/models/enums/field-unit-type.enum';
import { TpOrDsTypeEnum } from 'src/app/shared/models/enums/tp-or-ds-type.enum';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
import { AlertDisplayComponent } from '../../../../shared/components/alert-display/alert-display.component';
import { CustomRichTextComponent } from '../../../../shared/components/custom-rich-text/custom-rich-text.component';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
@Component({
    selector: 'field-input-labor-by-crop',
    templateUrl: './field-input-by-crop.component.html',
    styleUrls: ['./field-input-by-crop.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, CustomRichTextComponent, NgIf, FormsModule, NgFor, NgMultiSelectDropDownModule, NgbTooltip, AgGridModule]
})
export class FieldInputByCropComponent implements OnInit {
  @ViewChild('fieldInputByCropGrid') fieldInputByCropGrid: AgGridAngular;
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
  public richTextTypeID : number = CustomRichTextType.FieldInputByCropForm;
  public isLoadingSubmit: boolean = false;
  private workbookID: number;
  private getWorkbookRequest: any;
  private addFieldInputByCropRequest: any;
  public model: FieldInputByCropCreateDto;

  public getFieldInputByCropsRequest: any;
  public fieldInputByCropDtos: FieldInputByCropDto[];

  public cropDtos: CropDto[];
  private getCropDtosRequest: any;

  public fieldInputCostDtos: FieldInputCostDto[];
  public allFieldInputCostDtos: FieldInputCostDto[];
  private getFieldInputCostDtosRequest: any;

  private updateFieldInputByCropRequest: any;
  private deleteFieldInputByCropRequest: any;

  public cropSpecificInfos: CropSpecificInfoSummaryDto[];

  public columnDefs: ColDef[];

  public dropdownSettings = {};
 
  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      this.route.params.subscribe(params => {
        this.workbookID = parseInt(params['workbookID']);
        this.model = new FieldInputByCropCreateDto({WorkbookID: this.workbookID});
      
        this.refreshData();
      });
        

    });
  }

  private refreshData() {
    this.getWorkbookRequest = this.workbookService.getWorkbook(this.workbookID);
    this.getCropDtosRequest = this.workbookService.getCrops(this.workbookID);
    this.getFieldInputCostDtosRequest = this.workbookService.getFieldInputCosts(this.workbookID);

    this.getFieldInputByCropsRequest = this.workbookService.getFieldInputByCrops(this.workbookID);

    forkJoin<[WorkbookDto, CropDto[], FieldInputCostDto[], FieldInputByCropDto[], CropSpecificInfoSummaryDto[]]>([this.getWorkbookRequest, this.getCropDtosRequest, this.getFieldInputCostDtosRequest, this.getFieldInputByCropsRequest, this.workbookService.getCropSpecificInfos(this.workbookID)])
    .subscribe(([workbookDto, cropDtos, fieldInputCostDtos, fieldInputByCrops, cropSpecificInfos]
      : [WorkbookDto, CropDto[], FieldInputCostDto[], FieldInputByCropDto[],CropSpecificInfoSummaryDto[]]) => {
      this.workbook = workbookDto;
      this.breadcrumbService.setBreadcrumbs([{label:'Workbooks', routerLink:['/workbooks']},{label:workbookDto.WorkbookName, routerLink:['/workbooks',workbookDto.WorkbookID.toString()]}, {label:'Field Input By Crop'}]);
      this.cropDtos = cropDtos;
      this.fieldInputCostDtos = fieldInputCostDtos;
      this.allFieldInputCostDtos = [...fieldInputCostDtos];
      this.fieldInputByCropDtos = fieldInputByCrops;
      this.cropSpecificInfos = cropSpecificInfos;
      this.defineColumnDefs();
      this.cdr.markForCheck();
    });

    this.dropdownSettings = {
      singleSelection: false,
      idField: 'FieldInputCostID',
      textField: 'FieldInputCostName',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 10,
      allowSearchFilter: true
    };
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
          return params.data.Crop.CropName;
        },
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: this.cropDtos.map(x => x.CropName)
        },
        cellRenderer: EditableRendererComponent,
        sortable: true, 
        filter: true,
        resizable: true
      },
      {
        headerName: 'Field Input', 
        field: 'FieldInputCost',
        editable: true,
        valueSetter: params => {
          params.data.FieldInputCost = this.fieldInputCostDtos.find(element => {
            return element.FieldInputCostName == params.newValue;
          });
          return true;
        },
        valueGetter: params => {
          return params.data.FieldInputCost.FieldInputCostName;
        },
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: this.fieldInputCostDtos.map(x => x.FieldInputCostName)
        },
        cellRenderer: EditableRendererComponent,
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
        sortable: true, 
        filter: true,
        cellStyle: params => {
          if (params.value) {
              return { backgroundColor: '#ccf5cc'};
          } 
          return {backgroundColor: '#ffdfd6'};
        },
        cellRenderer: EditableRendererComponent,
        resizable: true
      },
      {
        headerName: 'Delete', valueGetter: function (params: any) {
          return { ButtonText: 'Delete', CssClasses: "btn btn-fresca btn-sm", PrimaryKey: params.data.FieldInputByCropID, ObjectDisplayName: null };
        }, cellRenderer: ButtonRendererComponent,
        cellRendererParams: { 
          clicked: function(field: any) {
            if(confirm(`Are you sure you want to delete this record?`)) {
              componentScope.deleteFieldInputByCrop(field.PrimaryKey)
            }
          }
          },
        sortable: true, filter: true, width: 100, resizable: true
      },
    ]
  }

  deleteFieldInputByCrop(fieldInputByCropID: number) {
    this.deleteFieldInputByCropRequest = this.workbookService.deleteFieldInputByCrop(this.workbookID, fieldInputByCropID).subscribe(fieldInputByCropDtos => {
      this.fieldInputByCropDtos = fieldInputByCropDtos;
      this.alertService.pushAlert(new Alert("Successfully deleted Field Input By Crop", AlertContext.Success));
      this.cdr.detectChanges();
      this.gridApi.redrawRows();
    }, error => {

    })
  }

  onCellValueChanged(data: any) {
    var dtoToPost = data.data;

    this.updateFieldInputByCropRequest = this.workbookService.updateFieldInputByCrop(dtoToPost).subscribe(fieldInputByCrop => {
      data.node.setData(fieldInputByCrop);
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

  private routeSubscription : Subscription = Subscription.EMPTY;
 ngOnDestroy(){
    this.routeSubscription.unsubscribe()
    this.watchUserChangeSubscription.unsubscribe();
    if (this.getWorkbookRequest && this.getWorkbookRequest.unsubscribe) {
      this.getWorkbookRequest.unsubscribe();
    }
    if (this.addFieldInputByCropRequest && this.addFieldInputByCropRequest.unsubscribe) {
      this.addFieldInputByCropRequest.unsubscribe();
    }
    if (this.getFieldInputByCropsRequest && this.getFieldInputByCropsRequest.unsubscribe) {
      this.getFieldInputByCropsRequest.unsubscribe();
    }
    if (this.updateFieldInputByCropRequest && this.updateFieldInputByCropRequest.unsubscribe) {
      this.updateFieldInputByCropRequest.unsubscribe();
    }
    if (this.deleteFieldInputByCropRequest && this.deleteFieldInputByCropRequest.unsubscribe) {
      this.deleteFieldInputByCropRequest.unsubscribe();
    }
    if (this.getCropDtosRequest && this.getCropDtosRequest.unsubscribe) {
      this.getCropDtosRequest.unsubscribe();
    }
    if (this.getFieldInputCostDtosRequest && this.getFieldInputCostDtosRequest.unsubscribe) {
      this.getFieldInputCostDtosRequest.unsubscribe();
    }

    
    this.cdr.detach();
  }

  onSubmit(fieldInputByCropForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;
    this.addFieldInputByCropRequest = this.workbookService.addFieldInputByCrop(this.model).subscribe(response => {
      var transactionRows = this.gridApi.applyTransaction({add: response });
      this.gridApi.flashCells({
        rowNodes: transactionRows.add
      });
      this.isLoadingSubmit = false;
      if(response.length > 0){
        var successMessage = `Successfully added ${response.length} Field Input By Crop(s) for Crop '${response[0].Crop.CropName}'.`;

        if(response.length < this.model.FieldInputCosts.length) {
          var inputIDsAdded = response.map(x => x.FieldInputCost.FieldInputCostID);
          var inputsNotAdded = this.model.FieldInputCosts.filter(x => !inputIDsAdded.includes(x.FieldInputCostID));
          var inputsNotAddedString = inputsNotAdded.map(x => '<strong>\'' + x.FieldInputCostName + '\'</strong>').join(', ');
          successMessage += `<br><strong>NOTE:</strong> Could not add the Field Inputs ${inputsNotAddedString} because they have already been entered for this Crop.`;
        }

        this.alertService.pushAlert(new Alert(successMessage, AlertContext.Success));
      }else{
        this.alertService.pushAlert(new Alert(`No Field Input By Crop was added.`, AlertContext.Info));
      }
      this.resetForm();
      this.cdr.detectChanges();
      
    }, error => { 
      this.isLoadingSubmit = false;
      this.cdr.detectChanges();
    });
  }

  resetForm() {
    this.model = new FieldInputByCropCreateDto({WorkbookID: this.workbookID});
  }
  public exportToCsv() {
    let columnsKeys = this.fieldInputByCropGrid.api.getAllDisplayedColumns(); 
    let columnIds: Array<any> = []; 
    columnsKeys.forEach(keys => 
      { 
        let columnName: string = keys.getColId(); 
        columnIds.push(columnName); 
      });
    columnIds.splice(-1, 1); // remove the delete column from the download
    this.utilityFunctionsService.exportGridToCsv(this.fieldInputByCropGrid, 'Field-Input-By-Crop.csv', columnIds);
  }  


  cropSelectionChanged(cropID: string) {
    /**
     * Check the Crop Planting Info form to see if the TP Type or DS has DS selected for a crop when that crop is linked to 
     * Field Inputs on Field Input by Crop, where the Field Unit for the Field Inputs is “Transplant” on Field Input Costs. 
     * If this is the case, don’t allow them to select the Field Input for the Crop. 
     */
    var directSeededInfos = this.cropSpecificInfos.filter(x => x.TpOrDsType.TpOrDsTypeID == TpOrDsTypeEnum.DirectSeeded && x.Crop.CropID == parseInt(cropID));
    if(directSeededInfos.length > 0) {
      this.fieldInputCostDtos = this.allFieldInputCostDtos.filter(x => x.FieldUnitType.FieldUnitTypeID != FieldUnitTypeEnum.Transplants)
    } else {
      this.fieldInputCostDtos = this.allFieldInputCostDtos;
    }
  }
}