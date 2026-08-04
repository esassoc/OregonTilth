import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { UserDetailedDto } from 'src/app/shared/models';
import { CustomRichTextType } from 'src/app/shared/models/enums/custom-rich-text-type.enum';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UtilityFunctionsService } from 'src/app/services/utility-functions.service';
import { UserService } from 'src/app/services/user/user.service';
import { DatePipe, DecimalPipe, NgIf, NgFor } from '@angular/common';
import { WorkbookService } from 'src/app/services/workbook/workbook.service';
import { WorkbookDto } from 'src/app/shared/models/generated/workbook-dto';
import { ColDef } from 'ag-grid-community';
import { LinkRendererComponent } from 'src/app/shared/components/ag-grid/link-renderer/link-renderer.component';
import { RoleDto } from 'src/app/shared/models/generated/role-dto';
import { AlertService } from 'src/app/shared/services/alert.service';
import { Router } from '@angular/router';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TimeStudyDto } from 'src/app/shared/models/generated/time-study-dto';
import { FormControl, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TimeStudiesUpsertDto, TimeStudyUpsertDto } from 'src/app/shared/models/forms/time-studies/time-studies-upsert-dto';
import { TimeStudiesService } from 'src/app/services/time-studies/time-studies.service';
import { FieldStandardTimeSummaryDto } from 'src/app/shared/models/forms/field-standard-times/field-standard-time-summary-dto';
import { HarvestPostHarvestStandardTimeSummaryDto } from 'src/app/shared/models/forms/harvest-post-harvest-standard-times/harvest-post-harvest-standard-time-summary-dto';
import { TransplantProductionStandardTimeSummaryDto } from 'src/app/shared/models/forms/transplant-production-standard-times/transplant-production-standard-time-summary-dto';
import { AlertDisplayComponent } from '../../alert-display/alert-display.component';

@Component({
    selector: 'time-study-modal',
    templateUrl: './time-study-modal.component.html',
    styleUrls: ['./time-study-modal.component.scss'],
    standalone: true,
    imports: [FormsModule, AlertDisplayComponent, NgIf, NgFor]
})
export class TimeStudyModal implements OnInit {
  @Input() fieldStandardTime: FieldStandardTimeSummaryDto;
  @Input() harvestPostHarvestStandardTime: HarvestPostHarvestStandardTimeSummaryDto;
  @Input() transplantProductionStandardTime: TransplantProductionStandardTimeSummaryDto;
  @Input() activityDisplayString: string;
  @Input() unitsLabel: string;

  constructor(private cdr: ChangeDetectorRef, 
    public activeModal: NgbActiveModal,
    private timeStudiesService: TimeStudiesService) { }

  private currentUser: UserDetailedDto;
  public model: TimeStudiesUpsertDto;
  public isLoadingSubmit: boolean = false;

  private submitTimeStudiesRequest: any;
  public durationLabel: string;


  onSubmit(timeStudiesForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;

    if(this.fieldStandardTime){
      this.submitTimeStudiesRequest = this.timeStudiesService.upsertFieldTimeStudies(this.model).subscribe(result => {
        this.activeModal.close(result);
      }, error => {
  
      });
    }

    if(this.harvestPostHarvestStandardTime){
      this.submitTimeStudiesRequest = this.timeStudiesService.upsertHarvestPostHarvestTimeStudies(this.model).subscribe(result => {
        this.activeModal.close(result);
      }, error => {
  
      });
    }

    if(this.transplantProductionStandardTime){
      this.submitTimeStudiesRequest = this.timeStudiesService.upsertTransplantProductionTimeStudies(this.model).subscribe(result => {
        this.activeModal.close(result);
      }, error => {
  
      });
    }


  }

  ngOnInit() {
    if(this.fieldStandardTime) {
      this.model = this.createModelFromFieldStandardTime(this.fieldStandardTime);
      this.durationLabel = "Total Minutes";
    }

    if(this.harvestPostHarvestStandardTime) {
      this.model = this.createModelFromHarvestPostHarvestStandardTime(this.harvestPostHarvestStandardTime);
      this.durationLabel = "Total Minutes";
    }

    if(this.transplantProductionStandardTime) {
      this.model = this.createModelFromTransplantProductionStandardTime(this.transplantProductionStandardTime);
      this.durationLabel = "Total Minutes";
    }
  }

  createModelFromFieldStandardTime(fieldStandardTime: FieldStandardTimeSummaryDto) {
    var model = new TimeStudiesUpsertDto();
    model.FieldStandardTimeID = fieldStandardTime.FieldStandardTimeID;
    model.WorkbookID = fieldStandardTime.WorkbookID;
    model.TimeStudies = fieldStandardTime.TimeStudies.map(timeStudy => {
      var timeStudyUpsertDto = new TimeStudyUpsertDto();
      timeStudyUpsertDto.FieldStandardTimeID = timeStudy.FieldStandardTimeID;
      timeStudyUpsertDto.Notes = timeStudy.Notes;
      timeStudyUpsertDto.Duration = timeStudy.Duration;
      timeStudyUpsertDto.Units = timeStudy.Units;
      timeStudyUpsertDto.WorkbookID = timeStudy.WorkbookID;
      timeStudyUpsertDto.TimeStudyID = timeStudy.TimeStudyID;

      return timeStudyUpsertDto;
    });
    return model;
  }

  createModelFromHarvestPostHarvestStandardTime(harvestPostHarvestStandardTime: HarvestPostHarvestStandardTimeSummaryDto) {
    var model = new TimeStudiesUpsertDto();
    model.HarvestPostHarvestStandardTimeID = harvestPostHarvestStandardTime.HarvestPostHarvestStandardTimeID;
    model.WorkbookID = harvestPostHarvestStandardTime.WorkbookID;
    model.TimeStudies = harvestPostHarvestStandardTime.TimeStudies.map(timeStudy => {
      var timeStudyUpsertDto = new TimeStudyUpsertDto();
      timeStudyUpsertDto.HarvestPostHarvestStandardTimeID = timeStudy.HarvestPostHarvestStandardTimeID;
      timeStudyUpsertDto.Notes = timeStudy.Notes;
      timeStudyUpsertDto.Duration = timeStudy.Duration;
      timeStudyUpsertDto.Units = timeStudy.Units;
      timeStudyUpsertDto.WorkbookID = timeStudy.WorkbookID;
      timeStudyUpsertDto.TimeStudyID = timeStudy.TimeStudyID;

      return timeStudyUpsertDto;
    });
    return model;
  }

  createModelFromTransplantProductionStandardTime(transplantProductionStandardTime: TransplantProductionStandardTimeSummaryDto) {
    var model = new TimeStudiesUpsertDto();
    model.TransplantProductionStandardTimeID = transplantProductionStandardTime.TransplantProductionStandardTimeID;
    model.WorkbookID = transplantProductionStandardTime.WorkbookID;
    model.TimeStudies = transplantProductionStandardTime.TimeStudies.map(timeStudy => {
      var timeStudyUpsertDto = new TimeStudyUpsertDto();
      timeStudyUpsertDto.TransplantProductionStandardTimeID = timeStudy.TransplantProductionStandardTimeID;
      timeStudyUpsertDto.Notes = timeStudy.Notes;
      timeStudyUpsertDto.Duration = timeStudy.Duration;
      timeStudyUpsertDto.Units = timeStudy.Units;
      timeStudyUpsertDto.WorkbookID = timeStudy.WorkbookID;
      timeStudyUpsertDto.TimeStudyID = timeStudy.TimeStudyID;

      return timeStudyUpsertDto;
    });
    return model;
  }

  addTimeStudy() {
    
    var timeStudyUpsertDto = new TimeStudyUpsertDto();

      if(this.fieldStandardTime) {
        timeStudyUpsertDto.FieldStandardTimeID = this.fieldStandardTime.FieldStandardTimeID;
        timeStudyUpsertDto.WorkbookID = this.fieldStandardTime.WorkbookID;
      }
      if(this.harvestPostHarvestStandardTime) {
        timeStudyUpsertDto.HarvestPostHarvestStandardTimeID = this.harvestPostHarvestStandardTime.HarvestPostHarvestStandardTimeID;
        timeStudyUpsertDto.WorkbookID = this.harvestPostHarvestStandardTime.WorkbookID;
      }

      if(this.transplantProductionStandardTime) {
        timeStudyUpsertDto.TransplantProductionStandardTimeID = this.transplantProductionStandardTime.TransplantProductionStandardTimeID;
        timeStudyUpsertDto.WorkbookID = this.transplantProductionStandardTime.WorkbookID;
      }

      timeStudyUpsertDto.Notes = '';
      timeStudyUpsertDto.Duration = null;
      timeStudyUpsertDto.Units = null;
      timeStudyUpsertDto.TimeStudyID = -1;

    this.model.TimeStudies.push(timeStudyUpsertDto);

    this.cdr.detectChanges();
  }

  removeTimeStudyAtIndex(index:number) {

    this.model.TimeStudies.splice(index,1);

  }


  ngOnDestroy() {
    
    if(this.submitTimeStudiesRequest && this.submitTimeStudiesRequest.subscribe) {
      this.submitTimeStudiesRequest.unsubscribe();
    }

    this.cdr.detach();
  }

}

