using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using OregonTilth.API.Services;
using OregonTilth.API.Services.Hierarchy;
using OregonTilth.EFModels.Entities;
using Serilog;
using System;
using System.IO.Compression;
using System.Linq;
using OregonTilth.API.Services.Logging;
using OregonTilth.API.Services.SitkaSmtpClientService;
using ILogger = Serilog.ILogger;
using SendGrid;

namespace OregonTilth.API
{
    public class Startup
    {
        private readonly IWebHostEnvironment _environment;
        public Startup(IWebHostEnvironment environment, IConfiguration configuration)
        {
            Configuration = configuration;
            _environment = environment;

        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers().AddNewtonsoftJson(opt =>
                {
                    if (!_environment.IsProduction())
                    {
                        opt.SerializerSettings.Formatting = Formatting.Indented;
                    }
                    opt.SerializerSettings.DateTimeZoneHandling = DateTimeZoneHandling.Utc;
                    var resolver = opt.SerializerSettings.ContractResolver;
                    if (resolver != null)
                    {
                        if (resolver is DefaultContractResolver defaultResolver)
                        {
                            defaultResolver.NamingStrategy = null;
                        }
                    }
                });

            services.AddResponseCompression(options =>
            {
                options.EnableForHttps = true;
                options.Providers.Add<BrotliCompressionProvider>();
                options.Providers.Add<GzipCompressionProvider>();
                options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[] { "application/json" });
            });
            services.Configure<BrotliCompressionProviderOptions>(options => options.Level = CompressionLevel.Optimal);
            services.Configure<GzipCompressionProviderOptions>(options => options.Level = CompressionLevel.Optimal);

            services.Configure<FrescaConfiguration>(Configuration);

            // todo: Calling 'BuildServiceProvider' from application code results in an additional copy of singleton services being created.
            // Consider alternatives such as dependency injecting services as parameters to 'Configure'.
            var frescaConfiguration = services.BuildServiceProvider().GetService<IOptions<FrescaConfiguration>>().Value;

            // Auth0 issues tokens with a real API-specific audience, so unlike Keystone both the
            // issuer and the audience are validated. Inbound claim mapping is left at its default
            // (on), which is why UserContext reads the WS-Fed URIs from ClaimsConstants.
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
            {
                options.Authority = frescaConfiguration.Auth0.Authority;
                options.Audience = frescaConfiguration.Auth0.Audience;
            });

            services.AddDbContext<OregonTilthDbContext>(c =>
            {
                c.UseSqlServer(frescaConfiguration.DB_CONNECTION_STRING, x =>
                {
                    x.CommandTimeout((int)TimeSpan.FromMinutes(3).TotalSeconds);
                });
            });

            services.AddSingleton(Configuration);
            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();

            // Factory overload (rather than a pre-built instance) so the client is not constructed
            // until it is first resolved. SendGridClient's ctor throws on a null key, and unlike
            // Beacon this project ships no SendGridApiKey default in appsettings.json, so building
            // it eagerly here would stop keyless environments from starting at all.
            services.AddSingleton<ISendGridClient>(_ => new SendGridClient(frescaConfiguration.SendGridApiKey));
            services.AddSingleton<SitkaSmtpClientService>();

            services.AddHealthChecks().AddDbContextCheck<OregonTilthDbContext>();

            services.AddScoped<HierarchyContext>();
            services.AddScoped(s => s.GetService<IHttpContextAccessor>().HttpContext);
            services.AddScoped(s => UserContext.GetUserFromHttpContext(s.GetService<OregonTilthDbContext>(), s.GetService<IHttpContextAccessor>().HttpContext));
            services.AddControllers();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
                // Dev is excluded: Visual Studio injects ASPNETCORE_HTTPS_PORT with the *host*-published
                // port, so in a container this would bounce plain-http callers to a different port than
                // the one they dialed, which is confusing when several stacks share host ports.
                app.UseHttpsRedirection();
            }
            app.UseResponseCompression();
            app.UseSerilogRequestLogging(opts =>
            {
                opts.EnrichDiagnosticContext = LogHelper.EnrichFromRequest;
                opts.GetLevel = LogHelper.CustomGetLevel;
            });
            app.UseRouting();
            app.UseCors(policy =>
            {
                //TODO: don't allow all origins
                policy.AllowAnyOrigin();
                policy.AllowAnyHeader();
                policy.AllowAnyMethod();
                policy.WithExposedHeaders("WWW-Authenticate");
            });

            app.UseAuthentication();
            app.UseAuthorization();


            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapHealthChecks("/healthz");
            });

            
        }
        

       
    }
}
