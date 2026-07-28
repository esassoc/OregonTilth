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
import { AlertService } from 'src/app/shared/services/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { forkJoin, Subscription } from 'rxjs';
import { ButtonRendererComponent } from 'src/app/shared/components/ag-grid/button-renderer/button-renderer.component';
import { CropCreateDto } from 'src/app/shared/models/forms/crops/crop-create-dto';
import { CropDto } from 'src/app/shared/models/generated/crop-dto';
import { TransplantProductionInformationCreateDto } from 'src/app/shared/models/forms/transplant-production-information/transplant-production-information-create-dto';
import { TransplantProductionInformationDto } from 'src/app/shared/models/generated/transplant-production-information-dto';
import { PhaseDto } from 'src/app/shared/models/generated/phase-dto';
import { TransplantProductionTrayTypeDto } from 'src/app/shared/models/generated/transplant-production-tray-type-dto';
import { LookupTablesService } from 'src/app/services/lookup-tables/lookup-tables.service';
import { IntegerEditor } from 'src/app/shared/components/ag-grid/integer-editor/integer-editor.component';
import { DecimalEditor } from 'src/app/shared/components/ag-grid/decimal-editor/decimal-editor.component';
import { PhaseEnum } from 'src/app/shared/models/enums/phase.enum';
import { EditableRendererComponent } from 'src/app/shared/components/ag-grid/editable-renderer/editable-renderer.component';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
import { AlertDisplayComponent } from '../../../../shared/components/alert-display/alert-display.component';
import { CustomRichTextComponent } from '../../../../shared/components/custom-rich-text/custom-rich-text.component';
import { FormsModule } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'transplant-production-information',
    templateUrl: './transplant-production-information.component.html',
    styleUrls: ['./transplant-production-information.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, CustomRichTextComponent, NgIf, FormsModule, NgFor, NgbTooltip, AgGridModule]
})
export class TransplantProductionInformationComponent implements OnInit {
  @ViewChild('tpInfoGrid') tpInfoGrid: AgGridAngular;
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
  public richTextTypeID : number = CustomRichTextType.TPInfoForm;
  public isLoadingSubmit: boolean = false;
  private workbookID: number;
  private getWorkbookRequest: any;
  public seedingPhaseEnum = PhaseEnum.Seeding;

  public model: TransplantProductionInformationCreateDto;
  private addTpInfoRequest: any;

  public getTpInfoDtosRequest: any;
  public transplantProductionInformationDtos: TransplantProductionInformationDto[];

  private updateTpInfoRequest: any;
  private deleteTpInfoRequest: any;

  public pottingUpPhaseID: PhaseEnum.PottingUp;

  private getCropsRequest: any;
  public cropDtos: CropDto[];

  private getPhasesRequest: any;
  public phaseDtos: PhaseDto[];

  private getTrayTypesRequest: any;
  public tpTrayTypeDtos: TransplantProductionTrayTypeDto[];

  public columnDefs: ColDef[];
 
  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      this.route.params.subscribe(params => {
        this.workbookID = parseInt(params['workbookID']);
        this.model = new TransplantProductionInformationCreateDto({WorkbookID: this.workbookID});
      
        this.refreshData();
      });


    });
  }

  private refreshData() {
    this.getWorkbookRequest = this.workbookService.getWorkbook(this.workbookID);
    this.getTpInfoDtosRequest = this.workbookService.getTransplantProductionInformationDtos(this.workbookID);

    this.getCropsRequest = this.workbookService.getCrops(this.workbookID);
    this.getPhasesRequest = this.lookupTablesService.getPhases();
    this.getTrayTypesRequest = this.workbookService.getTransplantProductionTrayTypes(this.workbookID);


    forkJoin<[WorkbookDto, TransplantProductionInformationDto[], CropDto[], PhaseDto[], TransplantProductionTrayTypeDto[]]>([this.getWorkbookRequest, this.getTpInfoDtosRequest, this.getCropsRequest, this.getPhasesRequest, this.getTrayTypesRequest]).subscribe(([workbook, tpInfoDtos, cropDtos, phaseDtos, trayTypeDtos]: [WorkbookDto, TransplantProductionInformationDto[], CropDto[], PhaseDto[], TransplantProductionTrayTypeDto[]]) => {
      this.workbook = workbook;
      this.breadcrumbService.setBreadcrumbs([{label:'Workbooks', routerLink:['/workbooks']},{label:workbook.WorkbookName, routerLink:['/workbooks',workbook.WorkbookID.toString()]}, {label:'Transplant Production Information'}]);
      this.transplantProductionInformationDtos = tpInfoDtos;
      this.cropDtos = cropDtos;
      this.phaseDtos = phaseDtos;
      this.tpTrayTypeDtos = trayTypeDtos;
      this.defineColumnDefs();
      this.cdr.markForCheck();
    });
  }

  displayPottingUpMessage() {

    if(!this.gridApi) {
      return;
    }

    var seedingAlreadyExists = false;
    this.gridApi.forEachNode((rowNode, index) => {
      if(rowNode.data.Crop.CropID == this.model.CropID && rowNode.data.Phase.PhaseID == PhaseEnum.Seeding){
        seedingAlreadyExists = true;
      }
    });

    return this.model.PhaseID == PhaseEnum.PottingUp && !seedingAlreadyExists;
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
          return params.data.Crop.CropName;
        },
        // cellEditor: 'agSelectCellEditor',
        // cellEditorParams: {
        //   values: this.cropDtos.map(x => x.CropName)
        // },
        // cellRenderer: EditableRendererComponent,
        sortable: true, 
        filter: true,
        resizable: true,
        pinned: 'left',
      },
      {
        headerName: 'Phase', 
        field: 'Phase',
        editable: true,
        valueSetter: params => {
          params.data.Phase = this.phaseDtos.find(element => {
            return element.PhaseDisplayName == params.newValue;
          });
          return true;
        },
        valueGetter: params => {
          return params.data.Phase.PhaseDisplayName;
        },
        // cellEditor: 'agSelectCellEditor',
        // cellEditorParams: {
        //   values: this.phaseDtos.map(x => x.PhaseDisplayName)
        // },
        // cellRenderer: EditableRendererComponent,
        sortable: true, 
        filter: true,
        resizable: true,
        width: 150,
        pinned: 'left',
      },
      {
        headerName: 'TP Tray Type', 
        field: 'TransplantProductionTrayType',
        editable: true,
        valueSetter: params => {
          params.data.TransplantProductionTrayType = this.tpTrayTypeDtos.find(element => {
            return element.TransplantProductionTrayTypeName == params.newValue;
          });
          return true;
        },
        valueGetter: params => {
          return params.data.TransplantProductionTrayType.TransplantProductionTrayTypeName;
        },
        // cellEditor: 'agSelectCellEditor',
        // cellEditorParams: {
        //   values: this.tpTrayTypeDtos.map(x => x.TransplantProductionTrayTypeName)
        // },
        // cellRenderer: EditableRendererComponent,
        sortable: true, 
        filter: true,
        resizable: true,
        width:150
      },
      {
        headerName: 'Cells/Plugs per Tray', 
        field: 'SeedsPerTray',
        editable: true,
        cellEditor: IntegerEditor,
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
        headerName: 'Percentage Plantable', 
        field: 'UsageRate',
        editable: true,
        cellEditor: DecimalEditor,
        sortable: true, 
        filter: true,
        valueFormatter: params => {
          return params.value + '%';
        },
        cellRenderer: EditableRendererComponent,
        resizable: true
      },
      {
        headerName: 'Seed Cost per Cell/Plug', 
        field: 'CostPerSeed',
        editable: params => {
          if(params.data.Phase.PhaseID == PhaseEnum.PottingUp) {
            return false;
          }
          return true;
        },
        cellEditor: DecimalEditor,
        sortable: true, 
        filter: true,
        valueFormatter: params => {
          if(params.data.Phase.PhaseID == PhaseEnum.PottingUp) {
            return 'N/A';
          }

          return params.value ? '$' + params.value : '$0';
        },
        cellStyle: params => {
          if (params.data.Phase.PhaseID == PhaseEnum.Seeding && !params.value) {
              return { backgroundColor: '#ffdfd6' };
          }
          if(params.data.Phase.PhaseID == PhaseEnum.PottingUp) {
            return { backgroundColor: '#ddd' };
          }
          return {backgroundColor: '#ccf5cc'};
        },
        cellRenderer: EditableRendererComponent,
        resizable: true,
        width:175
      },
      {
        headerName: 'Crop Specific Input Costs per Tray', 
        field: 'CropSpecificInputCostsPerTray',
        editable: true,
        cellEditor: DecimalEditor,
        sortable: true, 
        filter: true,
        valueFormatter: params => {
          return params.value ? '$' + params.value : '$0';
        },
        cellRenderer: EditableRendererComponent,
        width:250,
        resizable: true
      },
      {
        headerName: 'Delete', field: 'TransplantProductionInformationID', valueGetter: function (params: any) {
          return { ButtonText: 'Delete', CssClasses: "btn btn-fresca btn-sm", PrimaryKey: params.data.TransplantProductionInformationID, ObjectDisplayName: params.data.TransplantProductionInformationID };
        }, cellRenderer: ButtonRendererComponent,
        cellRendererParams: { 
          clicked: function(field: any) {
            if(confirm(`Are you sure you want to delete this record?`)) {
              componentScope.deleteTransplantProductionInformation(field.PrimaryKey)
            }
          }
          },
        sortable: true, filter: true, width: 100, resizable: true
      },
    ];
    this.gridApi.sizeColumnsToFit();
  }

  deleteTransplantProductionInformation(tpInfoID: number) {
    this.deleteTpInfoRequest = this.workbookService.deleteTransplantProductionInformation(this.workbookID, tpInfoID).subscribe(tpInfoDtos => {
      this.transplantProductionInformationDtos = tpInfoDtos;
      this.alertService.pushAlert(new Alert("Successfully deleted Transplant Production Information", AlertContext.Success));
      this.cdr.detectChanges();
    }, error => {

    })
  }

  onCellValueChanged(data: any) {
    var dtoToPost = data.data;

    this.updateTpInfoRequest = this.workbookService.updateTransplantProductionInformation(dtoToPost).subscribe(tpInfoDto => {
      data.node.setData(tpInfoDto);
      this.gridApi.flashCells({
        rowNodes: [data.node],
        columns: [data.column]
      });
      this.isLoadingSubmit = false;
      this.alertService.pushAlert(new Alert("Successfully updated Transplant Production Information.", AlertContext.Success));
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
    if (this.addTpInfoRequest && this.addTpInfoRequest.unsubscribe) {
      this.addTpInfoRequest.unsubscribe();
    }
    if (this.getTpInfoDtosRequest && this.getTpInfoDtosRequest.unsubscribe) {
      this.getTpInfoDtosRequest.unsubscribe();
    }
    if (this.updateTpInfoRequest && this.updateTpInfoRequest.unsubscribe) {
      this.updateTpInfoRequest.unsubscribe();
    }
    if (this.deleteTpInfoRequest && this.deleteTpInfoRequest.unsubscribe) {
      this.deleteTpInfoRequest.unsubscribe();
    }
    if (this.getCropsRequest && this.getCropsRequest.unsubscribe) {
      this.getCropsRequest.unsubscribe();
    }
    if (this.getPhasesRequest && this.getPhasesRequest.unsubscribe) {
      this.getPhasesRequest.unsubscribe();
    }
    if (this.getTrayTypesRequest && this.getTrayTypesRequest.unsubscribe) {
      this.getTrayTypesRequest.unsubscribe();
    }

    
    this.cdr.detach();
  }

  onSubmit(fieldLaborActivityForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;
    this.addTpInfoRequest = this.workbookService.addTransplantProductionInformation(this.model).subscribe(response => {
      this.isLoadingSubmit = false;
      this.transplantProductionInformationDtos = response;
      this.alertService.pushAlert(new Alert("Successfully added Transplant Production Information.", AlertContext.Success));
      this.resetForm();
      this.cdr.detectChanges();
      
    }, error => { 
      this.isLoadingSubmit = false;
      this.cdr.detectChanges();
    });
  }

  resetForm() {
    this.model = new TransplantProductionInformationCreateDto({WorkbookID: this.workbookID});
  }

  public exportToCsv() {
    let columnsKeys = this.tpInfoGrid.api.getAllDisplayedColumns(); 
    let columnIds: Array<any> = []; 
    columnsKeys.forEach(keys => 
      { 
        let columnName: string = keys.getColId(); 
        columnIds.push(columnName); 
      });
    columnIds.splice(-1, 1); // remove the delete column from the download
    this.utilityFunctionsService.exportGridToCsv(this.tpInfoGrid, 'Transplant-Production-Info.csv', columnIds);
  }  

}

