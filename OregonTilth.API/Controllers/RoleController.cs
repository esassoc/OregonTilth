using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OregonTilth.API.Services;
using OregonTilth.API.Services.Authorization;
using OregonTilth.EFModels.Entities;

namespace OregonTilth.API.Controllers
{
    [ApiController]
    public class RoleController : SitkaController<RoleController>
    {
        public RoleController(OregonTilthDbContext dbContext, ILogger<RoleController> logger, IOptions<FrescaConfiguration> frescaConfiguration) : base(dbContext, logger, frescaConfiguration)
        {
        }

        [HttpGet("roles")]
        [AdminFeature]
        public IActionResult Get()
        {
            var roleDtos = Role.AllAsDto;
            return Ok(roleDtos);
        }
    }
}