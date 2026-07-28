import { Component, OnInit } from '@angular/core';
import { CustomRichTextType } from 'src/app/shared/models/enums/custom-rich-text-type.enum';
import { AlertDisplayComponent } from '../../shared/components/alert-display/alert-display.component';
import { CustomRichTextComponent } from '../../shared/components/custom-rich-text/custom-rich-text.component';

@Component({
    selector: 'fresca-help',
    templateUrl: './help.component.html',
    styleUrls: ['./help.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, CustomRichTextComponent]
})
export class HelpComponent implements OnInit {

  public richTextTypeID : number = CustomRichTextType.Help;

  constructor() { }

  ngOnInit() {
  }

}
