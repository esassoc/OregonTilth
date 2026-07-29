using Microsoft.EntityFrameworkCore;
using OregonTilth.Models.DataTransferObjects;
using OregonTilth.Models.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;

namespace OregonTilth.EFModels.Entities
{
    public partial class User
    {
        /// <summary>
        /// Creates a user row. <paramref name="globalID"/> is null for an admin invite: the row is
        /// pre-provisioned with the role the admin chose, and the Auth0 identity is attached later by
        /// <see cref="UpdateClaims"/> when the invitee first signs in and is matched on Email.
        /// </summary>
        public static UserDto CreateNewUser(OregonTilthDbContext dbContext, UserUpsertDto userToCreate, string loginName, string globalID)
        {
            if (!userToCreate.RoleID.HasValue)
            {
                return null;
            }

            var user = new User
            {
                GlobalID = globalID,
                LoginName = loginName,
                Email = userToCreate.Email,
                FirstName = userToCreate.FirstName,
                LastName = userToCreate.LastName,
                IsActive = true,
                RoleID = userToCreate.RoleID.Value,
                CreateDate = DateTime.UtcNow,
            };

            dbContext.Users.Add(user);
            dbContext.SaveChanges();
            dbContext.Entry(user).Reload();

            return GetByUserID(dbContext, user.UserID);
        }

        public static IEnumerable<UserDto> List(OregonTilthDbContext dbContext)
        {
            return dbContext.Users
                .AsNoTracking()
                .OrderBy(x => x.LastName)
                .ThenBy(x => x.FirstName)
                .Select(x => x.AsDto()).AsEnumerable();
        }

        public static IEnumerable<UserDto> ListByRole(OregonTilthDbContext dbContext, RoleEnum roleEnum)
        {
            var users = GetUserImpl(dbContext)
                .Where(x => x.IsActive && x.RoleID == (int) roleEnum)
                .OrderBy(x => x.FirstName).ThenBy(x => x.LastName)
                .Select(x => x.AsDto())
                .AsEnumerable();

            return users;
        }

        public static IEnumerable<string> GetEmailAddressesForAdminsThatReceiveSupportEmails(OregonTilthDbContext dbContext)
        {
            var users = GetUserImpl(dbContext)
                .Where(x => x.IsActive && x.RoleID == (int) RoleEnum.Admin && x.ReceiveSupportEmails)
                .Select(x => x.Email)
                .AsEnumerable();

            return users;
        }

        public static UserDto GetByUserID(OregonTilthDbContext dbContext, int userID)
        {
            var user = GetUserImpl(dbContext).SingleOrDefault(x => x.UserID == userID);
            return user?.AsDto();
        }

        public static List<UserDto> GetByUserID(OregonTilthDbContext dbContext, List<int> userIDs)
        {
            return GetUserImpl(dbContext).Where(x => userIDs.Contains(x.UserID)).Select(x=>x.AsDto()).ToList();
            
        }

        public static UserDto GetByUserGlobalID(OregonTilthDbContext dbContext, string globalID)
        {
            if (string.IsNullOrEmpty(globalID))
            {
                return null;
            }

            var user = GetUserImpl(dbContext)
                .SingleOrDefault(x => x.GlobalID == globalID);

            return user?.AsDto();
        }

        private static IQueryable<User> GetUserImpl(OregonTilthDbContext dbContext)
        {
            return dbContext.Users
                .AsNoTracking();
        }

        public static UserDto GetByEmail(OregonTilthDbContext dbContext, string email)
        {
            var user = GetUserImpl(dbContext).SingleOrDefault(x => x.Email == email);
            return user?.AsDto();
        }

        public static UserDto UpdateUserEntity(OregonTilthDbContext dbContext, int userID, UserUpsertDto userEditDto)
        {
            if (!userEditDto.RoleID.HasValue)
            {
                return null;
            }

            var user = dbContext.Users
                .Single(x => x.UserID == userID);
            
            user.RoleID = userEditDto.RoleID.Value;
            user.ReceiveSupportEmails = userEditDto.RoleID.Value == 1 && userEditDto.ReceiveSupportEmails;
            user.UpdateDate = DateTime.UtcNow;

            dbContext.SaveChanges();
            dbContext.Entry(user).Reload();
            return GetByUserID(dbContext, userID);
        }

        public static UserDto SetDisclaimerAcknowledgedDate(OregonTilthDbContext dbContext, int userID)
        {
            var user = dbContext.Users.Single(x => x.UserID == userID);

            user.UpdateDate = DateTime.UtcNow;
            user.DisclaimerAcknowledgedDate = DateTime.UtcNow;

            dbContext.SaveChanges();
            dbContext.Entry(user).Reload();

            return GetByUserID(dbContext, userID);
        }

        public static UserDto SetLastActivityDateDate(OregonTilthDbContext dbContext, int userID)
        {
            var user = dbContext.Users.Single(x => x.UserID == userID);

            user.LastActivityDate = DateTime.UtcNow;

            dbContext.SaveChanges();
            dbContext.Entry(user).Reload();

            return GetByUserID(dbContext, userID);
        }

        /// <summary>
        /// Upserts the signed-in user from their access token claims. This is the single point where
        /// an Auth0 identity becomes an OregonTilth user, and it covers three cases:
        /// <list type="bullet">
        /// <item>a returning user, matched on GlobalID;</item>
        /// <item>a user who predates Auth0 or was pre-provisioned by an admin invite, matched on
        /// Email and stamped with their new GlobalID — their role and workbooks are preserved;</item>
        /// <item>a brand new self-signup, created as Unassigned for an admin to triage.</item>
        /// </list>
        /// Returns null when the token carries no email claim, since Email is required and unique.
        /// </summary>
        public static UserDto UpdateClaims(OregonTilthDbContext dbContext, int? userID, ClaimsPrincipal claims, out bool isNewUser)
        {
            isNewUser = false;

            var email = claims?.Claims.SingleOrDefault(c => c.Type == ClaimsConstants.Emails)?.Value;
            var globalID = claims?.Claims.SingleOrDefault(c => c.Type == ClaimsConstants.Sub)?.Value;
            var firstName = claims?.Claims.SingleOrDefault(c => c.Type == ClaimsConstants.GivenName)?.Value;
            var lastName = claims?.Claims.SingleOrDefault(c => c.Type == ClaimsConstants.FamilyName)?.Value;

            var user = userID.HasValue
                ? dbContext.Users.SingleOrDefault(x => x.UserID == userID)
                : dbContext.Users.SingleOrDefault(x => x.Email == email);

            if (user == null)
            {
                if (string.IsNullOrEmpty(email))
                {
                    return null;
                }

                user = new User
                {
                    GlobalID = globalID,
                    Email = email,
                    // FirstName and LastName are NOT NULL, and Auth0 does not guarantee a name claim
                    // (a bare email/password signup has none), so seed them empty and let the claims
                    // below fill them in when present.
                    FirstName = string.Empty,
                    LastName = string.Empty,
                    IsActive = true,
                    RoleID = (int) RoleEnum.Unassigned,
                    ReceiveSupportEmails = false,
                    CreateDate = DateTime.UtcNow
                };

                dbContext.Users.Add(user);
                isNewUser = true;
            }

            // Deliberately does not touch RoleID on an existing row: an invited user's role was set by
            // the admin who invited them, and a returning user's role is managed in the admin screens.
            if (!string.IsNullOrEmpty(globalID))
            {
                user.GlobalID = globalID;
            }

            if (!string.IsNullOrEmpty(firstName))
            {
                user.FirstName = firstName;
            }

            if (!string.IsNullOrEmpty(lastName))
            {
                user.LastName = lastName;
            }

            if (!string.IsNullOrEmpty(email))
            {
                user.Email = email;
            }

            if (!isNewUser)
            {
                user.UpdateDate = DateTime.UtcNow;
            }

            dbContext.SaveChanges();
            dbContext.Entry(user).Reload();

            return GetByUserID(dbContext, user.UserID);
        }

        public static List<ErrorMessage> ValidateUpdate(OregonTilthDbContext dbContext, UserUpsertDto userEditDto, int userID)
        {
            var result = new List<ErrorMessage>();
            if (!userEditDto.RoleID.HasValue)
            {
                result.Add(new ErrorMessage() { Type = "Role ID", Message = "Role ID is required." });
            }

            return result;
        }

        public static UserDto SetUserRole(OregonTilthDbContext dbContext, int userID, int roleID)
        {
            var user = dbContext.Users.Single(x => x.UserID == userID);

            user.RoleID = roleID;
            user.UpdateDate = DateTime.UtcNow;

            dbContext.SaveChanges();
            dbContext.Entry(user).Reload();
            return GetByUserID(dbContext, userID);
        }
    }
}