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
import { ButtonRendererComponent } from 'src/app/shared/components/ag-grid/button-renderer/button-renderer.component';
import { TransplantProductionInputDto } from 'src/app/shared/models/generated/transplant-production-input-dto';
import { TransplantProductionInputCreateDto } from 'src/app/shared/models/forms/transplant-production-inputs/transplant-production-input-create-dto';
import { EditableRendererComponent } from 'src/app/shared/components/ag-grid/editable-renderer/editable-renderer.component';
import { AgGridAngular } from 'ag-grid-angular';
import { UtilityFunctionsService } from 'src/app/services/utility-functions.service';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';

@Component({
  selector: 'transplant-production-inputs',
  templateUrl: './transplant-production-inputs.component.html',
  styleUrls: ['./transplant-production-inputs.component.scss']
})
export class TransplantProductionInputsComponent implements OnInit {
  @ViewChild('transplantProductionInputsGrid') transplantProductionInputsGrid: AgGridAngular;
  constructor(private cdr: ChangeDetectorRef, 
    private authenticationService: AuthenticationService, 
    private workbookService: WorkbookService,
    private alertService: AlertService,
    private breadcrumbService: BreadcrumbsService,
    private router: Router,
    private utilityFunctionsService: UtilityFunctionsService, 
    private route: ActivatedRoute) { }

  private gridApi: any;
  private watchUserChangeSubscription: any;
  private currentUser: UserDetailedDto;
  public workbook: WorkbookDto;
  public richTextTypeID : number = CustomRichTextType.TPInputForm;
  public isLoadingSubmit: boolean = false;
  private workbookID: number;
  private getWorkbookRequest: any;
  private addTransplantProductionInputRequest: any;
  public model: TransplantProductionInputCreateDto;

  public getTransplantProductionInputsRequest: any;
  public transplantProductionInputs: TransplantProductionInputDto[];

  private updateTransplantProductionInputRequest: any;
  private deleteTransplantProductionInputRequest: any;

  public columnDefs: ColDef[];
 
  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      this.route.params.subscribe(params => {
        this.workbookID = parseInt(params['workbookID']);
      });
      this.model = new TransplantProductionInputCreateDto({WorkbookID: this.workbookID});
      
      this.refreshData();

    });
  }

  private refreshData() {
    this.getWorkbookRequest = this.workbookService.getWorkbook(this.workbookID);
    this.getTransplantProductionInputsRequest = this.workbookService.getTransplantProductionInputs(this.workbookID);

    forkJoin<[WorkbookDto, TransplantProductionInputDto[]]>([this.getWorkbookRequest, this.getTransplantProductionInputsRequest]).subscribe(([workbook, tpInputs]: [WorkbookDto, TransplantProductionInputDto[]]) => {
      this.workbook = workbook;
      this.breadcrumbService.setBreadcrumbs([{label:'Workbooks', routerLink:['/workbooks']},{label:workbook.WorkbookName, routerLink:['/workbooks',workbook.WorkbookID.toString()]}, {label:'Transplant Production Inputs'}]);

      this.transplantProductionInputs = tpInputs;
      this.defineColumnDefs();
      this.cdr.markForCheck();
    });
  }

  defineColumnDefs() {
    var componentScope = this;
    this.columnDefs = [
      {
        headerName: 'TP Input', 
        field: 'TransplantProductionInputName',
        editable: true,
        cellEditor: 'agTextCellEditor',
        cellRendererFramework: EditableRendererComponent,
        sortable: true, 
        filter: true,
        resizable: true
      },
      {
        headerName: 'Delete', field: 'TransplantProductionInputID', valueGetter: function (params: any) {
          return { ButtonText: 'Delete', CssClasses: "btn btn-fresca btn-sm", PrimaryKey: params.data.TransplantProductionInputID, ObjectDisplayName: params.data.TransplantProductionInputName };
        }, cellRendererFramework: ButtonRendererComponent,
        cellRendererParams: { 
          clicked: function(field: any) {
            if(confirm(`Are you sure you want to delete the ${field.ObjectDisplayName} Transplant Production Input?`)) {
              componentScope.deleteTransplantProductionInput(field.PrimaryKey)
            }
          }
          },
        sortable: true, filter: true, width: 100, resizable: true
      },
    ]
  }

  deleteTransplantProductionInput(tpInputID: number) {
    this.deleteTransplantProductionInputRequest = this.workbookService.deleteTransplantProductionInput(this.workbookID, tpInputID).subscribe(transplantProductionInputDtos => {
      var rowToRemove = this.gridApi.getRowNode(tpInputID.toString());
      this.gridApi.applyTransaction({remove:[rowToRemove.data]})
      this.alertService.pushAlert(new Alert("Successfully deleted Transplant Production Input", AlertContext.Success));
      this.cdr.detectChanges();
    }, error => {

    })
  }

  onCellValueChanged(data: any) {
    var dtoToPost = data.data;

    this.updateTransplantProductionInputRequest = this.workbookService.updateTransplantProductionInput(dtoToPost).subscribe(tpInput => {
      data.node.setData(tpInput);
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
    if (this.addTransplantProductionInputRequest && this.addTransplantProductionInputRequest.unsubscribe) {
      this.addTransplantProductionInputRequest.unsubscribe();
    }
    if (this.getTransplantProductionInputsRequest && this.getTransplantProductionInputsRequest.unsubscribe) {
      this.getTransplantProductionInputsRequest.unsubscribe();
    }
    
    if (this.updateTransplantProductionInputRequest && this.updateTransplantProductionInputRequest.unsubscribe) {
      this.updateTransplantProductionInputRequest.unsubscribe();
    }
    if (this.deleteTransplantProductionInputRequest && this.deleteTransplantProductionInputRequest.unsubscribe) {
      this.deleteTransplantProductionInputRequest.unsubscribe();
    }
    
    this.cdr.detach();
  }

  onSubmit(fieldLaborActivityForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;
    this.addTransplantProductionInputRequest = this.workbookService.addTransplantProductionInput(this.model).subscribe(response => {
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
    this.model = new TransplantProductionInputCreateDto({WorkbookID: this.workbookID});
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  getRowNodeId(data)  {
    return data.TransplantProductionInputID.toString();
  }

  public exportToCsv() {
    let columnsKeys = this.transplantProductionInputsGrid.columnApi.getAllDisplayedColumns(); 
    let columnIds: Array<any> = []; 
    columnsKeys.forEach(keys => 
      { 
        let columnName: string = keys.getColId(); 
        columnIds.push(columnName); 
      });
    columnIds.splice(-1, 1); // remove the delete column from the download
    this.utilityFunctionsService.exportGridToCsv(this.transplantProductionInputsGrid, 'Transplant-Production-Inputs.csv', columnIds);
  }  

}

