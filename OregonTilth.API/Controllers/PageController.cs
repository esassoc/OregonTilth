using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OregonTilth.API.Services;
using OregonTilth.API.Services.Authorization;
using OregonTilth.EFModels.Entities;
using OregonTilth.Models.DataTransferObjects;
using OregonTilth.Models.DataTransferObjects.Page;

namespace OregonTilth.API.Controllers
{
    [ApiController]
    public class PageController : SitkaController<PageController>
    {
        public PageController(OregonTilthDbContext dbContext, ILogger<PageController> logger, IOptions<FrescaConfiguration> frescaConfiguration) : base(dbContext, logger, frescaConfiguration)
        {
        }

        [HttpGet("/pages")]
        public ActionResult<List<PageTreeDto>> ListAllPages()
        {
            //var fieldDefinitionDtos = FieldDefinition.List(_dbContext);
            //return fieldDefinitionDtos;

            var pageDtos = Page.List(_dbContext);
            return pageDtos;

        }

        [HttpGet("/pages/{pageID}")]
        public ActionResult<PageDto> GetPage([FromRoute] int pageID)
        {
            //var fieldDefinitionDtos = FieldDefinition.List(_dbContext);
            //return fieldDefinitionDtos;

            var pageDto = Page.Single(_dbContext, pageID);
            return pageDto;

        }

        [HttpDelete("/pages/{pageID}")]
        public ActionResult<List<PageTreeDto>> DeletePage([FromRoute] int pageID)
        {
            
            var validationMessages = Page.ValidateDelete(_dbContext, pageID);
            validationMessages.ForEach(x => ModelState.AddModelError("Validation", x.Message));

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            Page.Delete(_dbContext, pageID);
            var pageDtos = Page.List(_dbContext);
            return pageDtos;
        }

        [HttpPost("/pages")]
        public ActionResult<List<PageTreeDto>> CreatePage([FromBody] PageCreateDto pageCreateDto)
        {
            var validationMessages = Page.ValidateCreate(_dbContext, pageCreateDto);
            validationMessages.ForEach(x => ModelState.AddModelError("Validation", x.Message));

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            Page.Create(_dbContext, pageCreateDto);
            var pageDtos = Page.List(_dbContext);
            return pageDtos;
        }

        [HttpPut("/pages/{pageID}")]
        public ActionResult<PageDto> UpdatePage([FromBody] PageUpdateDto pageUpdateDto)
        {
            var validationMessages = Page.ValidateUpdate(_dbContext, pageUpdateDto);
            validationMessages.ForEach(x => ModelState.AddModelError("Validation", x.Message));

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var pageDtos = Page.Update(_dbContext, pageUpdateDto);
            return pageDtos;
        }


        //[HttpGet("fieldDefinitions/{fieldDefinitionTypeID}")]
        //public ActionResult<FieldDefinitionDto> GetFieldDefinition([FromRoute] int fieldDefinitionTypeID)
        //{
        //    var fieldDefinitionDto = FieldDefinition.GetByFieldDefinitionTypeID(_dbContext, fieldDefinitionTypeID);
        //    return RequireNotNullThrowNotFound(fieldDefinitionDto, "FieldDefinition", fieldDefinitionTypeID);
        //}

        //[HttpPut("fieldDefinitions/{fieldDefinitionTypeID}")]
        //[AdminFeature]
        //public ActionResult<FieldDefinitionDto> UpdateFieldDefinition([FromRoute] int fieldDefinitionTypeID,
        //    [FromBody] FieldDefinitionDto fieldDefinitionUpdateDto)
        //{
        //    var fieldDefinitionDto = FieldDefinition.GetByFieldDefinitionTypeID(_dbContext, fieldDefinitionTypeID);
        //    if (ThrowNotFound(fieldDefinitionDto, "FieldDefinition", fieldDefinitionTypeID, out var actionResult))
        //    {
        //        return actionResult;
        //    }

        //    if (!ModelState.IsValid)
        //    {
        //        return BadRequest(ModelState);
        //    }

        //    var updatedFieldDefinitionDto =
        //        FieldDefinition.UpdateFieldDefinition(_dbContext, fieldDefinitionTypeID, fieldDefinitionUpdateDto);
        //    return Ok(updatedFieldDefinitionDto);
        //}
    }
}