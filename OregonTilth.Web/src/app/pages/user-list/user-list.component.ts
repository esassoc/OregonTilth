import { Component, OnInit, ViewChildren, QueryList, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { UserService } from 'src/app/services/user/user.service';
import { UserDetailedDto } from 'src/app/shared/models';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { ColDef } from 'ag-grid-community';
import { LinkRendererComponent } from 'src/app/shared/components/ag-grid/link-renderer/link-renderer.component';
import { FontAwesomeIconLinkRendererComponent } from 'src/app/shared/components/ag-grid/fontawesome-icon-link-renderer/fontawesome-icon-link-renderer.component';
import { DecimalPipe, NgIf } from '@angular/common';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { UtilityFunctionsService } from 'src/app/services/utility-functions.service';
import { RoleEnum } from 'src/app/shared/models/enums/role.enum';
import { DatePipe } from '@angular/common';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
import { SystemInfoService } from 'src/app/services/user/system-info.service';
import { AlertDisplayComponent } from '../../shared/components/alert-display/alert-display.component';
import { RouterLink } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

declare var $:any;

@Component({
    selector: 'fresca-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, NgIf, AgGridModule, RouterLink, NgbTooltip, FormsModule]
})
export class UserListComponent implements OnInit, OnDestroy {

  @ViewChild('usersGrid') usersGrid: AgGridAngular;
  @ViewChild('unassignedUsersGrid') unassignedUsersGrid: AgGridAngular;
  public testEmail: string = '';
  private watchUserChangeSubscription: any;
  private currentUser: UserDetailedDto;

  public rowData = [];
  columnDefs: ColDef[];
  columnDefsUnassigned: ColDef[];
  columnTypes : any;
  users: UserDetailedDto[];
  unassignedUsers: UserDetailedDto[];

  constructor(private cdr: ChangeDetectorRef, 
    private authenticationService: AuthenticationService, 
    private utilityFunctionsService: UtilityFunctionsService, 
    private userService: UserService, 
    private decimalPipe: DecimalPipe,
    private breadcrumbService: BreadcrumbsService,
    private systemInfoService: SystemInfoService,
    private datePipe: DatePipe) { }

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([{label: "Users"}]);
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      // this.usersGrid.api.showLoadingOverlay();
      this.userService.getUsers().subscribe(users => {
        this.rowData = users;
        this.usersGrid.api.hideOverlay();
        this.users = users;
        
        this.unassignedUsers = users.filter(u =>{ return u.Role.RoleID === RoleEnum.Unassigned});

        this.cdr.detectChanges();
      });
      let _decimalPipe = this.decimalPipe;
      let _datePipe = this.datePipe;

      this.columnDefs = [
        {
          headerName: 'Name', valueGetter: function (params: any) {
            return { LinkValue: params.data.UserID, LinkDisplay: params.data.FullName };
          }, cellRenderer: LinkRendererComponent,
          cellRendererParams: { inRouterLink: "/users/" },
          filterValueGetter: function (params: any) {
            return params.data.FullName;
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
        { headerName: 'Email', field: 'Email', sortable: true, filter: true },
        { headerName: 'Role', field: 'Role.RoleDisplayName', sortable: true, filter: true, width: 100 },
        { headerName: 'Receives System Communications?', field: 'ReceiveSupportEmails', valueGetter: function (params) { return params.data.ReceiveSupportEmails ? "Yes" : "No";}, sortable: true, filter: true, width: 250 },
        {
          headerName: 'Last Login Date', field: 'LastActivityDate', valueFormatter: function (params) {
            return _datePipe.transform(params.value, "M/d/yyyy")
          },
          filterValueGetter: function (params: any) {
            return _datePipe.transform(params.data.Date, "M/d/yyyy");
          },
          filterParams: {
            // provide comparator function
            comparator: function (filterLocalDate, cellValue) {
              var dateAsString = cellValue;
              if (dateAsString == null) return -1;
              var cellDate = Date.parse(dateAsString);
              const filterLocalDateAtMidnight = filterLocalDate.getTime();
              if (filterLocalDateAtMidnight == cellDate) {
                return 0;
              }
              if (cellDate < filterLocalDateAtMidnight) {
                return -1;
              }
              if (cellDate > filterLocalDateAtMidnight) {
                return 1;
              }
            }
          },
          comparator: function (id1: any, id2: any) {
            if (id1 < id2) {
              return -1;
            }
            if (id1 > id2) {
              return 1;
            }
            return 0;
          },
          sortable: true, filter: 'agDateColumnFilter', width: 145
        },
      ];
        
      this.columnDefs.forEach(x => {
        x.resizable = true;
      });
    });
  }


  ngOnDestroy() {
    this.watchUserChangeSubscription.unsubscribe();
    
    this.cdr.detach();
  }

  public exportToCsv() {
    // we need to grab all columns except the first one (trash icon)
    let columnsKeys = this.usersGrid.api.getAllDisplayedColumns(); 
    let columnIds: Array<any> = []; 
    columnsKeys.forEach(keys => 
      { 
        let columnName: string = keys.getColId(); 
        columnIds.push(columnName); 
      });
    columnIds.splice(0, 1);
    this.utilityFunctionsService.exportGridToCsv(this.usersGrid, 'users.csv', columnIds);
  }  

  sendTestEmail() {
    this.systemInfoService.sendTestEmail(this.testEmail).subscribe(() => {
      this.testEmail = '';
    });
  }
}
