import { ChangeDetectionStrategy, Component, computed, HostListener, inject, signal } from "@angular/core";
import { rxResource, takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive } from "@angular/router";
import { NgbAccordionButton, NgbAccordionCollapse, NgbAccordionDirective, NgbAccordionHeader, NgbAccordionItem } from "@ng-bootstrap/ng-bootstrap";
import { NgClickOutsideDirective, NgClickOutsideExcludeDirective } from "ng-click-outside2";
import { merge } from "rxjs";
import { filter, map, skip, startWith } from "rxjs/operators";
import { AuthenticationService } from "src/app/services/authentication.service";
import { WorkbookService } from "src/app/services/workbook/workbook.service";
import { PageService } from "../../services/page-service";
import { RouteHelpers } from "../../services/router-helper/router-helper";
import { WorkbookCreatedService } from "../../services/workbook-created.service";
import { FieldDefinitionComponent } from "../field-definition/field-definition.component";

const SIDE_NAV_MIN_WIDTH = 990;

@Component({
    selector: "side-nav",
    templateUrl: "./side-nav.component.html",
    styleUrls: ["./side-nav.component.scss"],
    imports: [
        NgClickOutsideExcludeDirective,
        NgClickOutsideDirective,
        NgbAccordionDirective,
        NgbAccordionItem,
        NgbAccordionHeader,
        NgbAccordionButton,
        NgbAccordionCollapse,
        RouterLinkActive,
        RouterLink,
        FormsModule,
        FieldDefinitionComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideNavComponent {

    private readonly authenticationService = inject(AuthenticationService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly pageService = inject(PageService);
    private readonly workbookCreatedService = inject(WorkbookCreatedService);
    private readonly workbookService = inject(WorkbookService);

    protected readonly navigationOpen = signal(window.innerWidth > SIDE_NAV_MIN_WIDTH);
    private screenWidth: number = window.innerWidth;

    private readonly currentUser = toSignal(this.authenticationService.currentUserSetObservable);

    /**
     * The side nav sits outside the router outlet, so its own snapshot is the root one and never
     * carries params -- the current route has to be walked to, and re-walked after each navigation.
     */
    private readonly currentRoute = toSignal(
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            startWith(null),
            map(() => RouteHelpers.getCurrentRouteFromActivatedRoute(this.route)),
        ),
    );

    /**
     * Pages and workbooks load independently. They used to share one forkJoin with no error
     * handler, so either request failing left the whole nav blank with no retry -- and pages, which
     * don't depend on the user at all, sat waiting for authentication to finish first.
     */
    private readonly pagesResource = rxResource({
        stream: () => this.pageService.listAllPages(),
    });

    private readonly workbooksResource = rxResource({
        params: () => this.currentUser(),
        stream: ({ params }) => this.workbookService.getWorkbooks(params),
    });

    protected readonly rootPages = computed(() => this.pagesResource.value()?.filter(x => !x.ParentPage));
    protected readonly pagesFailed = computed(() => !!this.pagesResource.error());

    protected readonly userWorkbooks = computed(() => this.workbooksResource.value() ?? []);
    protected readonly workbooksLoaded = computed(() => this.workbooksResource.hasValue());
    protected readonly workbooksFailed = computed(() => !!this.workbooksResource.error());

    protected readonly workbookID = computed(() => {
        const workbookID = parseInt(this.currentRoute()?.paramMap.get("workbookID"));
        return isNaN(workbookID) ? null : workbookID;
    });

    /**
     * Panel to open for the page being viewed; a sub-page opens its parent's panel. This read the
     * root snapshot's "pageId" before, which is always empty, so it never resolved a page.
     */
    protected readonly expandedPagePanelID = computed(() => {
        const pageID = parseInt(this.currentRoute()?.paramMap.get("pageId"));
        if (isNaN(pageID)) return null;

        const page = this.pagesResource.value()?.find(x => x.PageID === pageID);
        if (!page) return null;

        return `page_${page.ParentPage ? page.ParentPage.PageID : page.PageID}`;
    });

    constructor() {
        // Each of these is a BehaviorSubject holding a seed value; skip(1) drops the seed so only
        // real changes trigger a reload. Subscribing used to re-run the whole load immediately, and
        // the workbookSubject subscription was re-created on every emission without being torn
        // down, so each change fanned out to more duplicate requests than the last.
        merge(
            this.workbookCreatedService.workbookCreatedObservable$.pipe(skip(1)),
            this.workbookCreatedService.workbookDeleted$.pipe(skip(1)),
            this.workbookService.workbookSubject.pipe(skip(1)),
        )
            .pipe(takeUntilDestroyed())
            .subscribe(() => this.workbooksResource.reload());
    }

    @HostListener("window:resize", ["$event.target.innerWidth"])
    onResize(width: number) {
        this.navigationOpen.set(width > SIDE_NAV_MIN_WIDTH);
        this.screenWidth = width;
    }

    protected onClickedOutside() {
        if (this.navigationOpen() && this.screenWidth < SIDE_NAV_MIN_WIDTH) {
            this.navigationOpen.set(false);
        }
    }

    protected toggleWorkbookNavigation() {
        this.navigationOpen.update(open => !open);
    }

    protected reloadPages() {
        this.pagesResource.reload();
    }

    protected reloadWorkbooks() {
        this.workbooksResource.reload();
    }

    protected switchWorkbooks(selectedWorkbookID: number | string) {
        const workbookID = Number(selectedWorkbookID);

        if (workbookID === -1) {
            this.router.navigate(["workbooks", "new"]);
            return;
        }

        // Already inside a workbook: stay on the same form and swap which workbook it's for.
        if (this.workbookID() !== null) {
            const path = this.currentRoute().routeConfig.path.replace(`:workbookID`, workbookID.toString());
            this.router.navigate([path]);
        } else {
            this.router.navigate(["/workbooks", workbookID]);
        }
    }
}
