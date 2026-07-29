using System.Linq;
using System.Security.Claims;

namespace OregonTilth.Models.Helpers
{
    /// <summary>
    /// Claim types as they appear on the ClaimsPrincipal after ASP.NET Core's default inbound claim
    /// mapping has run. The JWT from Auth0 carries the short OIDC names ("sub", "email", ...); the
    /// JwtBearer handler rewrites them to these WS-Federation URIs unless MapInboundClaims is
    /// disabled. Ported from noria so the identity code stays copy-compatible between the two apps.
    /// </summary>
    public static class ClaimsConstants
    {
        public static string Sub = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
        public static string Emails = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";
        public static string FamilyName = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname";
        public static string GivenName = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname";

        /// <summary>
        /// Auth0 puts only sub/iss/aud/scope/azp on an access token, and it silently drops custom
        /// claims that are not namespaced with a URI. So the profile fields this app needs have to be
        /// added by a Login Action under this namespace:
        /// <code>
        /// exports.onExecutePostLogin = async (event, api) => {
        ///   const ns = 'https://kyctg.oregontilth.org/';
        ///   api.accessToken.setCustomClaim(ns + 'email', event.user.email);
        ///   api.accessToken.setCustomClaim(ns + 'given_name', event.user.given_name);
        ///   api.accessToken.setCustomClaim(ns + 'family_name', event.user.family_name);
        /// };
        /// </code>
        /// Namespaced claims are not touched by inbound claim mapping, hence the separate constants.
        /// Email in particular must come from the signed token and never from the request body: it is
        /// what <c>User.UpdateClaims</c> matches on to adopt a pre-provisioned invite row, so a
        /// client-supplied value would let a caller claim the role an admin granted someone else.
        /// </summary>
        public const string CustomClaimNamespace = "https://kyctg.oregontilth.org/";

        public static string NamespacedEmail = CustomClaimNamespace + "email";
        public static string NamespacedGivenName = CustomClaimNamespace + "given_name";
        public static string NamespacedFamilyName = CustomClaimNamespace + "family_name";

        /// <summary>
        /// Reads the first non-empty value among <paramref name="claimTypes"/>, so callers can accept
        /// either the namespaced Auth0 custom claim or the mapped standard claim without caring which
        /// the tenant emits.
        /// </summary>
        public static string FindFirstValue(ClaimsPrincipal claimsPrincipal, params string[] claimTypes)
        {
            return claimTypes
                .Select(claimType => claimsPrincipal?.Claims.FirstOrDefault(c => c.Type == claimType)?.Value)
                .FirstOrDefault(value => !string.IsNullOrEmpty(value));
        }
    }
}
