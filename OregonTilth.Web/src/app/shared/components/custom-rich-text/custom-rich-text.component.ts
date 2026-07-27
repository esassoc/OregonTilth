import { Component, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectorRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CustomRichTextService } from '../../services/custom-rich-text.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UserDetailedDto } from '../../models/user/user-detailed-dto';
import { CustomRichTextDetailedDto } from '../../models/custom-rich-text-detailed-dto';
import { AlertService } from '../../services/alert.service';
import { Alert } from '../../models/alert';
import { AlertContext } from '../../models/enums/alert-context.enum';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EditorComponent, EditorModule } from '@tinymce/tinymce-angular';
import TinyMCEHelpers from '../../helpers/tiny-mce-helpers';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TinyMceConfigPipe } from '../../helpers/tiny-mce-config.pipe';

@Component({
    selector: 'custom-rich-text',
    templateUrl: './custom-rich-text.component.html',
    styleUrls: ['./custom-rich-text.component.scss'],
    standalone: true,
    imports: [NgIf, EditorModule, FormsModule, TinyMceConfigPipe]
})
export class CustomRichTextComponent implements OnInit {
  @Input() customRichTextTypeID: number;
  public customRichTextContent: SafeHtml;
  public isLoading: boolean = true;
  public isEditing: boolean = false;
  public isEmptyContent: boolean = false;
  public watchUserChangeSubscription: any;
  public editedContent: string;

  currentUser: UserDetailedDto;
  @ViewChild('tinyMceEditor') tinyMceEditor: EditorComponent;


  constructor(private customRichTextService: CustomRichTextService,
    private authenticationService: AuthenticationService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService,
    private sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.currentUserSetObservable.subscribe(currentUser => {
      this.currentUser = currentUser;
      this.cdr.detectChanges();
    });

    this.customRichTextService.getCustomRichText(this.customRichTextTypeID).subscribe(x => {
      this.customRichTextContent = this.sanitizer.bypassSecurityTrustHtml(x.CustomRichTextContent);
      this.isEmptyContent = x.IsEmptyContent;
      this.editedContent = x.CustomRichTextContent;
      this.isLoading = false;
    });
  }
  
  public showEditButton(): boolean {
    var canShowEditButton = this.authenticationService.isCurrentUserAnAdministrator();
    return canShowEditButton;
  }

  public enterEdit(): void {
    this.isEditing = true;
  }

  public cancelEdit(): void {
    this.isEditing = false;
  }

  public saveEdit(): void {
    this.isEditing = false;
    this.isLoading = true;
    const updateDto = new CustomRichTextDetailedDto({ CustomRichTextContent: this.editedContent });
    this.customRichTextService.updateCustomRichText(this.customRichTextTypeID, updateDto).subscribe(x => {
      this.customRichTextContent = this.sanitizer.bypassSecurityTrustHtml(x.CustomRichTextContent);
      this.editedContent = x.CustomRichTextContent;
      this.isLoading = false;
    }, error => {
      this.isLoading = false;
      this.alertService.pushAlert(new Alert("There was an error updating the rich text content", AlertContext.Danger, true));
    });
  }
  
 
}

