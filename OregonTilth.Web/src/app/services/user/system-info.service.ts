import { Injectable } from '@angular/core';
import { UserDetailedDto } from 'src/app/shared/models';
import { ApiService } from 'src/app/shared/services';
import { Observable } from 'rxjs';
import { UnassignedUserReportDto } from 'src/app/shared/models/user/unassigned-user-report-dto';

@Injectable({
    providedIn: 'root'
})
export class SystemInfoService {
    constructor(private apiService: ApiService) { }

    sendTestEmail(emailAddress: string): Observable<any> {
        let route = `/test-email`;
        return this.apiService.postToApi(route, {EmailAddress: emailAddress});
    }

}
