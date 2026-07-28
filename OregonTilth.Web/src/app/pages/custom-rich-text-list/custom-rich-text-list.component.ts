import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { LinkRendererComponent } from 'src/app/shared/components/ag-grid/link-renderer/link-renderer.component';
import { CustomRichTextDetailedDto } from 'src/app/shared/models/custom-rich-text-detailed-dto';
import { CustomRichTextDto } from 'src/app/shared/models/generated/custom-rich-text-dto';
import { CustomRichTextService } from 'src/app/shared/services/custom-rich-text.service';
import { AlertDisplayComponent } from 'src/app/shared/components/alert-display/alert-display.component';

@Component({
  selector: 'oregontilth-custom-rich-text-list',
  standalone: true,
  imports: [AsyncPipe, AgGridModule, AlertDisplayComponent],
  templateUrl: './custom-rich-text-list.component.html',
  styleUrl: './custom-rich-text-list.component.scss'
})
export class CustomRichTextListComponent {
  
  customRichTextService: CustomRichTextService = inject(CustomRichTextService);
  public customRichTexts$: Observable<CustomRichTextDetailedDto[]> = this.customRichTextService.getCustomRichTexts();
  public columnDefs: ColDef<CustomRichTextDetailedDto>[] = [
    
    {
      headerName: 'Custom Rich Text',
      field: 'CustomRichTextType.CustomRichTextTypeDisplayName',
      valueGetter: function (params: any) {
        return { LinkValue: params.data.CustomRichTextType.CustomRichTextTypeID, LinkDisplay: params.data.CustomRichTextType.CustomRichTextTypeDisplayName };
      }, cellRenderer: LinkRendererComponent,
      cellRendererParams: { inRouterLink: "/custom-rich-text/" },
      filterValueGetter: function (params: any) {
        return params.data.CustomRichTextType.CustomRichTextTypeDisplayName;
      },
      comparator: function (id1: any, id2: any) {
        let link1 = id1.LinkDisplay;
        let link2 = id2.LinkDisplay;
        if (link1 < link2) {
          return -1;
        }
        if (link1 > link2) {
          return 1;
        }
        return 0;
      },
      sortable: true, filter: true, width: 170
    },
    { headerName: 'ID', field: 'CustomRichTextType.CustomRichTextTypeID',sortable: true, filter: true,  },
  ];
}
