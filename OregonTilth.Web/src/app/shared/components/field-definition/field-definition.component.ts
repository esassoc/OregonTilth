import { Component, OnInit, Input, ChangeDetectorRef, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Alert } from '../../models/alert';
import { UserDetailedDto } from '../../models';
import { FieldDefinitionService } from '../../services/field-definition-service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { AlertService } from '../../services/alert.service';
import { AlertContext } from '../../models/enums/alert-context.enum';
import { FieldDefinitionDto } from '../../models/generated/field-definition-dto';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { FieldDefinitionTypeEnum } from '../../models/enums/field-definition-type.enum';
import TinyMCEHelpers from '../../helpers/tiny-mce-helpers';
import { EditorComponent, EditorModule } from '@tinymce/tinymce-angular';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TinyMceConfigPipe } from '../../helpers/tiny-mce-config.pipe';

declare var $ : any

@Component({
    selector: 'field-definition',
    templateUrl: './field-definition.component.html',
    styleUrls: ['./field-definition.component.scss'],
    standalone: true,
    imports: [NgIf, EditorModule, FormsModule, NgbPopover, TinyMceConfigPipe]
})
export class FieldDefinitionComponent implements OnInit {

  @Input() fieldDefinitionType: string;
  @Input() labelOverride: string;
  @ViewChild('p') public popover: NgbPopover;
  @ViewChild('popContent') public content: any;
  public fieldDefinition: FieldDefinitionDto;
  public isLoading: boolean = true;
  public isEditing: boolean = false;
  public emptyContent: boolean = false;
  public watchUserChangeSubscription: any;
  public editedContent: string;

  currentUser: UserDetailedDto;

  constructor(private fieldDefinitionService: FieldDefinitionService,
    private authenticationService: AuthenticationService,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService,
    private elem: ElementRef) { }

  ngOnInit() {
    this.fieldDefinitionService.getFieldDefinition(FieldDefinitionTypeEnum[this.fieldDefinitionType]).subscribe(x => {
      this.loadFieldDefinition(x);
    });
  }

  ngOnDestroy() {
    this.cdr.detach();
  }




  public getLabelText() {
    return this.labelOverride !== null && this.labelOverride !== undefined ? this.labelOverride : this.fieldDefinition.FieldDefinitionType.FieldDefinitionTypeDisplayName;
  }

  public showEditButton(): boolean {
    return this.authenticationService.isCurrentUserAnAdministrator();
  }

  public enterEdit(): void {
    this.editedContent = this.fieldDefinition.FieldDefinitionValue ?? "";
    this.isEditing = true;
  }

  public cancelEdit(): void {
    this.isEditing = false;
    this.popover.close();
  }

  public saveEdit(): void {
    this.isEditing = false;
    this.isLoading = true;
    this.fieldDefinition.FieldDefinitionValue = this.editedContent;
    this.fieldDefinitionService.updateFieldDefinition(this.fieldDefinition).subscribe(x => {
      this.loadFieldDefinition(x);
    }, error => {
      this.isLoading = false;
      this.alertService.pushAlert(new Alert("There was an error updating the field definition", AlertContext.Danger, true));
    });
  }

  private loadFieldDefinition(fieldDefinition:FieldDefinitionDto)
  {
    this.fieldDefinition = fieldDefinition;
    this.emptyContent = fieldDefinition.FieldDefinitionValue?.length > 0 ? false : true;
    this.isLoading = false;
  }

  public notEditingMouseEnter() {
    if (!this.isEditing) {
      this.popover.open();
      this.elem.nativeElement.closest('body')
                             .querySelector(".popover")
                             .addEventListener('mouseleave', this.mouseLeaveEvent.bind(this));
    }
  }

  public mouseLeaveEvent() {
    if (!this.isEditing) {
      this.popover.close();
    }
  }

  public notEditingMouseLeave() {
      setTimeout( () => {
        let hoveringPopover = this.elem.nativeElement.closest('body')
                                                     .querySelector(".popover:hover")
        if (!hoveringPopover && !this.isEditing) {
            this.popover.close();
        }
    }, 50);
  }
}
