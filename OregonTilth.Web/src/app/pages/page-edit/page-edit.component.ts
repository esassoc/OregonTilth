import { AfterViewChecked, ChangeDetectorRef, Component, forwardRef, OnInit, ViewChild, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UserDetailedDto } from 'src/app/shared/models';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { PageTreeDto } from 'src/app/shared/models/page/page-tree-dto';
import { PageUpdateDto } from 'src/app/shared/models/page/page-update-dto';
import { AlertService } from 'src/app/shared/services/alert.service';
import { PageService } from 'src/app/shared/services/page-service';
import TinyMCEHelpers from 'src/app/shared/helpers/tiny-mce-helpers';
import { EditorComponent, EditorModule } from '@tinymce/tinymce-angular';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
import { PageDto } from 'src/app/shared/models/generated/page-dto';
import { PageMinimalDto } from 'src/app/shared/models/generated/page-minimal-dto';
import { NgIf, NgFor } from '@angular/common';
import { AlertDisplayComponent } from '../../shared/components/alert-display/alert-display.component';
import { FormsModule } from '@angular/forms';
@Component({
    selector: 'oregontilth-page-edit',
    templateUrl: './page-edit.component.html',
    styleUrls: ['./page-edit.component.scss'],
    standalone: true,
    imports: [
        NgIf,
        AlertDisplayComponent,
        FormsModule,
        NgFor,
        EditorModule,
        RouterLink,
    ],
})
export class PageEditComponent implements OnInit {
  private watchUserChangeSubscription: any;
  private currentUser: UserDetailedDto;

  public page: PageMinimalDto;
  public allPages: PageTreeDto[];

  public pageID: number;
  public model: PageUpdateDto;
  
  public isLoadingSubmit: boolean = false;

  public pageCannotHaveParent: boolean = false;

  private readonly editorRef = viewChild<EditorComponent>('tinyMceEditor');
  /** Built once: TinyMCE re-initializes whenever the object bound to [init] changes identity. */
  public readonly editorConfig = TinyMCEHelpers.DefaultInitConfigFor(this.editorRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authenticationService: AuthenticationService,
    private pageService: PageService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService,
    private breadcrumbService: BreadcrumbsService,
  ) {
  }

  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;

      if (!this.authenticationService.isUserAnAdministrator(this.currentUser)) {
        this.router.navigateByUrl("/not-found")
          .then();
        return;
      }

      this.pageID = parseInt(this.route.snapshot.paramMap.get("id"));

      forkJoin(
        this.pageService.getPage(this.pageID),
        this.pageService.listAllPages()
      ).subscribe(([page, allPages]) => {
        this.page = page;
        this.breadcrumbService.setBreadcrumbs([{label: "Pages", routerLink:['/pages']},{label: `Edit "${page.PageName}"`}]);
        this.allPages = allPages.filter(x => !x.ParentPage || x.PageID == this.page.PageID);
        
        this.pageCannotHaveParent = allPages.some(x => x.ParentPage?.PageID == this.page.PageID) && page.ParentPageID == null;
        // var thisPageIndex = allPages.findIndex(x => x.PageID == this.page.PageID)
        // this.allPages.splice(thisPageIndex,1);

        this.model = new PageUpdateDto();
        this.model.PageID = page.PageID;
        this.model.PageContent = this.page.PageContent ? this.page.PageContent : '';
        this.model.PageName = page.PageName;
        this.model.ParentPageID = page.ParentPageID;
        this.model.SortOrder = page.SortOrder;
        this.cdr.detectChanges();

      });
    });
  }

  ngOnDestroy() {
    this.watchUserChangeSubscription.unsubscribe();
    
    this.cdr.detach();
  }

  onSubmit(editPageForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;

    this.pageService.updatePage(this.model)
      .subscribe(response => {
        this.isLoadingSubmit = false;
        this.router.navigateByUrl("/pages").then(x => {
          this.alertService.pushAlert(new Alert("The page was successfully updated.", AlertContext.Success));
        });
      }
        ,
        error => {
          this.isLoadingSubmit = false;
          this.cdr.detectChanges();
        }
      );
  }
}