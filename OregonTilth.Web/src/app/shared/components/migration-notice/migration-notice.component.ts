import { Component, signal } from '@angular/core';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { AlertContext } from '../../models/enums/alert-context.enum';

@Component({
    selector: 'oregontilth-migration-notice',
    standalone: true,
    imports: [NgbAlert],
    templateUrl: './migration-notice.component.html'
})
export class MigrationNoticeComponent {

    // Deliberately not routed through AlertService: AlertDisplayComponent is embedded in each page
    // component and clears the queue in its ngOnDestroy, so an alert pushed there vanishes on the
    // first navigation. This notice has to survive navigation and disappear only when dismissed.
    //
    // The key names the notice it belongs to, so a future announcement can use its own key instead
    // of arriving pre-dismissed for everyone who closed this one.
    private static readonly DismissedStorageKey = 'oregontilth.notice.auth0-migration.dismissed';

    protected readonly context = AlertContext.Info;

    protected readonly visible = signal(localStorage.getItem(MigrationNoticeComponent.DismissedStorageKey) !== 'true');

    protected onClosed(): void {
        localStorage.setItem(MigrationNoticeComponent.DismissedStorageKey, 'true');
        this.visible.set(false);
    }
}
