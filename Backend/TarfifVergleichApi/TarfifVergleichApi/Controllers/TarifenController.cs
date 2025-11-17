using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace TarfifVergleichApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TarifenController : ControllerBase
    {
        [HttpGet]
        public void GetTarif()
        {

        }
    }
}
