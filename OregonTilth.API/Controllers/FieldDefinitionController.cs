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
    public class FieldDefinitionController : SitkaController<FieldDefinitionController>
    {
        public FieldDefinitionController(OregonTilthDbContext dbContext, ILogger<FieldDefinitionController> logger, IOptions<FrescaConfiguration> frescaConfiguration) : base(dbContext, logger, frescaConfiguration)
        {
        }

        [HttpGet("/fieldDefinitions")]
        public ActionResult<List<FieldDefinitionDto>> ListAllFieldDefinitions()
        {
            var fieldDefinitionDtos = FieldDefinition.List(_dbContext);
            return fieldDefinitionDtos;
        }


        [HttpGet("fieldDefinitions/{fieldDefinitionTypeID}")]
        public ActionResult<FieldDefinitionDto> GetFieldDefinition([FromRoute] int fieldDefinitionTypeID)
        {
            var fieldDefinitionDto = FieldDefinition.GetByFieldDefinitionTypeID(_dbContext, fieldDefinitionTypeID);
            return RequireNotNullThrowNotFound(fieldDefinitionDto, "FieldDefinition", fieldDefinitionTypeID);
        }

        [HttpPut("fieldDefinitions/{fieldDefinitionTypeID}")]
        [AdminFeature]
        public ActionResult<FieldDefinitionDto> UpdateFieldDefinition([FromRoute] int fieldDefinitionTypeID,
            [FromBody] FieldDefinitionDto fieldDefinitionUpdateDto)
        {
            var fieldDefinitionDto = FieldDefinition.GetByFieldDefinitionTypeID(_dbContext, fieldDefinitionTypeID);
            if (ThrowNotFound(fieldDefinitionDto, "FieldDefinition", fieldDefinitionTypeID, out var actionResult))
            {
                return actionResult;
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updatedFieldDefinitionDto =
                FieldDefinition.UpdateFieldDefinition(_dbContext, fieldDefinitionTypeID, fieldDefinitionUpdateDto);
            return Ok(updatedFieldDefinitionDto);
        }
    }
}
