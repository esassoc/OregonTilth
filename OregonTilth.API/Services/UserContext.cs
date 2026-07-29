using Microsoft.AspNetCore.Http;
using OregonTilth.Models.DataTransferObjects;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using OregonTilth.EFModels.Entities;
using OregonTilth.Models.Helpers;

namespace OregonTilth.API.Services
{
    public class UserContext
    {
        public UserDto User { get; set; }

        private UserContext(UserDto user)
        {
            User = user;
        }

        public static UserDto GetUserFromHttpContext(OregonTilthDbContext dbContext, HttpContext httpContext)
        {
            return GetUserFromClaimsPrincipal(dbContext, httpContext.User);
        }

        public static UserDto GetUserFromAuthorizationHandlerContext(OregonTilthDbContext dbContext, AuthorizationHandlerContext context)
        {
            return GetUserFromClaimsPrincipal(dbContext, context.User);
        }

        private static UserDto GetUserFromClaimsPrincipal(OregonTilthDbContext dbContext, System.Security.Claims.ClaimsPrincipal claimsPrincipal)
        {
            if (claimsPrincipal == null || !claimsPrincipal.Claims.Any())
            {
                return null;
            }

            // The Auth0 'sub' is an opaque string ("auth0|68f...", "google-oauth2|..."), not a Guid.
            var userGlobalID = claimsPrincipal.Claims.SingleOrDefault(c => c.Type == ClaimsConstants.Sub)?.Value;
            if (string.IsNullOrEmpty(userGlobalID))
            {
                return null;
            }

            return EFModels.Entities.User.GetByUserGlobalID(dbContext, userGlobalID);
        }
    }
}
