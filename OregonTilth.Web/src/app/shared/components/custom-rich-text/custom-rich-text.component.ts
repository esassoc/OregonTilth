import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, signal, viewChild } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { EditorComponent, EditorModule } from '@tinymce/tinymce-angular';
import { AuthenticationService } from 'src/app/services/authentication.service';
import TinyMCEHelpers from '../../helpers/tiny-mce-helpers';
import { Alert } from '../../models/alert';
import { CustomRichTextDetailedDto } from '../../models/custom-rich-text-detailed-dto';
import { AlertContext } from '../../models/enums/alert-context.enum';
import { AlertService } from '../../services/alert.service';
import { CustomRichTextService } from '../../services/custom-rich-text.service';

@Component({
    selector: 'custom-rich-text',
    templateUrl: './custom-rich-text.component.html',
    styleUrls: ['./custom-rich-text.component.scss'],
    imports: [EditorModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomRichTextComponent {

  public readonly customRichTextTypeID = input.required<number>();

  private readonly editorRef = viewChild<EditorComponent>('tinyMceEditor');

  private readonly customRichTextService = inject(CustomRichTextService);
  private readonly authenticationService = inject(AuthenticationService);
  private readonly alertService = inject(AlertService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  private readonly customRichTextResource = rxResource({
    params: () => this.customRichTextTypeID(),
    stream: ({ params }) => this.customRichTextService.getCustomRichText(params),
  });

  /**
   * Read the user reactively rather than calling isCurrentUserAnAdministrator() from the template:
   * that method reads a plain field, so under OnPush the Edit button would never appear for a user
   * who finishes authenticating after this view was last checked.
   */
  private readonly currentUser = toSignal(this.authenticationService.currentUserSetObservable);

  private readonly customRichText = this.customRichTextResource.value.asReadonly();
  protected readonly isEditing = signal(false);
  protected readonly editedContent = signal('');
  private readonly isSaving = signal(false);

  protected readonly isBusy = computed(() => this.customRichTextResource.isLoading() || this.isSaving());
  protected readonly canEdit = computed(() => this.authenticationService.isUserAnAdministrator(this.currentUser()));
  protected readonly isEmptyContent = computed(() => !!this.customRichText()?.IsEmptyContent);

  /** Sanitized once per loaded value: a fresh SafeHtml on every check would re-write the DOM each pass. */
  protected readonly customRichTextContent = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.customRichText()?.CustomRichTextContent ?? ''));

  /** Built once: the editor doesn't exist until edit mode is entered. */
  protected readonly editorConfig = TinyMCEHelpers.DefaultInitConfigFor(this.editorRef);

  protected enterEdit(): void {
    this.editedContent.set(this.customRichText()?.CustomRichTextContent ?? '');
    this.isEditing.set(true);
  }

  protected cancelEdit(): void {
    this.isEditing.set(false);
  }

  protected saveEdit(): void {
    this.isEditing.set(false);
    this.isSaving.set(true);

    const updateDto = new CustomRichTextDetailedDto({ CustomRichTextContent: this.editedContent() });
    this.customRichTextService.updateCustomRichText(this.customRichTextTypeID(), updateDto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: saved => {
          this.customRichTextResource.set(saved);
          this.isSaving.set(false);
        },
        error: () => {
          this.isSaving.set(false);
          this.alertService.pushAlert(new Alert("There was an error updating the rich text content", AlertContext.Danger, true));
        },
      });
  }
}
