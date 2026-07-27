import { Component, OnInit } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'fresca-multi-link-renderer',
    templateUrl: './multi-link-renderer.component.html',
    styleUrls: ['./multi-link-renderer.component.scss'],
    standalone: true,
    imports: [NgFor, NgIf, RouterLink]
})

export class MultiLinkRendererComponent implements AgRendererComponent {
  params: any;

  agInit(params: any): void {
    if (params.value === null) {
      params = {
        links: [{ value: { LinkDisplay: "", LinkValue: "" } }]
        , inRouterLink: ""
      }
    }
    else {
      this.params = params;
    }
  }

  refresh(params: any): boolean {
    return false;
  }
}