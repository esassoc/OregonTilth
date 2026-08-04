import {Component} from "@angular/core";
import { ICellRendererParams, TextCellEditor } from "ag-grid-community";
import { NgIf } from "@angular/common";

@Component({
    selector: 'editable-renderer-component',
    templateUrl: './editable-renderer.component.html',
    styleUrls: ['./editable-renderer.component.scss'],
    standalone: true,
    imports: [NgIf]
})
export class EditableRendererComponent {
  public params: ICellRendererParams
  public cellValue: string;
  public rowIndex: number;
  public colKey: string;
  private gridApi: any;
  public currentlyEditable: boolean;

  // gets called once before the renderer is used
  agInit(params: ICellRendererParams): void {
    this.refreshEditableCell(params);
    this.params = params;
    this.gridApi = params.api;
  }

  // gets called whenever the cell refreshes
  refresh(params: ICellRendererParams) {
    this.refreshEditableCell(params);
  }

  refreshEditableCell(params: ICellRendererParams) {
    this.currentlyEditable = params.column.isCellEditable(params.node)
    this.cellValue = this.getValueToDisplay(params);
  }

  buttonClicked() {
    this.gridApi.startEditingCell({
      rowIndex: this.params.node.rowIndex,
      colKey: this.params.column.getColId()
    });
  }

  getValueToDisplay(params: ICellRendererParams) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

}
