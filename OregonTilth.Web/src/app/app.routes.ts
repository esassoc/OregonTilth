import { Routes } from '@angular/router';
import { NotFoundComponent, UnauthenticatedComponent, SubscriptionInsufficientComponent } from './shared/pages';
import { UnauthenticatedAccessGuard } from './shared/guards/unauthenticated-access/unauthenticated-access.guard';
import { ManagerOnlyGuard } from "./shared/guards/unauthenticated-access/manager-only-guard";
import { UserListComponent } from './pages/user-list/user-list.component';
import { HomeIndexComponent } from './pages/home/home-index/home-index.component';
import { UserDetailComponent } from './pages/user-detail/user-detail.component';
import { UserInviteComponent } from './pages/user-invite/user-invite.component';
import { UserEditComponent } from './pages/user-edit/user-edit.component';
import { LoginCallbackComponent } from './pages/login-callback/login-callback.component';
import { CreateUserCallbackComponent } from './pages/create-user-callback/create-user-callback.component';
import { AboutComponent } from './pages/about/about.component';
import { DisclaimerComponent } from './pages/disclaimer/disclaimer.component';
import { FieldDefinitionListComponent } from './pages/field-definition-list/field-definition-list.component';
import { FieldDefinitionEditComponent } from './pages/field-definition-edit/field-definition-edit.component';
import { WorkbooksComponent } from './pages/workbooks/workbooks.component';
import { NewWorkbookComponent } from './pages/workbooks/new-workbook/new-workbook.component';
import { WorkbookDetailComponent } from './pages/workbooks/workbook-detail/workbook-detail.component';
import { FieldLaborActivitiesComponent } from './pages/workbooks/forms/field-labor-activities/field-labor-activities.component';
import { MachineryComponent } from './pages/workbooks/forms/machinery/machinery.component';
import { CropsComponent } from './pages/workbooks/forms/crops/crops.component';
import { CropUnitsComponent } from './pages/workbooks/forms/crop-units/crop-units.component';
import { FieldLaborByCropComponent } from './pages/workbooks/forms/field-labor-by-crop/field-labor-by-crop.component';
import { TransplantProductionLaborActivitiesComponent } from './pages/workbooks/forms/transplant-production-labor-activities/transplant-production-labor-activities.component';
import { FieldInputCostsComponent } from './pages/workbooks/forms/field-input-costs/field-input-costs.component';
import { TransplantProductionLaborByCropComponent } from './pages/workbooks/forms/transplant-production-labor-by-crop/transplant-production-labor-by-crop.component';
import { TransplantProductionInputsComponent } from './pages/workbooks/forms/transplant-production-inputs/transplant-production-inputs.component';
import { TransplantProductionTrayTypesComponent } from './pages/workbooks/forms/transplant-production-tray-types/transplant-production-tray-types.component';
import { TransplantProductionInputCostsComponent } from './pages/workbooks/forms/transplant-production-input-costs/transplant-production-input-costs.component';
import { FieldInputByCropComponent } from './pages/workbooks/forms/field-input-by-crop/field-input-by-crop.component';
import { TransplantProductionInformationComponent } from './pages/workbooks/forms/transplant-production-information/transplant-production-information.component';
import { FieldStandardTimesComponent } from './pages/workbooks/forms/field-standard-times/field-standard-times.component';
import { HarvestPostHarvestStandardTimesComponent } from './pages/workbooks/forms/harvest-post-harvest-standard-times/harvest-post-harvest-standard-times.component';
import { TransplantProductionStandardTimesComponent } from './pages/workbooks/forms/transplant-production-standard-times/transplant-production-standard-times.component';
import { CropYieldInformationComponent } from './pages/workbooks/forms/crop-yield-information/crop-yield-information.component';
import { CropSpecificInfoComponent } from './pages/workbooks/forms/crop-specific-info/crop-specific-info.component';
import { CropCropUnitComponent } from './pages/workbooks/results/crop-crop-unit/crop-crop-unit.component';
import { LaborHoursComponent } from './pages/workbooks/results/labor-hours/labor-hours.component';
import { VariableCostsComponent } from './pages/workbooks/results/variable-costs/variable-costs.component';
import { DuplicateComponent } from './pages/workbooks/duplicate/duplicate.component';
import { PageListComponent } from './pages/page-list/page-list.component';
import { PageEditComponent } from './pages/page-edit/page-edit.component';
import { PageDetailComponent } from './pages/page-detail/page-detail.component';
import { CustomRichTextListComponent } from './pages/custom-rich-text-list/custom-rich-text-list.component';
import { CustomRichTextEditComponent } from './pages/custom-rich-text-edit/custom-rich-text-edit.component';
import { LogoutCallbackComponent } from './pages/logout-callback/logout-callback.component';

export const routes: Routes = [
  { path: "labels-and-definitions/:id", component: FieldDefinitionEditComponent, canActivate: [UnauthenticatedAccessGuard, ManagerOnlyGuard] },
  { path: "labels-and-definitions", component: FieldDefinitionListComponent, canActivate: [UnauthenticatedAccessGuard, ManagerOnlyGuard] },
  { path: "custom-rich-text/:id", component: CustomRichTextEditComponent, canActivate: [UnauthenticatedAccessGuard, ManagerOnlyGuard] },
  { path: "custom-rich-text", component: CustomRichTextListComponent, canActivate: [UnauthenticatedAccessGuard, ManagerOnlyGuard] },
  { path: "pages", component: PageListComponent, canActivate: [UnauthenticatedAccessGuard, ManagerOnlyGuard]},
  { path: "pages/edit/:id", component: PageEditComponent, canActivate: [UnauthenticatedAccessGuard, ManagerOnlyGuard]},
  { path: "pages/:pageId", component: PageDetailComponent, canActivate: [UnauthenticatedAccessGuard]},
  { path: "users", component: UserListComponent, canActivate: [UnauthenticatedAccessGuard, ManagerOnlyGuard]},
  { path: "users/:id", component: UserDetailComponent, canActivate: [UnauthenticatedAccessGuard, ManagerOnlyGuard] },
  { path: "users/:id/edit", component: UserEditComponent, canActivate: [UnauthenticatedAccessGuard, ManagerOnlyGuard] },
  { path: "invite-user/:userID", component: UserInviteComponent, canActivate: [UnauthenticatedAccessGuard, ManagerOnlyGuard] },
  { path: "invite-user", component: UserInviteComponent, canActivate: [UnauthenticatedAccessGuard, ManagerOnlyGuard] },
  { path: "", component: HomeIndexComponent},
  { path: "disclaimer", component: DisclaimerComponent },
  { path: "disclaimer/:forced", component: DisclaimerComponent },
  { path: "about", component: AboutComponent},
  { path: "workbooks", component: WorkbooksComponent},
  { path: "workbooks/new", component: NewWorkbookComponent},
  { path: "workbooks/:workbookID/forms/field-labor-activities", component: FieldLaborActivitiesComponent},
  { path: "workbooks/:workbookID/forms/transplant-production-labor-activities", component: TransplantProductionLaborActivitiesComponent},
  { path: "workbooks/:workbookID/forms/transplant-production-inputs", component: TransplantProductionInputsComponent},
  { path: "workbooks/:workbookID/forms/transplant-production-tray-types", component: TransplantProductionTrayTypesComponent},
  { path: "workbooks/:workbookID/forms/machinery", component: MachineryComponent},
  { path: "workbooks/:workbookID/forms/field-labor-by-crop", component: FieldLaborByCropComponent},
  { path: "workbooks/:workbookID/forms/transplant-production-labor-by-crop", component: TransplantProductionLaborByCropComponent},
  { path: "workbooks/:workbookID/forms/field-input-by-crop", component: FieldInputByCropComponent},
  { path: "workbooks/:workbookID/forms/crops", component: CropsComponent},
  { path: "workbooks/:workbookID/forms/crop-units", component: CropUnitsComponent},
  { path: "workbooks/:workbookID/forms/field-input-costs", component: FieldInputCostsComponent},
  { path: "workbooks/:workbookID/forms/transplant-production-input-costs", component: TransplantProductionInputCostsComponent},
  { path: "workbooks/:workbookID/forms/transplant-production-information", component: TransplantProductionInformationComponent},
  { path: "workbooks/:workbookID/forms/field-standard-times", component: FieldStandardTimesComponent},
  { path: "workbooks/:workbookID/forms/harvest-post-harvest-standard-times", component: HarvestPostHarvestStandardTimesComponent},
  { path: "workbooks/:workbookID/forms/transplant-production-standard-times", component: TransplantProductionStandardTimesComponent},
  { path: "workbooks/:workbookID/forms/crop-yield-information", component: CropYieldInformationComponent},
  { path: "workbooks/:workbookID/forms/crop-specific-info", component: CropSpecificInfoComponent},
  { path: "workbooks/:workbookID/results/crop-crop-unit", component: CropCropUnitComponent},
  { path: "workbooks/:workbookID/results/labor-hours", component: LaborHoursComponent},
  { path: "workbooks/:workbookID/results/variable-costs", component: VariableCostsComponent},
  { path: "workbooks/:workbookID/duplicate", component: DuplicateComponent},
  { path: "workbooks/:workbookID", component: WorkbookDetailComponent},
  { path: "login-callback", component: LoginCallbackComponent },
  { path: "logout-callback", component: LogoutCallbackComponent },
  { path: "create-user-callback", component: CreateUserCallbackComponent },
  { path: "not-found", component: NotFoundComponent },
  { path: 'subscription-insufficient', component: SubscriptionInsufficientComponent },
  { path: 'unauthenticated', component: UnauthenticatedComponent },
  { path: '**', component: NotFoundComponent }
];

