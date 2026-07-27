import {
    Component,
    OnInit,
    HostListener,
    ChangeDetectorRef,
    OnDestroy,
    Input,
} from "@angular/core";
import { AuthenticationService } from "src/app/services/authentication.service";
import { UserDetailedDto } from "../../models";
import { ActivatedRoute, NavigationEnd, Router, RouterLinkActive, RouterLink } from "@angular/router";
import { PageService } from "../../services/page-service";
import { PageTreeDto } from "../../models/page/page-tree-dto";
import { WorkbookService } from "src/app/services/workbook/workbook.service";
import { WorkbookDto } from "../../models/generated/workbook-dto";
import { combineLatest, forkJoin, merge } from "rxjs";
import { filter, startWith } from "rxjs/operators";
import { RouteHelpers } from "../../services/router-helper/router-helper";
import { WorkbookCreatedService } from "../../services/workbook-created.service";
import { NgClickOutsideExcludeDirective, NgClickOutsideDirective } from "ng-click-outside2";
import { NgIf, NgFor } from "@angular/common";
import { NgbAccordionDirective, NgbAccordionItem, NgbAccordionHeader, NgbAccordionToggle, NgbAccordionButton, NgbCollapse, NgbAccordionCollapse } from "@ng-bootstrap/ng-bootstrap";
import { FormsModule } from "@angular/forms";
import { FieldDefinitionComponent } from "../field-definition/field-definition.component";

@Component({
    selector: "side-nav",
    templateUrl: "./side-nav.component.html",
    styleUrls: ["./side-nav.component.scss"],
    standalone: true,
    imports: [
        NgClickOutsideExcludeDirective,
        NgClickOutsideDirective,
        NgIf,
        NgbAccordionDirective,
        NgFor,
        NgbAccordionItem,
        NgbAccordionHeader,
        NgbAccordionToggle,
        NgbAccordionButton,
        NgbCollapse,
        NgbAccordionCollapse,
        RouterLinkActive,
        RouterLink,
        FormsModule,
        FieldDefinitionComponent,
    ],
})
export class SideNavComponent implements OnInit, OnDestroy {
    private watchUserChangeSubscription: any;
    private watchWorkbookChangeSubscription: any;
    private currentUser: UserDetailedDto;
    public workbookID: number = null;
    public navigationOpen: boolean = true;
    private sideNavMinWidth: number = 990;
    private screenWidth: number = null;
    public allPages: PageTreeDto[];
    public rootPages: PageTreeDto[];
    public activePanelID: any = "workbook";
    public userWorkbooks: WorkbookDto[];
    private isNavigatingWorkbook: boolean;

    @HostListener("window:resize", ["$event.target.innerWidth"])
    onResize(width) {
        this.navigationOpen = width > this.sideNavMinWidth;
        this.screenWidth = width;
    }

    onClickedOutside(e: Event) {
        if (this.navigationOpen && this.screenWidth < this.sideNavMinWidth) {
            this.navigationOpen = false;
        }
    }

    constructor(
        private authenticationService: AuthenticationService,
        private route: ActivatedRoute,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private pageService: PageService,
        private workboookCreatedService: WorkbookCreatedService,
        private workbookService: WorkbookService
    ) {
        this.navigationOpen = window.innerWidth > this.sideNavMinWidth;
    }

    ngOnInit() {
        this.initWorkbookIDNavigation();

        this.watchUserChangeSubscription = combineLatest([
            this.authenticationService.currentUserSetObservable,
            this.workboookCreatedService.workbookCreatedObservable$,
            this.workboookCreatedService.workbookDeleted$,
        ]).subscribe(([currentUser, newWorkbook, deleted]) => {
            this.currentUser = currentUser;
            this.getWorkbooksInformation();
            this.watchWorkbookChangeSubscription =
                this.workbookService.workbookSubject.subscribe((workbook) => {
                    this.getWorkbooksInformation();
                });
        });
    }

    getWorkbooksInformation() {
        forkJoin([
            this.workbookService.getWorkbooks(this.currentUser),
            this.pageService.listAllPages(),
        ]).subscribe(([workbooks, pages]: [WorkbookDto[], PageTreeDto[]]) => {
            this.userWorkbooks = workbooks;
            this.allPages = pages;
            this.rootPages = pages.filter((x) => !x.ParentPage);
            var pageID = parseInt(this.route.snapshot.paramMap.get("pageId"));
            if (pageID) {
                var rootPage = this.allPages.find((x) => x.PageID == pageID);
                this.activePanelID = rootPage.ParentPage
                    ? ["page_" + rootPage.ParentPage.PageID]
                    : ["page_" + pageID];
            }
        });
    }

    initWorkbookIDNavigation() {
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                startWith(null)
            )
            .subscribe((event: NavigationEnd) => {
                var route = RouteHelpers.getCurrentRouteFromActivatedRoute(
                    this.route
                );
                var workbookID = parseInt(route.paramMap.get("workbookID"));
                if (!isNaN(workbookID)) {
                    this.setCurrentWorkbookID(workbookID);
                } else {
                    this.setCurrentWorkbookID(null);
                }
            });
    }

    switchWorkbooks(workbookID: number) {
        if (workbookID == -1) {
            this.router.navigate(["workbooks", "new"]);
            return;
        }

        if (this.isNavigatingWorkbook) {
            var route = RouteHelpers.getCurrentRouteFromActivatedRoute(
                this.route
            );
            var path = route.routeConfig.path.replace(
                `:workbookID`,
                workbookID.toString()
            );
            this.router.navigate([path]);
        } else {
            this.router.navigate(["/workbooks", workbookID]);
        }
    }

    ngOnDestroy() {
        this.watchUserChangeSubscription.unsubscribe();
        if (
            this.watchWorkbookChangeSubscription &&
            this.watchWorkbookChangeSubscription.unsubscribe
        ) {
            this.watchWorkbookChangeSubscription.unsubscribe();
        }

        this.cdr.detach();
    }

    toggleWorkbookNavigation() {
        this.navigationOpen = !this.navigationOpen;
    }

    setCurrentWorkbookID(workbookID: number) {
        if (workbookID) {
            this.isNavigatingWorkbook = true;
            this.workbookID = workbookID;
        } else {
            this.isNavigatingWorkbook = false;
            this.workbookID = null;
        }
    }
}
