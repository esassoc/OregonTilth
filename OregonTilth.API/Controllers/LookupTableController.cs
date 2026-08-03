using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OregonTilth.API.Services;
using OregonTilth.API.Services.Authorization;
using OregonTilth.EFModels.Entities;
using System.Collections.Generic;
using OregonTilth.Models.DataTransferObjects;

namespace OregonTilth.API.Controllers
{
    [ApiController]
    public class LookupTableController : SitkaController<LookupTableController>
    {
        public LookupTableController(OregonTilthDbContext dbContext, ILogger<LookupTableController> logger, IOptions<FrescaConfiguration> frescaConfiguration) : base(dbContext, logger, frescaConfiguration)
        {
        }

        [HttpGet("lookupTable/field-labor-activity-categories")]
        public ActionResult<List<FieldLaborActivityCategoryDto>> ListAllFieldLaborActivityCategories()
        {
            var fieldlaborActivityCategoryDtos = FieldLaborActivityCategory.AllAsDto;
            return fieldlaborActivityCategoryDtos;
        }

        [HttpGet("lookupTable/labor-types")]
        public ActionResult<List<LaborTypeDto>> ListAllLaborTypes()
        {
            var laborTypeDtos = LaborType.AllAsDto;
            return laborTypeDtos;
        }

        [HttpGet("lookupTable/field-unit-types")]
        public ActionResult<List<FieldUnitTypeDto>> ListAllFieldUnitTypes()
        {
            var fieldUnitTypes = FieldUnitType.AllAsDto;
            return fieldUnitTypes;
        }

        [HttpGet("lookupTable/phases")]
        public ActionResult<List<PhaseDto>> ListAllPhases()
        {
            var phases = Phase.AllAsDto;
            return phases;
        }

        [HttpGet("lookupTable/harvest-types")]
        public ActionResult<List<HarvestTypeDto>> ListAllHarvestTypes()
        {
            var harvestTypes = HarvestType.AllAsDto;
            return harvestTypes;
        }

        [HttpGet("lookupTable/tp-or-ds-types")]
        public ActionResult<List<TpOrDsTypeDto>> ListAllTpOrDsTypes()
        {
            var allTpOrDsTypes = TpOrDsType.AllAsDto; //FieldUnitType.List(_dbContext);
            return allTpOrDsTypes;
        }
    }
}
