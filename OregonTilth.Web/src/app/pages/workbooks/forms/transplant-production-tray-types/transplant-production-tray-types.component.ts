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
import { TransplantProductionTrayTypeCreateDto } from 'src/app/shared/models/forms/transplant-production-tray-types/transplant-production-tray-type-create-dto';
import { TransplantProductionTrayTypeDto } from 'src/app/shared/models/generated/transplant-production-tray-type-dto';
import { EditableRendererComponent } from 'src/app/shared/components/ag-grid/editable-renderer/editable-renderer.component';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { UtilityFunctionsService } from 'src/app/services/utility-functions.service';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
import { AlertDisplayComponent } from '../../../../shared/components/alert-display/alert-display.component';
import { CustomRichTextComponent } from '../../../../shared/components/custom-rich-text/custom-rich-text.component';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'transplant-production-tray-types',
    templateUrl: './transplant-production-tray-types.component.html',
    styleUrls: ['./transplant-production-tray-types.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, CustomRichTextComponent, NgIf, FormsModule, NgbTooltip, AgGridModule]
})
export class TransplantProductionTrayTypesComponent implements OnInit {
  @ViewChild('transplantProductionTrayTypesGrid') transplantProductionTrayTypesGrid: AgGridAngular;
  constructor(private cdr: ChangeDetectorRef, 
    private authenticationService: AuthenticationService, 
    private workbookService: WorkbookService,
    private alertService: AlertService,
    private router: Router,
    private utilityFunctionsService: UtilityFunctionsService, 
    private breadcrumbService: BreadcrumbsService,
    private route: ActivatedRoute) { }

  private gridApi: any;
  private watchUserChangeSubscription: any;
  private currentUser: UserDetailedDto;
  public workbook: WorkbookDto;
  public richTextTypeID : number = CustomRichTextType.TPTrayTypeForm;
  public isLoadingSubmit: boolean = false;
  private workbookID: number;
  private getWorkbookRequest: any;
  private addTransplantProductionTrayTypeRequest: any;
  public model: TransplantProductionTrayTypeCreateDto;

  public getTransplantProductionTrayTypesRequest: any;
  public transplantProductionTrayTypes: TransplantProductionTrayTypeDto[];

  private updateTransplantProductionTrayTypeRequest: any;
  private deleteTransplantProductionTrayTypeRequest: any;

  public columnDefs: ColDef[];
 
  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      this.route.params.subscribe(params => {
        this.workbookID = parseInt(params['workbookID']);
        this.model = new TransplantProductionTrayTypeCreateDto({WorkbookID: this.workbookID});
      
        this.refreshData();
      });
        
      

    });
  }

  private refreshData() {
    this.getWorkbookRequest = this.workbookService.getWorkbook(this.workbookID);
    this.getTransplantProductionTrayTypesRequest = this.workbookService.getTransplantProductionTrayTypes(this.workbookID);

    forkJoin<[WorkbookDto, TransplantProductionTrayTypeDto[]]>([this.getWorkbookRequest, this.getTransplantProductionTrayTypesRequest]).subscribe(([workbook, tpTrayTypes]: [WorkbookDto, TransplantProductionTrayTypeDto[]]) => {
      this.workbook = workbook;
      this.breadcrumbService.setBreadcrumbs([{label:'Workbooks', routerLink:['/workbooks']},{label:workbook.WorkbookName, routerLink:['/workbooks',workbook.WorkbookID.toString()]}, {label:'Transplant Production Tray Types'}]);

      this.transplantProductionTrayTypes = tpTrayTypes;
      this.defineColumnDefs();
      this.cdr.markForCheck();
    });
  }

  defineColumnDefs() {
    var componentScope = this;
    this.columnDefs = [
      {
        headerName: 'TP Tray Type', 
        field: 'TransplantProductionTrayTypeName',
        editable: true,
        cellEditor: 'agTextCellEditor',
        cellRendererFramework: EditableRendererComponent,
        sortable: true, 
        filter: true,
        resizable: true
      },
      {
        headerName: 'Delete', field: 'TransplantProductionTrayTypeID', valueGetter: function (params: any) {
          return { ButtonText: 'Delete', CssClasses: "btn btn-fresca btn-sm", PrimaryKey: params.data.TransplantProductionTrayTypeID, ObjectDisplayName: params.data.TransplantProductionTrayTypeName };
        }, cellRendererFramework: ButtonRendererComponent,
        cellRendererParams: { 
          clicked: function(field: any) {
            if(confirm(`Are you sure you want to delete the ${field.ObjectDisplayName} Transplant Production Tray Type?`)) {
              componentScope.deleteTransplantProductionTrayType(field.PrimaryKey)
            }
          }
          },
        sortable: true, filter: true, width: 100, resizable: true
      },
    ]
  }

  deleteTransplantProductionTrayType(tpInputID: number) {
    this.deleteTransplantProductionTrayTypeRequest = this.workbookService.deleteTransplantProductionTrayType(this.workbookID, tpInputID).subscribe(transplantProductionTrayTypeDtos => {
      this.transplantProductionTrayTypes = transplantProductionTrayTypeDtos;
      this.alertService.pushAlert(new Alert("Successfully deleted Transplant Production Tray Type", AlertContext.Success));
      this.cdr.detectChanges();
    }, error => {

    })
  }

  onCellValueChanged(data: any) {
    var dtoToPost = data.data;

    this.updateTransplantProductionTrayTypeRequest = this.workbookService.updateTransplantProductionTrayType(dtoToPost).subscribe(tpTrayTypeDto => {
      data.node.setData(tpTrayTypeDto);
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
    if (this.addTransplantProductionTrayTypeRequest && this.addTransplantProductionTrayTypeRequest.unsubscribe) {
      this.addTransplantProductionTrayTypeRequest.unsubscribe();
    }
    if (this.getTransplantProductionTrayTypesRequest && this.getTransplantProductionTrayTypesRequest.unsubscribe) {
      this.getTransplantProductionTrayTypesRequest.unsubscribe();
    }
    
    if (this.updateTransplantProductionTrayTypeRequest && this.updateTransplantProductionTrayTypeRequest.unsubscribe) {
      this.updateTransplantProductionTrayTypeRequest.unsubscribe();
    }
    if (this.deleteTransplantProductionTrayTypeRequest && this.deleteTransplantProductionTrayTypeRequest.unsubscribe) {
      this.deleteTransplantProductionTrayTypeRequest.unsubscribe();
    }
    
    this.cdr.detach();
  }

  onSubmit(fieldLaborActivityForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;
    this.addTransplantProductionTrayTypeRequest = this.workbookService.addTransplantProductionTrayType(this.model).subscribe(response => {
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
    this.model = new TransplantProductionTrayTypeCreateDto({WorkbookID: this.workbookID});
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  public exportToCsv() {
    let columnsKeys = this.transplantProductionTrayTypesGrid.columnApi.getAllDisplayedColumns(); 
    let columnIds: Array<any> = []; 
    columnsKeys.forEach(keys => 
      { 
        let columnName: string = keys.getColId(); 
        columnIds.push(columnName); 
      });
    columnIds.splice(-1, 1); // remove the delete column from the download
    this.utilityFunctionsService.exportGridToCsv(this.transplantProductionTrayTypesGrid, 'Transplant-Production-Tray-Types.csv', columnIds);
  }  

}

