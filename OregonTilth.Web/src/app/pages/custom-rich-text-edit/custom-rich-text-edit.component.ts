import { Component, inject, OnInit, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AlertDisplayComponent } from 'src/app/shared/components/alert-display/alert-display.component';
import { Alert } from 'src/app/shared/models/alert';
import { CustomRichTextDetailedDto } from 'src/app/shared/models/custom-rich-text-detailed-dto';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { AlertService } from 'src/app/shared/services/alert.service';
import { CustomRichTextService } from 'src/app/shared/services/custom-rich-text.service';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorComponent, EditorModule } from '@tinymce/tinymce-angular';
import TinyMCEHelpers from 'src/app/shared/helpers/tiny-mce-helpers';

@Component({
  selector: 'oregontilth-custom-rich-text-edit',
  standalone: true,
  imports: [AsyncPipe, AlertDisplayComponent, EditorModule, FormsModule, RouterLink],
  templateUrl: './custom-rich-text-edit.component.html',
  styleUrl: './custom-rich-text-edit.component.scss'
})
export class CustomRichTextEditComponent implements OnInit {

  private route: ActivatedRoute = inject(ActivatedRoute)
  private router: Router = inject(Router);
  private alertService: AlertService = inject(AlertService);
  customRichTextService: CustomRichTextService = inject(CustomRichTextService);

  private readonly editorRef = viewChild<EditorComponent>('tinyMceEditor');
  /** Built once: TinyMCE re-initializes whenever the object bound to [init] changes identity. */
  public readonly editorConfig = TinyMCEHelpers.DefaultInitConfigFor(this.editorRef);

  public customRichText$: Observable<CustomRichTextDetailedDto> = this.route.params.pipe(
    switchMap(params => {
      return this.customRichTextService.getCustomRichText(params['id']);
    })
  );

  ngOnInit(): void {

    
  }

  saveCustomRichText(ctr: CustomRichTextDetailedDto) {
    this.customRichTextService.updateCustomRichText(ctr.CustomRichTextType.CustomRichTextTypeID, ctr).subscribe(
      (result) => {
        this.router.navigateByUrl("/custom-rich-text").then(x => {
          this.alertService.pushAlert(new Alert(`The content for ${ctr.CustomRichTextType.CustomRichTextTypeDisplayName} was successfully updated.`, AlertContext.Success));
        });
      },
      (error) => {
        // error
      }
    );
  }
}
