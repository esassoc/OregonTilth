using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OregonTilth.API.Models.HealthMonitor;
using OregonTilth.API.Services;
using OregonTilth.EFModels.Entities;

namespace OregonTilth.API.Controllers
{
    public class HealthCheckController : SitkaController<HealthCheckController>
    {
        public HealthCheckController(OregonTilthDbContext dbContext, ILogger<HealthCheckController> logger, IOptions<FrescaConfiguration> frescaConfiguration) : base(dbContext, logger, frescaConfiguration)
        {
        }

        [HttpGet("/health-check")]
        public IActionResult HealthCheck()
        {
            var results = new HealthCheckResults();

            // assume OK initially
            var result = new HealthCheckResult("AdminExists");
            result.HealthCheckStatus = HealthCheckStatus.OK;

            var users = _dbContext.Users;
            if (!users.Any(x => x.RoleID == (int)RoleEnum.Admin))
            {
                result.HealthCheckStatus = HealthCheckStatus.Critical;
                result.AddResultMessage("Could not find any admin accounts.");
            }
            results.Add(result);

            return Ok(results.GetCompleteNagiosOutputText());
        }

    }
}