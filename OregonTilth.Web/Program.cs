using System.Net;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;

namespace Fresca.Web
{
    public class Program
    {
        public static void Main(string[] args)
        {
            BuildWebHost(args).Run();
        }

        public static IWebHost BuildWebHost(string[] args)
        {
            var host = WebHost.CreateDefaultBuilder(args)
                .UseStartup<Startup>()
                .UseKestrel(options =>
                {
                    // http only. Local dev is plain http on the host-published port (compass slot
                    // offset +2 = 11852); the dev_cert.pfx that used to back a 443 listener here is
                    // not in the repo, so this threw on startup in Development.
                    options.Listen(IPAddress.Any, 80);
                })
                .Build();
            return host;
        }
    }
}
 