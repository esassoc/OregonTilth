import { Component, OnInit } from '@angular/core';
import { AgRendererComponent, ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
    selector: 'button-renderer',
    templateUrl: './button-renderer.component.html',
    styleUrls: ['./button-renderer.component.scss'],
    standalone: true
})

export class ButtonRendererComponent implements ICellRendererAngularComp, AgRendererComponent  {
  params: any;

  agInit(params: ICellRendererParams) {
    if(params.value === null)
    {
      params.value = { ButtonText: "", PrimaryKey: -1, ObjectDisplayName: "" }
    }
    else
    {
      this.params = params;
    }
  }

  refresh(params:ICellRendererParams) {
      this.params = params;
      // As we have updated the params we return true to let AG Grid we have handle refresh.
      // So AG Grid will not recreate the cell renderer from scratch.
      return true;
  }

  btnClickedHandler() {
    this.params.clicked(this.params.value, this.params.data);
  }
}