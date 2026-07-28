import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { UserDetailedDto } from "src/app/shared/models";
import { CustomRichTextType } from "src/app/shared/models/enums/custom-rich-text-type.enum";
import { AuthenticationService } from "src/app/services/authentication.service";
import { UtilityFunctionsService } from "src/app/services/utility-functions.service";
import { UserService } from "src/app/services/user/user.service";
import { DatePipe, DecimalPipe, NgIf } from "@angular/common";
import { WorkbookService } from "src/app/services/workbook/workbook.service";
import { WorkbookDto } from "src/app/shared/models/generated/workbook-dto";
import { ColDef } from "ag-grid-community";
import { LinkRendererComponent } from "src/app/shared/components/ag-grid/link-renderer/link-renderer.component";
import { RoleDto } from "src/app/shared/models/generated/role-dto";
import { AlertService } from "src/app/shared/services/alert.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Alert } from "src/app/shared/models/alert";
import { AlertContext } from "src/app/shared/models/enums/alert-context.enum";
import { Subject, Subscription } from "rxjs";
import { BreadcrumbsService } from "src/app/shared/services/breadcrumbs.service";
import { WorkbookCreatedService } from "src/app/shared/services/workbook-created.service";
import { AlertDisplayComponent } from "../../../shared/components/alert-display/alert-display.component";
import { FormsModule } from "@angular/forms";
import { CustomRichTextComponent } from "../../../shared/components/custom-rich-text/custom-rich-text.component";

@Component({
    selector: "workbook-detail",
    templateUrl: "./workbook-detail.component.html",
    styleUrls: ["./workbook-detail.component.scss"],
    standalone: true,
    imports: [
        AlertDisplayComponent,
        NgIf,
        FormsModule,
        CustomRichTextComponent,
    ],
})
export class WorkbookDetailComponent implements OnInit {
    private workbookChanged: Subject<WorkbookDto> = new Subject<WorkbookDto>();

    constructor(
        private cdr: ChangeDetectorRef,
        private authenticationService: AuthenticationService,
        private workbookService: WorkbookService,
        private alertService: AlertService,
        private router: Router,
        private breadcrumbsservice: BreadcrumbsService,
        private route: ActivatedRoute,
        private workbookCreatedService: WorkbookCreatedService
    ) {}

    private watchUserChangeSubscription: any;
    private currentUser: UserDetailedDto;
    public columnDefs: ColDef[];
    public richTextTypeID: number = CustomRichTextType.WorkbookDetail;
    public workbook: WorkbookDto;
    public roles: Array<RoleDto>;
    public isLoadingSubmit: boolean = false;
    private workbookID: number;
    private getWorkbookRequest: any;
    public model: WorkbookDto;

    onSubmit(editWorkbookForm: HTMLFormElement): void {
        this.isLoadingSubmit = true;

        this.workbookService.editWorkbook(this.model).subscribe(
            (response) => {
                this.isLoadingSubmit = false;
                this.getWorkbook();
                this.alertService.pushAlert(
                    new Alert(
                        "Successfully saved Workbook.",
                        AlertContext.Success
                    )
                );
                this.workbookService.workbookSubject.next(this.model);
            },
            (error) => {
                this.isLoadingSubmit = false;
                this.cdr.detectChanges();
            }
        );
    }

    ngOnInit() {
        this.watchUserChangeSubscription =
            this.authenticationService.currentUserSetObservable.subscribe(
                (currentUser) => {
                    this.currentUser = currentUser;

                    this.route.params.subscribe((params) => {
                        this.workbookID = parseInt(params["workbookID"]);
                        this.getWorkbook();
                    });
                }
            );
    }

    getWorkbook() {
        this.getWorkbookRequest = this.workbookService
            .getWorkbook(this.workbookID)
            .subscribe(
                (workbook) => {
                    this.workbook = workbook;
                    this.breadcrumbsservice.setBreadcrumbs([
                        { label: "Workbooks", routerLink: ["/workbooks"] },
                        { label: workbook.WorkbookName },
                    ]);
                    this.model = new WorkbookDto(workbook);
                },
                (error) => {}
            );
    }

    private routeSubscription: Subscription = Subscription.EMPTY;
    ngOnDestroy() {
        this.routeSubscription.unsubscribe();

        if (
            this.watchUserChangeSubscription &&
            this.watchUserChangeSubscription.unsubscribe
        ) {
            this.watchUserChangeSubscription.unsubscribe();
        }

        if (this.getWorkbookRequest && this.getWorkbookRequest.unsubscribe) {
            this.getWorkbookRequest.unsubscribe();
        }

        this.cdr.detach();

        // this.watchUserChangeSubscription.unsubscribe();
        // if (this.getWorkbookRequest && this.getWorkbookRequest.unsubscribe) {
        //   this.getWorkbookRequest.unsubscribe();
        // }
        //
        // this.cdr.detach();
    }

    deleteWorkbook() {
        if (confirm(`Are you sure you want to delete this Workbook?`)) {
            this.workbookService
                .deleteWorkbook(this.workbookID)
                .subscribe((results) => {
                    this.router.navigate([""]).then(() => {
                        this.workbookCreatedService.workbookDeleted.next(true);
                        this.alertService.pushAlert(
                            new Alert(
                                "Successfully deleted Workbook",
                                AlertContext.Success
                            )
                        );
                    });
                });
        }
    }

    duplicateWorkbook() {
        this.router.navigate(["duplicate"], { relativeTo: this.route });
    }
}
