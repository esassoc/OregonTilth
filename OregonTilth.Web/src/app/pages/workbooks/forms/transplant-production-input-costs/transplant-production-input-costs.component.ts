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
import { FieldUnitTypeDto } from 'src/app/shared/models/generated/field-unit-type-dto';
import { LookupTablesService } from 'src/app/services/lookup-tables/lookup-tables.service';
import { forkJoin, Subscription } from 'rxjs';
import { ButtonRendererComponent } from 'src/app/shared/components/ag-grid/button-renderer/button-renderer.component';
import { TransplantProductionInputCostCreateDto } from 'src/app/shared/models/forms/transplant-production-input-costs/transplant-production-input-cost-create-dto';
import { TransplantProductionInputCostDto } from 'src/app/shared/models/generated/transplant-production-input-cost-dto';
import { TransplantProductionInputDto } from 'src/app/shared/models/generated/transplant-production-input-dto';
import { TransplantProductionTrayTypeDto } from 'src/app/shared/models/generated/transplant-production-tray-type-dto';
import { EditableRendererComponent } from 'src/app/shared/components/ag-grid/editable-renderer/editable-renderer.component';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
import { AlertDisplayComponent } from '../../../../shared/components/alert-display/alert-display.component';
import { CustomRichTextComponent } from '../../../../shared/components/custom-rich-text/custom-rich-text.component';
import { FormsModule } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'transplant-production-input-costs',
    templateUrl: './transplant-production-input-costs.component.html',
    styleUrls: ['./transplant-production-input-costs.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, CustomRichTextComponent, NgIf, FormsModule, NgFor, NgbTooltip, AgGridModule]
})
export class TransplantProductionInputCostsComponent implements OnInit {
  @ViewChild('transplantProductionInputCostsGrid') transplantProductionInputCostsGrid: AgGridAngular;
  constructor(private cdr: ChangeDetectorRef, 
    private authenticationService: AuthenticationService, 
    private workbookService: WorkbookService,
    private lookupTablesService: LookupTablesService,
    private alertService: AlertService,
    private gridService: GridService,
    private router: Router,
    private breadcrumbService: BreadcrumbsService,
    private utilityFunctionsService: UtilityFunctionsService, 
    private route: ActivatedRoute) { }

  private gridApi: any;
  private watchUserChangeSubscription: any;
  private currentUser: UserDetailedDto;
  public workbook: WorkbookDto;
  public richTextTypeID : number = CustomRichTextType.TPInputCostForm;
  public isLoadingSubmit: boolean = false;
  private workbookID: number;
  private getWorkbookRequest: any;
  private addTransplantProductionInputCostRequest: any;
  public model: TransplantProductionInputCostCreateDto;

  public getTransplantProductionInputCostsRequest: any;
  public transplantProductionInputCosts: TransplantProductionInputCostDto[];

  public transplantProductionInputs: Array<TransplantProductionInputDto>;
  private getTransplantProductionInputsRequest: any;

  public transplantProductionTrayTypes: Array<TransplantProductionTrayTypeDto>;
  private getTransplantProductionTrayTypesRequest: any;

  private updateTransplantProductionInputCostRequest: any;
  private deleteTransplantProductionInputCostRequest: any;

  public columnDefs: ColDef[];
 
  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      this.route.params.subscribe(params => {
        this.workbookID = parseInt(params['workbookID']);
        this.model = new TransplantProductionInputCostCreateDto({WorkbookID: this.workbookID});
      
        this.refreshData();
      });
      

    });
  }

  private refreshData() {
    this.getWorkbookRequest = this.workbookService.getWorkbook(this.workbookID);
    this.getTransplantProductionInputsRequest = this.workbookService.getTransplantProductionInputs(this.workbookID);
    this.getTransplantProductionTrayTypesRequest = this.workbookService.getTransplantProductionTrayTypes(this.workbookID);
    this.getTransplantProductionInputCostsRequest = this.workbookService.getTransplantProductionInputCosts(this.workbookID);

    forkJoin<[WorkbookDto, TransplantProductionInputDto[], TransplantProductionTrayTypeDto[], TransplantProductionInputCostDto[]]>([this.getWorkbookRequest, this.getTransplantProductionInputsRequest, this.getTransplantProductionTrayTypesRequest, this.getTransplantProductionInputCostsRequest]).subscribe(([workbook, tpInputs, tpTrayTypes, tpInputCosts]: [WorkbookDto, TransplantProductionInputDto[], TransplantProductionTrayTypeDto[], TransplantProductionInputCostDto[]]) => {
      this.workbook = workbook;
      this.breadcrumbService.setBreadcrumbs([{label:'Workbooks', routerLink:['/workbooks']},{label:workbook.WorkbookName, routerLink:['/workbooks',workbook.WorkbookID.toString()]}, {label:'Transplant Production Input Costs'}]);
      this.transplantProductionInputs = tpInputs;
      this.transplantProductionTrayTypes = tpTrayTypes;
      this.transplantProductionInputCosts = tpInputCosts;
      this.defineColumnDefs();
      this.cdr.markForCheck();
    });
  }

  defineColumnDefs() {
    var componentScope = this;
    this.columnDefs = [
      {
        headerName: 'TP Input', 
        field: 'TransplantProductionInput',
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: this.transplantProductionInputs.map(x => x.TransplantProductionInputName)
        },
        
        valueSetter: params => {
          params.data.TransplantProductionInput = this.transplantProductionInputs.find(element => {
            return element.TransplantProductionInputName == params.newValue;
          });
          return true;
        },
        valueGetter: params => {
          return params.data.TransplantProductionInput.TransplantProductionInputName;
        },
        cellRendererFramework: EditableRendererComponent,
        sortable: true, 
        filter: true,
        resizable: true
      },
      {
        headerName: 'TP Tray Type', 
        field: 'TransplantProductionTrayType',
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: this.transplantProductionTrayTypes.map(x => x.TransplantProductionTrayTypeName)
        },
        valueSetter: params => {
          params.data.TransplantProductionTrayType = this.transplantProductionTrayTypes.find(element => {
            return element.TransplantProductionTrayTypeName == params.newValue;
          });
          return true;
        },
        valueGetter: params => {
          return params.data.TransplantProductionTrayType.TransplantProductionTrayTypeName;
        },
        cellRendererFramework: EditableRendererComponent,
        sortable: true, 
        filter: true,
        resizable: true
      },
      {
        headerName: 'Cost Per Tray', 
        field: 'CostPerTray',
        editable: true,
        cellEditor: 'agTextCellEditor',
        valueFormatter: this.gridService.currencyFormatter,
        valueSetter: params => {
          params.data.CostPerTray = params.newValue;
          return true;
        },
        valueGetter: params => {
          return params.data.CostPerTray;
        },
        cellRendererFramework: EditableRendererComponent,
        sortable: true, 
        filter: true,
        resizable: true
      },
      {
        headerName: 'Notes', 
        field: 'Notes',
        editable: true,
        cellEditor: 'agTextCellEditor',
        cellRendererFramework: EditableRendererComponent,
        filter: true,
        sortable: true, 
        resizable: true
      },
      {
        headerName: 'Delete', field: 'TransplantProductionInputCostID', valueGetter: function (params: any) {
          return { ButtonText: 'Delete', CssClasses: "btn btn-fresca btn-sm", PrimaryKey: params.data.TransplantProductionInputCostID, ObjectDisplayName: params.data.TransplantProductionInputCostID };
        }, cellRendererFramework: ButtonRendererComponent,
        cellRendererParams: { 
          clicked: function(field: any) {
            if(confirm(`Are you sure you want to delete this input cost?`)) {
              componentScope.deleteTransplantProductionInputCost(field.PrimaryKey)
            }
          }
          },
        sortable: true, filter: true, width: 100, resizable: true
      },
    ]
  }

  deleteTransplantProductionInputCost(tpInputCostID: number) {
    this.deleteTransplantProductionInputCostRequest = this.workbookService.deleteTransplantProductionInputCost(this.workbookID, tpInputCostID).subscribe(tpInputCostDtos => {
      var rowToRemove = this.gridApi.getRowNode(tpInputCostID.toString());
      this.gridApi.applyTransaction({remove:[rowToRemove.data]})
      this.alertService.pushAlert(new Alert("Successfully deleted Transplant Production Input Cost", AlertContext.Success));
      this.cdr.detectChanges();
    }, error => {

    })
  }

  onCellValueChanged(data: any) {
    var dtoToPost = data.data;

    this.updateTransplantProductionInputCostRequest = this.workbookService.updateTransplantProductionInputCost(dtoToPost).subscribe(tpInputCost => {
      data.node.setData(tpInputCost);
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
    if (this.addTransplantProductionInputCostRequest && this.addTransplantProductionInputCostRequest.unsubscribe) {
      this.addTransplantProductionInputCostRequest.unsubscribe();
    }
    if (this.getTransplantProductionInputCostsRequest && this.getTransplantProductionInputCostsRequest.unsubscribe) {
      this.getTransplantProductionInputCostsRequest.unsubscribe();
    }
    if (this.getTransplantProductionInputsRequest && this.getTransplantProductionInputsRequest.unsubscribe) {
      this.getTransplantProductionInputsRequest.unsubscribe();
    }
    if (this.updateTransplantProductionInputCostRequest && this.updateTransplantProductionInputCostRequest.unsubscribe) {
      this.updateTransplantProductionInputCostRequest.unsubscribe();
    }
    if (this.deleteTransplantProductionInputCostRequest && this.deleteTransplantProductionInputCostRequest.unsubscribe) {
      this.deleteTransplantProductionInputCostRequest.unsubscribe();
    }
    
    this.cdr.detach();
  }

  onSubmit(fieldInputCostForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;
    this.addTransplantProductionInputCostRequest = this.workbookService.addTransplantProductionInputCost(this.model).subscribe(response => {
      this.isLoadingSubmit = false;

      var transactionRows = this.gridApi.applyTransaction({add: [response]});
      this.gridApi.flashCells({ rowNodes: transactionRows.add });
      this.alertService.pushAlert(new Alert("Successfully added Transplant Production Input Cost.", AlertContext.Success));
      this.resetForm();
      this.cdr.detectChanges();
      
    }, error => { 
      this.isLoadingSubmit = false;
      this.cdr.detectChanges();
    });
  }

  resetForm() {
    this.model = new TransplantProductionInputCostCreateDto({WorkbookID: this.workbookID});
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  getRowNodeId(data)  {
    return data.TransplantProductionInputCostID.toString();
  }
  
  public exportToCsv() {
    let columnsKeys = this.transplantProductionInputCostsGrid.columnApi.getAllDisplayedColumns(); 
    let columnIds: Array<any> = []; 
    columnsKeys.forEach(keys => 
      { 
        let columnName: string = keys.getColId(); 
        columnIds.push(columnName); 
      });
    columnIds.splice(-1, 1); // remove the delete column from the download
    this.utilityFunctionsService.exportGridToCsv(this.transplantProductionInputCostsGrid, 'Transplant-Production-Input-Costs.csv', columnIds);
  }  
}

