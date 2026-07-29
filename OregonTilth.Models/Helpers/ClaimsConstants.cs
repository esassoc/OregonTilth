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
    }
}
