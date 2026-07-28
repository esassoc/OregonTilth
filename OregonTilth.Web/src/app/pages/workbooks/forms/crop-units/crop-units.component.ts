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
import { CropUnitCreateDto } from 'src/app/shared/models/forms/crop-units/crop-unit-create-dto';
import { CropUnitDto } from 'src/app/shared/models/generated/crop-unit-dto';
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
    selector: 'crop-units',
    templateUrl: './crop-units.component.html',
    styleUrls: ['./crop-units.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, CustomRichTextComponent, NgIf, FormsModule, NgbTooltip, AgGridModule]
})
export class CropUnitsComponent implements OnInit {
  @ViewChild('cropUnitsGrid') cropUnitsGrid: AgGridAngular;
  constructor(private cdr: ChangeDetectorRef, 
    private authenticationService: AuthenticationService, 
    private workbookService: WorkbookService,
    private alertService: AlertService,
    private utilityFunctionsService: UtilityFunctionsService,
    private breadcrumbService: BreadcrumbsService, 
    private route: ActivatedRoute) { }

  private gridApi: any;
  private watchUserChangeSubscription: any;
  private currentUser: UserDetailedDto;
  public workbook: WorkbookDto;
  public richTextTypeID : number = CustomRichTextType.CropUnitsForm;
  public isLoadingSubmit: boolean = false;
  private workbookID: number;
  private getWorkbookRequest: any;

  public model: CropUnitCreateDto;
  private addCropUnitRequest: any;

  public getCropUnitsRequest: any;
  public cropUnits: CropUnitDto[];

  private updateCropUnitRequest: any;
  private deleteCropUnitRequest: any;

  public columnDefs: ColDef[];
 
  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      this.route.params.subscribe(params => {
        this.workbookID = parseInt(params['workbookID']);
        this.model = new CropUnitCreateDto({WorkbookID: this.workbookID});
      
        this.refreshData();
      });


    });
  }

  private refreshData() {
    this.getWorkbookRequest = this.workbookService.getWorkbook(this.workbookID);
    this.getCropUnitsRequest = this.workbookService.getCropUnits(this.workbookID);

    forkJoin<[WorkbookDto, CropUnitDto[]]>([this.getWorkbookRequest, this.getCropUnitsRequest]).subscribe(([workbook, cropUnits]: [WorkbookDto, CropUnitDto[]]) => {
      this.workbook = workbook;
      this.breadcrumbService.setBreadcrumbs([{label:'Workbooks', routerLink:['/workbooks']},{label:workbook.WorkbookName, routerLink:['/workbooks',workbook.WorkbookID.toString()]}, {label:'Crop Units'}]);

      this.cropUnits = cropUnits;
      this.defineColumnDefs();
      this.cdr.markForCheck();
    });
  }

  defineColumnDefs() {
    var componentScope = this;
    this.columnDefs = [
      {
        headerName: 'Crop Unit', 
        field: 'CropUnitName',
        editable: true,
        cellEditor: 'agTextCellEditor',
        cellRenderer: EditableRendererComponent,
        sortable: true, 
        filter: true,
        resizable: true
      },
      {
        headerName: 'Delete', field: 'CropUnitID', valueGetter: function (params: any) {
          return { ButtonText: 'Delete', CssClasses: "btn btn-fresca btn-sm", PrimaryKey: params.data.CropUnitID, ObjectDisplayName: params.data.CropUnitName };
        }, cellRenderer: ButtonRendererComponent,
        cellRendererParams: { 
          clicked: function(field: any) {
            if(confirm(`Are you sure you want to delete the ${field.ObjectDisplayName} Crop Unit?`)) {
              componentScope.deleteCropUnit(field.PrimaryKey)
            }
          }
          },
        sortable: true, filter: true, width: 100, resizable: true
      },
    ]
  }

  deleteCropUnit(cropUnitID: number) {
    this.deleteCropUnitRequest = this.workbookService.deleteCropUnit(this.workbookID, cropUnitID).subscribe(cropUnitDtos => {
      this.cropUnits = cropUnitDtos;
      this.alertService.pushAlert(new Alert("Successfully deleted Crop Unit", AlertContext.Success));
      this.cdr.detectChanges();
    }, error => {

    })
  }

  onCellValueChanged(data: any) {
    var dtoToPost = data.data;

    this.updateCropUnitRequest = this.workbookService.updateCropUnit(dtoToPost).subscribe(cropUnit => {
      data.node.setData(cropUnit);
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
    if (this.addCropUnitRequest && this.addCropUnitRequest.unsubscribe) {
      this.addCropUnitRequest.unsubscribe();
    }
    if (this.getCropUnitsRequest && this.getCropUnitsRequest.unsubscribe) {
      this.getCropUnitsRequest.unsubscribe();
    }
    if (this.updateCropUnitRequest && this.updateCropUnitRequest.unsubscribe) {
      this.updateCropUnitRequest.unsubscribe();
    }
    if (this.deleteCropUnitRequest && this.deleteCropUnitRequest.unsubscribe) {
      this.deleteCropUnitRequest.unsubscribe();
    }
    
    this.cdr.detach();
  }

  onSubmit(fieldLaborActivityForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;
    this.addCropUnitRequest = this.workbookService.addCropUnit(this.model).subscribe(response => {
      this.isLoadingSubmit = false;
      this.cropUnits = response;
      this.alertService.pushAlert(new Alert("Successfully added Crop Unit.", AlertContext.Success));
      this.resetForm();
      this.cdr.detectChanges();
      
    }, error => { 
      this.isLoadingSubmit = false;
      this.cdr.detectChanges();
    });
  }

  resetForm() {
    this.model = new CropUnitCreateDto({WorkbookID: this.workbookID});
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  public exportToCsv() {
    let columnsKeys = this.cropUnitsGrid.api.getAllDisplayedColumns(); 
    let columnIds: Array<any> = []; 
    columnsKeys.forEach(keys => 
      { 
        let columnName: string = keys.getColId(); 
        columnIds.push(columnName); 
      });
    columnIds.splice(-1, 1); // remove the delete column from the download
    this.utilityFunctionsService.exportGridToCsv(this.cropUnitsGrid, 'Crop-Units.csv', columnIds);
  } 

}

