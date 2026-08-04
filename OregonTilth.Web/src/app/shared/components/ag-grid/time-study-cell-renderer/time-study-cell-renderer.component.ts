import { Component, OnInit } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { TimeStudySummaryDto } from 'src/app/shared/models/forms/time-studies/time-studies-upsert-dto';
import { NgIf } from '@angular/common';

@Component({
    selector: 'time-study-cell-renderer',
    templateUrl: './time-study-cell-renderer.component.html',
    styleUrls: ['./time-study-cell-renderer.component.scss'],
    standalone: true,
    imports: [NgIf]
})

export class TimeStudyCellRendererComponent implements AgRendererComponent {
  params: any;    

  agInit(params: any): void {
    if(params.value === null)
    {
      params = { value: { FieldStandardTime: null, count:0, DownloadDisplay: 'None' } }
    }
    else
    {
      this.params = params;
    }
  }
  
  public static downloadDisplay(data:any) {

    if(data.TimeStudies.length == 0) {
      return 'None';
    }

    let unitsLabel, durationLabel;

    if(data.FieldStandardTimeID) {
      unitsLabel = "Total Field Units";
      durationLabel = "Total Minutes";
    } else if (data.HarvestPostHarvestStandardTimeID) {
      durationLabel = "Total Minutes";
      unitsLabel = "Total Crop Units";
    } else if (data.TransplantProductionStandardTimeID) {
      durationLabel = "Total Minutes";
      unitsLabel = "Total Number of Trays";
    }

    var timeStudies : TimeStudySummaryDto[] = data.TimeStudies;
    var returnStrings = [];

    timeStudies.forEach(timeStudy => {
      returnStrings.push(timeStudy.Units + ' ' + unitsLabel + ' in ' + timeStudy.Duration + ' ' + durationLabel );
    });

    return returnStrings.join('\r\n');
  }

  btnClickedHandler() {
    this.params.clicked(this.params.value);
  }

  refresh(params: any): boolean {
      return false;
  }    
}