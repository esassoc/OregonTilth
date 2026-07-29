using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Net.Mail;
using System.Threading.Tasks;
using OregonTilth.EFModels.Entities;
using OregonTilth.API.Controllers;
using OregonTilth.API.Services;
using OregonTilth.API.Services.Authorization;
using OregonTilth.API.Services.SitkaSmtpClientService;
using OregonTilth.Models.DataTransferObjects;
using System.Net.Http;

namespace OregonTilth.API.Controllers;

[ApiController]
public class SystemInfoController(
    OregonTilthDbContext dbContext,
    ILogger<SystemInfoController> logger,
    IOptions<FrescaConfiguration> frescaConfiguration)
    : SitkaController<SystemInfoController>(dbContext, logger, frescaConfiguration)
{
    [HttpGet("/", Name = "GetSystemInfo")]
    public ActionResult<SystemInfoDto> GetSystemInfo([FromServices] IWebHostEnvironment environment)
    {
        var systemInfo = new SystemInfoDto
        {
            Environment = environment.EnvironmentName,
            CurrentTimeUTC = DateTime.UtcNow.ToString("o")
        };

        return Ok(systemInfo);
    }

    [HttpPost("/test-email", Name = "SendTestEmail")]
    [AdminFeature]
    public async Task<ActionResult> SendTestEmail([FromServices] SitkaSmtpClientService smtpService, [FromBody] TestEmailDto emailAddress)
    {
        
        var mailMessage = new MailMessage
        {
            Subject = $"Test Email from {_frescaConfiguration.PlatformLongName}",
            Body = $"Hello,<br /><br />This is a test email message",
        };
        mailMessage.From = smtpService.GetDefaultEmailFrom();
        mailMessage.To.Add(emailAddress.EmailAddress);
        await smtpService.SendEmailMessage(mailMessage);

        return Ok();
    }

    public class TestEmailDto {
        public string EmailAddress { get; set; }
    }
}