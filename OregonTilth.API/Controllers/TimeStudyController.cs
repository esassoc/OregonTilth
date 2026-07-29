using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OregonTilth.API.Services;
using OregonTilth.API.Services.Authorization;
using OregonTilth.API.Services.Filters;
using OregonTilth.EFModels.Entities;
using OregonTilth.Models.DataTransferObjects;

namespace OregonTilth.API.Controllers
{
    [ApiController]
    public class TimeStudyController : SitkaController<TimeStudyController>
    {
        public TimeStudyController(OregonTilthDbContext dbContext, ILogger<TimeStudyController> logger,
            IOptions<FrescaConfiguration> frescaConfiguration) : base(dbContext,
            logger, frescaConfiguration)
        {
        }

        [HttpPut("workbooks/{workbookID}/time-studies")]
        [WorkbookEditFeature]
        [ValidateWorkbookIDFromRouteExistsAndBelongsToUser]
        public ActionResult<IHasTimeStudies> UpsertTimeStudies([FromBody] TimeStudiesUpsertDto timeStudiesUpsertDto)
        {
            var validationMessages = TimeStudy.ValidateUpsert(_dbContext, timeStudiesUpsertDto);
            validationMessages.ForEach(vm => { ModelState.AddModelError(vm.Type, vm.Message); });
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            TimeStudy.Upsert(_dbContext, timeStudiesUpsertDto);

            IHasTimeStudies returnDto = null;
            if (timeStudiesUpsertDto.FieldStandardTimeID != null)
            {
                var fieldStandardTime = FieldStandardTime.GetByID(_dbContext, timeStudiesUpsertDto.FieldStandardTimeID.Value);
                var sumOfTimeStudyAverages = fieldStandardTime.TimeStudies.ToList().Sum(x => x.Duration / x.Units);

                fieldStandardTime.StandardTimePerUnit = fieldStandardTime.TimeStudies.Any() ? sumOfTimeStudyAverages / fieldStandardTime.TimeStudies.Count() : null;
                _dbContext.SaveChanges();

                returnDto = fieldStandardTime.AsSummaryDto();
            }
            if (timeStudiesUpsertDto.HarvestPostHarvestStandardTimeID != null)
            {
                var harvestStandardTime = HarvestPostHarvestStandardTime.GetByID(_dbContext, timeStudiesUpsertDto.HarvestPostHarvestStandardTimeID.Value);
                var sumOfTimeStudyAverages = harvestStandardTime.TimeStudies.ToList().Sum(x => x.Duration / x.Units);
                harvestStandardTime.StandardTimePerUnit = harvestStandardTime.TimeStudies.Any() ? sumOfTimeStudyAverages / harvestStandardTime.TimeStudies.Count() : null;
                _dbContext.SaveChanges();

                returnDto = HarvestPostHarvestStandardTime.GetDtoListByWorkbookID(_dbContext, timeStudiesUpsertDto.WorkbookID)
                    .Single(x => x.HarvestPostHarvestStandardTimeID == timeStudiesUpsertDto.HarvestPostHarvestStandardTimeID);
            }

            if (timeStudiesUpsertDto.TransplantProductionStandardTimeID != null)
            {
                var tpStandardTime = TransplantProductionStandardTime.GetByID(_dbContext, timeStudiesUpsertDto.TransplantProductionStandardTimeID.Value);
                var sumOfTimeStudyAverages = tpStandardTime.TimeStudies.ToList().Sum(x => x.Duration / x.Units);

                tpStandardTime.StandardTimePerUnit = tpStandardTime.TimeStudies.Any() ? sumOfTimeStudyAverages / tpStandardTime.TimeStudies.Count() : null;
                _dbContext.SaveChanges();


                returnDto = TransplantProductionStandardTime.GetDtoListByWorkbookID(_dbContext, timeStudiesUpsertDto.WorkbookID)
                    .Single(x => x.TransplantProductionStandardTimeID == timeStudiesUpsertDto.TransplantProductionStandardTimeID);
            }

            return Ok(returnDto);
        }

    }
}