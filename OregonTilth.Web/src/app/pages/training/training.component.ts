import { Component, OnInit } from '@angular/core';
import { CustomRichTextType } from 'src/app/shared/models/enums/custom-rich-text-type.enum';
import { AlertDisplayComponent } from '../../shared/components/alert-display/alert-display.component';
import { CustomRichTextComponent } from '../../shared/components/custom-rich-text/custom-rich-text.component';

@Component({
    selector: 'fresca-training',
    templateUrl: './training.component.html',
    styleUrls: ['./training.component.scss'],
    standalone: true,
    imports: [AlertDisplayComponent, CustomRichTextComponent]
})
export class TrainingComponent implements OnInit {

  constructor() { }

  public richTextTypeID : number = CustomRichTextType.Training;

  ngOnInit() {
  }

}
