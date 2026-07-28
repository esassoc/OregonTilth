import { inject, Injectable } from '@angular/core';
import { defer, merge, Observable, Subject } from 'rxjs';
import { filter, map, shareReplay, tap } from 'rxjs/operators';
import { ApiService } from '.';
import { FieldDefinitionDto } from '../models/generated/field-definition-dto';

@Injectable({
  providedIn: 'root'
})
export class FieldDefinitionService {

  private readonly apiService = inject(ApiService);

  /**
   * The side nav alone renders ~25 <field-definition> components, and grid headers add more, so
   * fetching each definition on its own meant a burst of ~25 near-identical requests on every
   * page load -- enough to lose one to the browser's per-host connection limit. Every lookup
   * reads from this single shared list instead. /fieldDefinitions and /fieldDefinitions/{id}
   * project through the same AsDto(), so the payloads are identical.
   *
   * shareReplay resets on error by default, so a failed load doesn't poison later subscribers.
   * defer keeps it lazy -- getFromApi flips the global busy flag when it is *called*, not when it
   * is subscribed to, so building the request eagerly here would strand the busy indicator on for
   * anyone who injects this service without reading a definition.
   */
  private readonly allFieldDefinitions$: Observable<FieldDefinitionDto[]> =
    defer(() => this.apiService.getFromApi(`/fieldDefinitions`))
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  /** Broadcasts saves so every instance showing that definition picks up the new value. */
  private readonly saved$ = new Subject<FieldDefinitionDto>();

  /** Applied over the shared list so instances created after a save don't read a stale value. */
  private readonly savedByTypeID = new Map<number, FieldDefinitionDto>();

  /** Deliberately uncached: the admin list has to reflect edits made since the app loaded. */
  public listAllFieldDefinitions(): Observable<Array<FieldDefinitionDto>> {
    return this.apiService.getFromApi(`/fieldDefinitions`);
  }

  public getFieldDefinition(fieldDefinitionTypeID: number): Observable<FieldDefinitionDto> {
    return merge(
      this.allFieldDefinitions$.pipe(
        map(all => this.savedByTypeID.get(fieldDefinitionTypeID)
          ?? all.find(x => x.FieldDefinitionType.FieldDefinitionTypeID === fieldDefinitionTypeID)),
      ),
      this.saved$.pipe(
        filter(saved => saved.FieldDefinitionType.FieldDefinitionTypeID === fieldDefinitionTypeID),
      ),
    );
  }

  public updateFieldDefinition(fieldDefinition: FieldDefinitionDto): Observable<FieldDefinitionDto> {
    const fieldDefinitionTypeID = fieldDefinition.FieldDefinitionType.FieldDefinitionTypeID;
    return this.apiService.putToApi(`fieldDefinitions/${fieldDefinitionTypeID}`, fieldDefinition)
      .pipe(tap((saved: FieldDefinitionDto) => {
        this.savedByTypeID.set(fieldDefinitionTypeID, saved);
        this.saved$.next(saved);
      }));
  }
}
