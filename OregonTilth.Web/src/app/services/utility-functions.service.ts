import { Injectable } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { CsvExportParams, ValueFormatterParams } from 'ag-grid-community';

@Injectable({
  providedIn: 'root'
})
export class UtilityFunctionsService {

  constructor() { }

  public exportGridToCsv(grid: AgGridAngular, fileName: string, columnKeys: Array<string>) {
    var params =
      {
        skipHeader: false,
        columnGroups: false,
        skipFooters: true,
        skipGroups: true,
        skipPinnedTop: true,
        skipPinnedBottom: true,
        allColumns: true,
        onlySelected: false,
        suppressQuotes: false,
        fileName: fileName,
        processCellCallback: function (params) {

          // If the column has a value formatter we want to use that to export to the grid (currency value formatter will work for grid download)
          var colDef : any = params.column.getColDef();
          if (colDef.valueFormatter) {
            const valueFormatterParams: ValueFormatterParams = {
              ...params,
              data: params.node.data,
              node: params.node!,
              colDef: params.column.getColDef()
            };
            var value = colDef.valueFormatter(valueFormatterParams);
            return value;
          }
          
          if (params.column.getColDef().cellRenderer && params.value && (params.value.DownloadDisplay || params.value.LinkDisplay)) {
            if (params.value.DownloadDisplay) {
              return params.value.DownloadDisplay;
            } else {
              return params.value.LinkDisplay;
            }
          }
          else {
            return params.value ? params.value : "";
          }
        }
      } as CsvExportParams
    if (columnKeys) {
      params.columnKeys = columnKeys;
    }
    grid.api.exportDataAsCsv(params);
  }
}
