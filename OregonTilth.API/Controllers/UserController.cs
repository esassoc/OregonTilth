using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OregonTilth.API.Services;
using OregonTilth.API.Services.Authorization;
using OregonTilth.EFModels.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using OregonTilth.API.Models;
using OregonTilth.API.Services.SitkaSmtpClientService;
using OregonTilth.Models.DataTransferObjects;
using User = OregonTilth.EFModels.Entities.User;

namespace OregonTilth.API.Controllers
{
    [ApiController]
    public class UserController : SitkaController<UserController>
    {
        public UserController(OregonTilthDbContext dbContext, ILogger<UserController> logger, IOptions<FrescaConfiguration> frescaConfiguration) : base(dbContext, logger, frescaConfiguration)
        {
        }

        /// <summary>
        /// Invites someone at a chosen role. Auth0 has no invite API we can call without Management
        /// API credentials, so instead of creating the identity up front we pre-provision the User row
        /// with a null GlobalID and email the invitee a link to sign up. When they do,
        /// <see cref="EFModels.Entities.User.UpdateClaims"/> matches this row on email and attaches
        /// their Auth0 identity, so they arrive already holding the role the admin picked.
        /// </summary>
        [HttpPost("/users/invite")]
        [AdminFeature]
        public ActionResult<UserDto> InviteUser([FromBody] UserInviteDto inviteDto)
        {
            if (!inviteDto.RoleID.HasValue)
            {
                return BadRequest("Role ID is required.");
            }

            var role = Role.GetByRoleID(_dbContext, inviteDto.RoleID.Value);
            if (role == null)
            {
                return BadRequest($"Could not find a Role with the ID {inviteDto.RoleID}");
            }

            var existingUser = EFModels.Entities.User.GetByEmail(_dbContext, inviteDto.Email);
            var user = existingUser != null
                // Re-inviting someone who already has a row: keep their identity and history, just
                // apply the role from this invite.
                ? EFModels.Entities.User.SetUserRole(_dbContext, existingUser.UserID, inviteDto.RoleID.Value)
                : EFModels.Entities.User.CreateNewUser(_dbContext, new UserUpsertDto
                {
                    FirstName = inviteDto.FirstName,
                    LastName = inviteDto.LastName,
                    Email = inviteDto.Email,
                    RoleID = inviteDto.RoleID.Value,
                    ReceiveSupportEmails = false
                }, null, null);

            var smtpClient = HttpContext.RequestServices.GetRequiredService<SitkaSmtpClientService>();
            var mailMessage = GenerateUserInviteEmail(_frescaConfiguration.WEB_URL, inviteDto, smtpClient);
            SendEmailMessage(smtpClient, mailMessage);

            return Ok(user);
        }

        [HttpGet("users")]
        [AdminFeature]
        public ActionResult<IEnumerable<UserDto>> List()
        {
            var userDtos = EFModels.Entities.User.List(_dbContext);
            return Ok(userDtos);
        }

        [HttpGet("users/unassigned-report")]
        [AdminFeature]
        public ActionResult<UnassignedUserReportDto> GetUnassignedUserReport()
        {
            var report = new UnassignedUserReportDto
                {Count = _dbContext.Users.Count(x => x.RoleID == (int) RoleEnum.Unassigned)};
            return Ok(report);
        }

        [HttpGet("users/{userID}")]
        [UserViewFeature]
        public ActionResult<UserDto> GetByUserID([FromRoute] int userID)
        {
            var userDto = EFModels.Entities.User.GetByUserID(_dbContext, userID);
            return RequireNotNullThrowNotFound(userDto, "User", userID);
        }

        [HttpPut("users/{userID}")]
        [AdminFeature]
        public ActionResult<UserDto> UpdateUser([FromRoute] int userID, [FromBody] UserUpsertDto userUpsertDto)
        {
            var userDto = EFModels.Entities.User.GetByUserID(_dbContext, userID);
            if (ThrowNotFound(userDto, "User", userID, out var actionResult))
            {
                return actionResult;
            }

            var validationMessages =
                EFModels.Entities.User.ValidateUpdate(_dbContext, userUpsertDto, userDto.UserID);
            validationMessages.ForEach(vm => { ModelState.AddModelError(vm.Type, vm.Message); });

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var role = Role.GetByRoleID(_dbContext, userUpsertDto.RoleID.GetValueOrDefault());
            if (role == null)
            {
                return BadRequest($"Could not find a System Role with the ID {userUpsertDto.RoleID}");
            }

            var updatedUserDto = EFModels.Entities.User.UpdateUserEntity(_dbContext, userID, userUpsertDto);

            if (userDto.Role.RoleID == (int)RoleEnum.Unassigned && userUpsertDto.RoleID != (int)RoleEnum.Unassigned)
            {
                var smtpClient = HttpContext.RequestServices.GetRequiredService<SitkaSmtpClientService>();
                var mailMessage = GenerateUserActivatedEmail(_frescaConfiguration.WEB_URL, updatedUserDto, _dbContext, smtpClient);
                SitkaSmtpClientService.AddCcRecipientsToEmail(mailMessage,
                    EFModels.Entities.User.GetEmailAddressesForAdminsThatReceiveSupportEmails(_dbContext));
                SendEmailMessage(smtpClient, mailMessage);
            }

            return Ok(updatedUserDto);
        }

        [HttpPut("users/set-disclaimer-acknowledged-date")]
        public ActionResult<UserDto> SetDisclaimerAcknowledgedDate([FromBody] int userID)
        {
            var userDto = EFModels.Entities.User.GetByUserID(_dbContext, userID);
            if (ThrowNotFound(userDto, "User", userID, out var actionResult))
            {
                return actionResult;
            }

            var updatedUserDto = EFModels.Entities.User.SetDisclaimerAcknowledgedDate(_dbContext, userID);
            return Ok(updatedUserDto);
        }

        [HttpPost("users/update-activity-date")]
        public ActionResult<UserDto> UpdateActivityDate([FromBody] int userID)
        {
            var userDto = EFModels.Entities.User.GetByUserID(_dbContext, userID);
            if (ThrowNotFound(userDto, "User", userID, out var actionResult))
            {
                return actionResult;
            }

            var updatedUserDto = EFModels.Entities.User.SetLastActivityDateDate(_dbContext, userID);
            return Ok(updatedUserDto);
        }

        /// <summary>
        /// The invite email Keystone used to send on our behalf. It points at the app rather than at a
        /// pre-created account, because the invitee's Auth0 identity does not exist until they sign up.
        /// </summary>
        private MailMessage GenerateUserInviteEmail(string frescaUrl, UserInviteDto inviteDto,
            SitkaSmtpClientService smtpClient)
        {
            var applicationName = _frescaConfiguration.PlatformLongName;
            // /create-user-callback opens Auth0's sign-up screen directly, the same role the old
            // KEYSTONE_REDIRECT_URL played.
            var signUpUrl = $"{frescaUrl}/create-user-callback";
            var messageBody = $@"You are receiving this notification because an administrator of {applicationName} has invited you to create an account. <br/><br/>
To get started, <a href='{signUpUrl}'>create your {applicationName} account</a>. Be sure to sign up with this email address ({inviteDto.Email}) so your account is linked to the access you have been granted. <br/><br/>
{smtpClient.GetDefaultEmailSignature()}";

            var mailMessage = new MailMessage
            {
                Subject = $"Invitation to {applicationName}",
                Body = $"Hello {inviteDto.FirstName},<br /><br />{messageBody}",
            };

            mailMessage.To.Add(new MailAddress(inviteDto.Email));
            return mailMessage;
        }

        private MailMessage GenerateUserActivatedEmail(string frescaUrl, UserDto user, OregonTilthDbContext dbContext,
            SitkaSmtpClientService smtpClient)
        {
            var messageBody = $@"Your account has been activated for {_frescaConfiguration.PlatformLongName}: <br/><br/>
 {user.FullName} ({user.Email}) <br/><br/>
<a href='{frescaUrl}'>{_frescaConfiguration.PlatformLongName}</a>. <br/><br/>
{smtpClient.GetDefaultEmailSignature()}";

            var mailMessage = new MailMessage
            {
                Subject = $"User Activation for {_frescaConfiguration.PlatformLongName}",
                Body = $"Hello,<br /><br />{messageBody}",
            };

            mailMessage.To.Add(new MailAddress(user.Email));
            mailMessage.From = smtpClient.GetDefaultEmailFrom();
            return mailMessage;
        }

    }
}
