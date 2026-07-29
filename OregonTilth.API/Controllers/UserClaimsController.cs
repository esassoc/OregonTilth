using System.Linq;
using System.Net.Mail;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OregonTilth.API.Services;
using OregonTilth.API.Services.SitkaSmtpClientService;
using OregonTilth.EFModels.Entities;
using OregonTilth.Models.DataTransferObjects;
using OregonTilth.Models.Helpers;


namespace OregonTilth.API.Controllers
{
    [ApiController]
    public class UserClaimsController : SitkaController<UserClaimsController>
    {
        public UserClaimsController(OregonTilthDbContext dbContext, ILogger<UserClaimsController> logger, IOptions<FrescaConfiguration> frescaConfiguration) : base(dbContext, logger, frescaConfiguration)
        {
        }

        /// <summary>
        /// Resolves the signed-in caller to a user, creating or updating the row from their Auth0 token
        /// claims. The SPA calls this once per sign-in; it replaces the old
        /// GET user-claims/{globalID} → 404 → POST users sequence, which required the client to
        /// assemble a new user from its own copy of the claims.
        /// </summary>
        [HttpPost("user-claims")]
        [Authorize]
        public ActionResult<UserDto> PostUserClaims([FromServices] HttpContext httpContext)
        {
            var claimsPrincipal = httpContext.User;
            if (!claimsPrincipal.Claims.Any())
            {
                return BadRequest("The access token carried no claims.");
            }

            var globalID = claimsPrincipal.Claims.SingleOrDefault(c => c.Type == ClaimsConstants.Sub)?.Value;
            var existingUser = EFModels.Entities.User.GetByUserGlobalID(_dbContext, globalID);

            var userDto = EFModels.Entities.User.UpdateClaims(_dbContext, existingUser?.UserID, claimsPrincipal, out var isNewUser);
            if (userDto == null)
            {
                // UpdateClaims only fails this way when the token has no email claim, which means the
                // Auth0 tenant is not enriching access tokens as this app requires.
                var message = $"Could not resolve a user for GlobalID '{globalID}': the access token has no email claim.";
                _logger.LogError(message);
                return BadRequest(message);
            }

            if (isNewUser)
            {
                var smtpClient = HttpContext.RequestServices.GetRequiredService<SitkaSmtpClientService>();
                var mailMessage = GenerateUserCreatedEmail(_frescaConfiguration.WEB_URL, userDto, smtpClient);
                SitkaSmtpClientService.AddCcRecipientsToEmail(mailMessage,
                    EFModels.Entities.User.GetEmailAddressesForAdminsThatReceiveSupportEmails(_dbContext));
                SendEmailMessage(smtpClient, mailMessage);
            }

            return Ok(userDto);
        }

        [HttpGet("user-claims/{globalID}")]
        [Authorize]
        public ActionResult<UserDto> GetByGlobalID([FromRoute] string globalID)
        {
            var userDto = EFModels.Entities.User.GetByUserGlobalID(_dbContext, globalID);
            if (userDto == null)
            {
                var notFoundMessage = $"User with GlobalID {globalID} does not exist!";
                _logger.LogError(notFoundMessage);
                return NotFound(notFoundMessage);
            }

            return Ok(userDto);
        }

        private MailMessage GenerateUserCreatedEmail(string frescaUrl, UserDto user, SitkaSmtpClientService smtpClient)
        {
            var messageBody = $@"A new user has signed up to the {_frescaConfiguration.PlatformLongName}: <br/><br/>
 {user.FullName} ({user.Email}) <br/><br/>
As an administrator of the {_frescaConfiguration.PlatformShortName}, you can assign them a role  by following <a href='{frescaUrl}/users/{user.UserID}'>this link</a>. <br/><br/>
{smtpClient.GetSupportNotificationEmailSignature()}";

            var mailMessage = new MailMessage
            {
                Subject = $"New User in {_frescaConfiguration.PlatformLongName}",
                Body = $"Hello,<br /><br />{messageBody}",
            };

            mailMessage.To.Add(smtpClient.GetDefaultEmailFrom());
            return mailMessage;
        }
    }
}
