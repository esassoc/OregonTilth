using System.Net.Mail;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OregonTilth.API.Services;
using OregonTilth.API.Services.SitkaSmtpClientService;
using OregonTilth.EFModels.Entities;

namespace OregonTilth.API.Controllers
{
    public abstract class SitkaController<T> : ControllerBase
    {
        protected readonly OregonTilthDbContext _dbContext;
        protected readonly ILogger<T> _logger;
        protected readonly FrescaConfiguration _frescaConfiguration;

        protected SitkaController(OregonTilthDbContext dbContext, ILogger<T> logger, IOptions<FrescaConfiguration> frescaConfiguration)
        {
            _dbContext = dbContext;
            _logger = logger;
            _frescaConfiguration = frescaConfiguration.Value;
        }

        protected ActionResult RequireNotNullThrowNotFound(object theObject, string objectType, object objectID)
        {
            return ThrowNotFound(theObject, objectType, objectID, out var actionResult) ? actionResult : Ok(theObject);
        }

        protected bool ThrowNotFound(object theObject, string objectType, object objectID, out ActionResult actionResult)
        {
            if (theObject == null)
            {
                var notFoundMessage = $"{objectType} with ID {objectID} does not exist!";
                _logger.LogError(notFoundMessage);
                {
                    actionResult = NotFound(notFoundMessage);
                    return true;
                }
            }

            actionResult = null;
            return false;
        }

        protected void SendEmailMessage(SitkaSmtpClientService smtpClient, MailMessage mailMessage)
        {
            mailMessage.IsBodyHtml = true;
            mailMessage.From = smtpClient.GetDefaultEmailFrom();
            mailMessage.ReplyToList.Add(!string.IsNullOrWhiteSpace(_frescaConfiguration.LeadOrganizationEmail) ? _frescaConfiguration.LeadOrganizationEmail : "donotreply@sitkatech.com");
            smtpClient.SendEmailMessage(mailMessage).Wait();
        }
    }
}