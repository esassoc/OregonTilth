using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using OregonTilth.EFModels.Entities;

namespace OregonTilth.API.Services.Filters
{
    /// <summary>
    /// Registered globally, so it runs on every action without opting in. It collects every workbook a
    /// request touches: the {workbookID} route value, any WorkbookID in the body, and any workbook-scoped
    /// record ID (CropID, FieldLaborActivityID, ...) in the route or the body, resolved to its workbook.
    /// All of them have to be one workbook that belongs to the caller; otherwise the request is a 404,
    /// so another farmer's workbook can't be read, written, or mixed into one of yours by putting its
    /// IDs in a request. Requests that touch no workbook pass through.
    /// </summary>
    public class WorkbookOwnershipFilter : IAsyncActionFilter
    {
        private const string WorkbookIDName = "WorkbookID";
        private const int MaxBodyDepth = 5;

        // Every table that hangs off a workbook, keyed by its ID's name. Route parameters and DTO properties
        // use these names, which is what lets one filter cover every endpoint. A new workbook child table
        // needs a row here.
        private static readonly Dictionary<string, Func<OregonTilthDbContext, int, int?>> WorkbookIDLookups =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [nameof(Crop.CropID)] = (db, id) => db.Crops.Where(x => x.CropID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(CropSpecificInfo.CropSpecificInfoID)] = (db, id) => db.CropSpecificInfos.Where(x => x.CropSpecificInfoID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(CropUnit.CropUnitID)] = (db, id) => db.CropUnits.Where(x => x.CropUnitID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(CropYieldInformation.CropYieldInformationID)] = (db, id) => db.CropYieldInformations.Where(x => x.CropYieldInformationID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(FieldInputByCrop.FieldInputByCropID)] = (db, id) => db.FieldInputByCrops.Where(x => x.FieldInputByCropID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(FieldInputCost.FieldInputCostID)] = (db, id) => db.FieldInputCosts.Where(x => x.FieldInputCostID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(FieldLaborActivity.FieldLaborActivityID)] = (db, id) => db.FieldLaborActivities.Where(x => x.FieldLaborActivityID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(FieldLaborByCrop.FieldLaborByCropID)] = (db, id) => db.FieldLaborByCrops.Where(x => x.FieldLaborByCropID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(FieldStandardTime.FieldStandardTimeID)] = (db, id) => db.FieldStandardTimes.Where(x => x.FieldStandardTimeID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(HarvestPostHarvestStandardTime.HarvestPostHarvestStandardTimeID)] = (db, id) => db.HarvestPostHarvestStandardTimes.Where(x => x.HarvestPostHarvestStandardTimeID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(Machinery.MachineryID)] = (db, id) => db.Machineries.Where(x => x.MachineryID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(TimeStudy.TimeStudyID)] = (db, id) => db.TimeStudies.Where(x => x.TimeStudyID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(TransplantProductionInformation.TransplantProductionInformationID)] = (db, id) => db.TransplantProductionInformations.Where(x => x.TransplantProductionInformationID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(TransplantProductionInput.TransplantProductionInputID)] = (db, id) => db.TransplantProductionInputs.Where(x => x.TransplantProductionInputID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(TransplantProductionInputCost.TransplantProductionInputCostID)] = (db, id) => db.TransplantProductionInputCosts.Where(x => x.TransplantProductionInputCostID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(TransplantProductionLaborActivity.TransplantProductionLaborActivityID)] = (db, id) => db.TransplantProductionLaborActivities.Where(x => x.TransplantProductionLaborActivityID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(TransplantProductionLaborActivityByCrop.TransplantProductionLaborActivityByCropID)] = (db, id) => db.TransplantProductionLaborActivityByCrops.Where(x => x.TransplantProductionLaborActivityByCropID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(TransplantProductionStandardTime.TransplantProductionStandardTimeID)] = (db, id) => db.TransplantProductionStandardTimes.Where(x => x.TransplantProductionStandardTimeID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
                [nameof(TransplantProductionTrayType.TransplantProductionTrayTypeID)] = (db, id) => db.TransplantProductionTrayTypes.Where(x => x.TransplantProductionTrayTypeID == id).Select(x => (int?)x.WorkbookID).SingleOrDefault(),
            };

        private readonly OregonTilthDbContext _dbContext;

        public WorkbookOwnershipFilter(OregonTilthDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var references = new List<(string Name, int ID)>();
            foreach (var (name, value) in context.RouteData.Values)
            {
                if (IsScopedName(name) && int.TryParse(value?.ToString(), out var id))
                {
                    references.Add((name, id));
                }
            }
            foreach (var argument in context.ActionArguments.Values)
            {
                CollectFromBody(argument, references, new HashSet<object>(ReferenceEqualityComparer.Instance), 0);
            }

            // IDs of 0 or less are unsaved records in a create DTO; they belong to nothing yet.
            references = references.Where(x => x.ID > 0).ToList();
            if (!references.Any())
            {
                await next();
                return;
            }

            var workbookIDs = new HashSet<int>();
            foreach (var (name, id) in references.Distinct())
            {
                var workbookID = string.Equals(name, WorkbookIDName, StringComparison.OrdinalIgnoreCase)
                    ? id
                    : WorkbookIDLookups[name](_dbContext, id);
                if (workbookID == null)
                {
                    context.Result = new NotFoundObjectResult($"Could not find a {name.Substring(0, name.Length - 2)} with the ID {id} or it doesn't belong to you.");
                    return;
                }
                workbookIDs.Add(workbookID.Value);
            }

            if (workbookIDs.Count > 1)
            {
                context.Result = new BadRequestObjectResult("The request refers to records from more than one workbook.");
                return;
            }

            var targetWorkbookID = workbookIDs.Single();
            var user = UserContext.GetUserFromHttpContext(_dbContext, context.HttpContext);
            var ownerUserID = _dbContext.Workbooks.Where(x => x.WorkbookID == targetWorkbookID).Select(x => (int?)x.UserID).SingleOrDefault();
            if (user == null || ownerUserID == null || ownerUserID != user.UserID)
            {
                context.Result = new NotFoundObjectResult($"Could not find a Workbook with the ID {targetWorkbookID} or the Workbook doesn't belong to you.");
                return;
            }

            await next();
        }

        private static bool IsScopedName(string name) =>
            string.Equals(name, WorkbookIDName, StringComparison.OrdinalIgnoreCase) || WorkbookIDLookups.ContainsKey(name);

        // Walks a bound request body: our own DTOs, and arrays or lists of them, a few levels deep.
        private static void CollectFromBody(object value, List<(string Name, int ID)> references, HashSet<object> visited, int depth)
        {
            if (value == null || depth > MaxBodyDepth || !visited.Add(value))
            {
                return;
            }

            if (value is IEnumerable items and not string)
            {
                foreach (var item in items)
                {
                    CollectFromBody(item, references, visited, depth + 1);
                }
                return;
            }

            var type = value.GetType();
            if (type.Namespace == null || !type.Namespace.StartsWith("OregonTilth.Models"))
            {
                return;
            }

            foreach (var property in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                if (property.GetIndexParameters().Length > 0)
                {
                    continue;
                }

                var propertyValue = property.GetValue(value);
                if (propertyValue is int id && IsScopedName(property.Name))
                {
                    references.Add((property.Name, id));
                }
                else if (propertyValue != null && !property.PropertyType.IsValueType && property.PropertyType != typeof(string))
                {
                    CollectFromBody(propertyValue, references, visited, depth + 1);
                }
            }
        }
    }
}
