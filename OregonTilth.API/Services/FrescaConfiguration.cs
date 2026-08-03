namespace OregonTilth.API.Services
{
    public class FrescaConfiguration
    {
        public Auth0Configuration Auth0 { get; set; }
        public string DB_CONNECTION_STRING { get; set; }
        public string SITKA_EMAIL_REDIRECT { get; set; }
        public string WEB_URL { get; set; }
        public string SendGridApiKey { get; set; }
        public string PlatformLongName { get; set; }
        public string PlatformShortName { get; set; }
        public string LeadOrganizationLongName { get; set; }
        public string LeadOrganizationHomeUrl { get; set; }
        public string LeadOrganizationEmail { get; set; }
    }

    public class Auth0Configuration
    {
        /// <summary>Auth0 tenant issuer, e.g. https://your-tenant.us.auth0.com</summary>
        public string Authority { get; set; }

        /// <summary>The Auth0 API identifier this API validates tokens for.</summary>
        public string Audience { get; set; }
    }
}
