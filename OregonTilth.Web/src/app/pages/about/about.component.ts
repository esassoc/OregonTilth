import { Component, OnInit } from '@angular/core';
import { CustomRichTextType } from 'src/app/shared/models/enums/custom-rich-text-type.enum';
import { BreadcrumbsService } from 'src/app/shared/services/breadcrumbs.service';
import { AlertDisplayComponent } from '../../shared/components/alert-display/alert-display.component';
import { CustomRichTextComponent } from '../../shared/components/custom-rich-text/custom-rich-text.component';

@Component({
    selector: 'fresca-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, CustomRichTextComponent]
})
export class AboutComponent implements OnInit {

  constructor(private breadcrumbService: BreadcrumbsService) { }

  public richTextTypeID : number = CustomRichTextType.PlatformOverview;

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([{label: "About"}]);
  }

}
