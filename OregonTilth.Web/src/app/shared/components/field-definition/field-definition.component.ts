import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, signal, viewChild } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { EditorComponent, EditorModule } from '@tinymce/tinymce-angular';
import { AuthenticationService } from 'src/app/services/authentication.service';
import TinyMCEHelpers from '../../helpers/tiny-mce-helpers';
import { Alert } from '../../models/alert';
import { AlertContext } from '../../models/enums/alert-context.enum';
import { FieldDefinitionTypeEnum } from '../../models/enums/field-definition-type.enum';
import { FieldDefinitionDto } from '../../models/generated/field-definition-dto';
import { AlertService } from '../../services/alert.service';
import { FieldDefinitionService } from '../../services/field-definition-service';

/** Grace period that lets the pointer travel between the label and the popover without closing it. */
const HOVER_CLOSE_GRACE_MS = 50;

@Component({
    selector: 'field-definition',
    templateUrl: './field-definition.component.html',
    styleUrls: ['./field-definition.component.scss'],
    imports: [EditorModule, FormsModule, NgbPopover],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldDefinitionComponent {

  public readonly fieldDefinitionType = input.required<keyof typeof FieldDefinitionTypeEnum>();
  public readonly labelOverride = input<string>();

  private readonly popover = viewChild<NgbPopover>('p');
  private readonly editorRef = viewChild<EditorComponent>('tinyMceEditor');

  private readonly fieldDefinitionService = inject(FieldDefinitionService);
  private readonly authenticationService = inject(AuthenticationService);
  private readonly alertService = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly fieldDefinitionResource = rxResource({
    params: () => FieldDefinitionTypeEnum[this.fieldDefinitionType()],
    stream: ({ params }) => this.fieldDefinitionService.getFieldDefinition(params),
  });

  /**
   * Read the user reactively rather than calling isCurrentUserAnAdministrator() from the template:
   * that method reads a plain field, so under OnPush the edit affordance would never appear for a
   * user who finishes authenticating after this view was last checked.
   */
  private readonly currentUser = toSignal(this.authenticationService.currentUserSetObservable);

  protected readonly fieldDefinition = this.fieldDefinitionResource.value.asReadonly();
  protected readonly isEditing = signal(false);
  protected readonly editedContent = signal('');
  private readonly isSaving = signal(false);

  protected readonly isBusy = computed(() => this.fieldDefinitionResource.isLoading() || this.isSaving());
  protected readonly canEdit = computed(() => this.authenticationService.isUserAnAdministrator(this.currentUser()));
  protected readonly hasContent = computed(() => !!this.fieldDefinition()?.FieldDefinitionValue);
  protected readonly labelText = computed(() =>
    this.labelOverride() ?? this.fieldDefinition()?.FieldDefinitionType?.FieldDefinitionTypeDisplayName ?? '');

  /** TinyMCE tears down and re-initializes whenever `init` changes identity, so build it exactly once. */
  protected readonly editorConfig = this.buildEditorConfig();

  private hoveringLabel = false;
  private hoveringPopover = false;
  private closeTimeoutId: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.closeTimeoutId));
  }

  protected enterEdit(): void {
    this.editedContent.set(this.fieldDefinition()?.FieldDefinitionValue ?? '');
    this.isEditing.set(true);
  }

  protected cancelEdit(): void {
    this.isEditing.set(false);
    this.popover()?.close();
  }

  protected saveEdit(): void {
    const current = this.fieldDefinition();
    if (!current) return;

    this.isEditing.set(false);
    this.isSaving.set(true);

    const updated = new FieldDefinitionDto({ ...current, FieldDefinitionValue: this.editedContent() });
    this.fieldDefinitionService.updateFieldDefinition(updated)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: saved => {
          this.fieldDefinitionResource.set(saved);
          this.isSaving.set(false);
        },
        error: () => {
          this.isSaving.set(false);
          this.alertService.pushAlert(new Alert("There was an error updating the field definition", AlertContext.Danger, true));
        },
      });
  }

  protected labelMouseEnter(): void {
    this.hoveringLabel = true;
    if (!this.isEditing()) {
      this.popover()?.open();
    }
  }

  protected labelMouseLeave(): void {
    this.hoveringLabel = false;
    this.scheduleClose();
  }

  protected popoverMouseEnter(): void {
    this.hoveringPopover = true;
  }

  protected popoverMouseLeave(): void {
    this.hoveringPopover = false;
    this.scheduleClose();
  }

  /**
   * The popover has to survive the pointer crossing the gap between the label and the popover
   * itself, so closing waits for the pointer to settle outside both.
   */
  private scheduleClose(): void {
    clearTimeout(this.closeTimeoutId);
    this.closeTimeoutId = setTimeout(() => {
      if (!this.isEditing() && !this.hoveringLabel && !this.hoveringPopover) {
        this.popover()?.close();
      }
    }, HOVER_CLOSE_GRACE_MS);
  }

  private buildEditorConfig(): object {
    const editorRef = this.editorRef;
    // The image picker needs the live editor, which doesn't exist until the popover is opened in
    // edit mode -- so resolve it through a getter instead of capturing an instance that is null now.
    return TinyMCEHelpers.DefaultInitConfig({
      get editor() { return editorRef()?.editor; },
    });
  }
}
