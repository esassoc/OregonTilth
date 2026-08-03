import { Injectable } from '@angular/core';
@Injectable({
    providedIn: 'root'
})

export class GridService {

    constructor() {
        
    }

    currencyFormatter(params): string {
        return isNumber(params.value) ? '$' + params.value : params.value;
    }

    currencyFormatterToFixed(params): string {
        return isNumber(params.value) ? '$' + params.value.toFixed(2) : params.value;
    }

}

function isNumber(n): boolean { 
    return !isNaN(parseFloat(n)) && !isNaN(n - 0) ;
}