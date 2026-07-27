import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { ButtonRendererComponent } from 'src/app/shared/components/ag-grid/button-renderer/button-renderer.component';
import { LinkRendererComponent } from 'src/app/shared/components/ag-grid/link-renderer/link-renderer.component';
import { UserDetailedDto } from 'src/app/shared/models';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { CustomRichTextType } from 'src/app/shared/models/enums/custom-rich-text-type.enum';
import { FieldDefinitionDto } from 'src/app/shared/models/generated/field-definition-dto';
import { PageDto } from 'src/app/shared/models/generated/page-dto';
import { PageCreateDto } from 'src/app/shared/models/page/page-create-dto';
import { PageTreeDto } from 'src/app/shared/models/page/page-tree-dto';
import { AlertService } from 'src/app/shared/services/alert.service';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
import { FieldDefinitionService } from 'src/app/shared/services/field-definition-service';
import { PageService } from 'src/app/shared/services/page-service';
import { AlertDisplayComponent } from '../../shared/components/alert-display/alert-display.component';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'oregontilth-page-list',
    templateUrl: './page-list.component.html',
    styleUrls: ['./page-list.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, NgIf, FormsModule, NgFor, AgGridModule]
})
export class PageListComponent implements OnInit {
  @ViewChild("fieldDefinitionsGrid") fieldDefinitionsGrid: AgGridAngular;
  private watchUserChangeSubscription: any;
  private currentUser: UserDetailedDto;

  public fieldDefinitions: Array<FieldDefinitionDto>
  public richTextTypeID : number = CustomRichTextType.LabelsAndDefinitionsList;

  public model : PageCreateDto;
  public rootPages: PageTreeDto[];

  public rowData: PageTreeDto[];
  public columnDefs: ColDef[];

  constructor(
    private pageService: PageService,
    private authenticationService: AuthenticationService,
    private cdr: ChangeDetectorRef,
    private breadcrumbService: BreadcrumbsService,
    private alertService: AlertService) { }

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([{label: "Pages"}]);
    this.pageService.listAllPages().subscribe(pages => {
      this.model = new PageCreateDto();
      this.model.SortOrder = pages.length > 0 ? Math.max(...pages.map(x => x.SortOrder)) + 10 : 10;
      this.rowData = pages;
      this.rootPages = pages.filter(x => x.ParentPage == null)
    });

    this.defineColDefs()

    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
    });

  }

  defineColDefs() : void {
    var componentScope = this;
    this.columnDefs = [
      {
        headerName: 'Page Name', valueGetter: function (params: any) {
          return { LinkValue: params.data.PageID, LinkDisplay: params.data.PageName };
        }, cellRendererFramework: LinkRendererComponent,
        cellRendererParams: { inRouterLink: "/pages/edit" },
        filterValueGetter: function (params: any) {
          return params.data.PageName;
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
        sortable: true, filter: true, width: 170
      },
      { 
        headerName: 'Sort Order', 
        field: 'SortOrder',
        sortable: true, 
        filter: true, 
        width:100, 
        cellStyle: {'white-space': 'normal'}
      },
      { headerName: 'Parent Page', field: 'ParentPage.PageName',  
        cellRenderer:function (params: any) { 
          return params.data.ParentPage ? params.data.ParentPage.PageName : ''
        },
         sortable: true, filter: true, width:150, cellStyle: {'white-space': 'normal'}
      },
      {
        headerName: 'Delete', field: 'PageID',
        valueGetter: function (params: any) {
          return { ButtonText: 'Delete', CssClasses: "btn btn-fresca btn-sm", PrimaryKey: params.data.PageID, ObjectDisplayName: params.data.PageName };
        }, 
        cellRendererFramework: ButtonRendererComponent,
        cellRendererParams: {
          clicked: function(field: any) {
            if(confirm(`Are you sure you want to delete the ${field.ObjectDisplayName} Page?`)) {
              componentScope.deletePage(field.PrimaryKey)
            }
          }
        }
      },
    ];

    this.columnDefs.forEach(x => {
      x.resizable = true;
    });
  }

  deletePage(pageID: number): void {
    
    this.pageService.deletePage(pageID).subscribe(pages => {
      this.rowData = pages;
      this.rootPages = pages.filter(x => x.ParentPage == null)
      this.alertService.pushAlert(new Alert("Successfully deleted Page", AlertContext.Success));
      this.cdr.detectChanges();
    }, error => {

    })
    
  }

  onSubmit(pageForm: HTMLFormElement): void {
    
    this.pageService.createPage(this.model).subscribe(response => {
      this.rowData = response;
      this.model = new PageCreateDto();
      this.model.SortOrder = response.length > 0 ? Math.max(...response.map(x => x.SortOrder)) + 10 : 10;
      this.rootPages = response.filter(x => x.ParentPage == null)
      this.cdr.detectChanges();
      
    }, error => { 
      // this.isLoadingSubmit = false;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.watchUserChangeSubscription.unsubscribe();
    
    this.cdr.detach();
  }

}
