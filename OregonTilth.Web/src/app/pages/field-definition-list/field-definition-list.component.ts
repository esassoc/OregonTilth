import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { FieldDefinitionDto } from 'src/app/shared/models/generated/field-definition-dto';
import { FieldDefinitionService } from 'src/app/shared/services/field-definition-service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { LinkRendererComponent } from 'src/app/shared/components/ag-grid/link-renderer/link-renderer.component';
import { ColDef } from 'ag-grid-community';
import { CustomRichTextType } from 'src/app/shared/models/enums/custom-rich-text-type.enum';
import { UserDetailedDto } from 'src/app/shared/models';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
import { AlertDisplayComponent } from '../../shared/components/alert-display/alert-display.component';
import { CustomRichTextComponent } from '../../shared/components/custom-rich-text/custom-rich-text.component';

@Component({
    selector: 'fresca-field-definition-list',
    templateUrl: './field-definition-list.component.html',
    styleUrls: ['./field-definition-list.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, CustomRichTextComponent, AgGridModule]
})
export class FieldDefinitionListComponent implements OnInit {

  @ViewChild("fieldDefinitionsGrid") fieldDefinitionsGrid: AgGridAngular;
  private watchUserChangeSubscription: any;
  private currentUser: UserDetailedDto;

  public fieldDefinitions: Array<FieldDefinitionDto>
  public richTextTypeID : number = CustomRichTextType.LabelsAndDefinitionsList;

  public rowData = [];
  public columnDefs: ColDef[];

  constructor(
    private fieldDefinitionService: FieldDefinitionService,
    private authenticationService: AuthenticationService,
    private breadcrumbService: BreadcrumbsService,
    private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([{label:'Labels and Definitions'}]);
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      // this.fieldDefinitionsGrid.api.showLoadingOverlay();
      this.fieldDefinitionService.listAllFieldDefinitions().subscribe(fieldDefinitions => {
        this.fieldDefinitions = fieldDefinitions;
        this.rowData = fieldDefinitions;
        // this.fieldDefinitionsGrid.api.hideOverlay();
        this.cdr.detectChanges();
      });
      this.columnDefs = [
        {
          headerName: 'Label', valueGetter: function (params: any) {
            return { LinkValue: params.data.FieldDefinitionType.FieldDefinitionTypeID, LinkDisplay: params.data.FieldDefinitionType.FieldDefinitionTypeDisplayName };
          }, cellRenderer: LinkRendererComponent,
          cellRendererParams: { inRouterLink: "/labels-and-definitions/" },
          filterValueGetter: function (params: any) {
            return params.data.FieldDefinitionType.FieldDefinitionDisplayName;
          },
          comparator: function (id1: any, id2: any) {
            let link1 = id1.LinkDisplay;
            let link2 = id2.LinkDisplay;
            if (link1 < link2) {
              return -1;
            }
            if (link1 > link2) {
              return 1;
            }
            return 0;
          },
          sortable: true, filter: true, width:200
        },
        { headerName: 'Definition', field: 'FieldDefinitionValue',  
          cellRenderer:function (params: any) { 
            return params.data.FieldDefinitionValue ? params.data.FieldDefinitionValue : ''
          },
           sortable: true, filter: true, width:900, cellStyle: {'white-space': 'normal'}},
      ];

      this.columnDefs.forEach(x => {
        x.resizable = true;
      });
    });
  }

  ngOnDestroy(): void {
    this.watchUserChangeSubscription.unsubscribe();
    
    this.cdr.detach();
  }
}
