const cron = require("node-cron");
const { Op } = require("sequelize");
const apiKey = "WLZn19UEPUu4EcDUxE94WO9KnjsjVuaX";
import moment from "moment";

module.exports = (app) => {
  const Historicos_auditoria = app.db.models.Historicos_auditoria;
  const Clientes_auditoria = app.db.models.Clientes_auditoria;

  let historicoObj = {
    fecha: "",
    cant_enviados: 0,
    cant_no_enviados: 0,
    user_id: 1,
  };

  // Ejecutar la funcion a las 08:30 de Lunes(2) a Sabados (6)
  cron.schedule("00 20 * * 1-6", () => {
    let hoyAhora = new Date();
    let diaHoy = hoyAhora.toString().slice(0, 3);
    let fullHoraAhora = hoyAhora.toString().slice(16, 21);

    console.log("Hoy es:", diaHoy, "la hora es:", fullHoraAhora);
    console.log(
      "CRON: Se almacena el historico de los enviados hoy - auditoria"
    );
    cantidadEnviados();
  });

  async function cantidadEnviados() {
    // Fecha de hoy
    let fechaHoy = moment();
    // Se resta un DIA porque se ejecuta a las 20:30 y ???? esta tomando la hora + 04:00
    // Faltaria ver porque y o corregir para que tome la hora local
    let fechaAyer = fechaHoy.subtract(1, "days");
    let fechaAyerFormated = fechaAyer.format("YYYY-MM-DD");

    // La fecha con el dia restado
    historicoObj.fecha = fechaAyerFormated;

    historicoObj.cant_enviados = await Clientes_auditoria.count({
      where: {
        [Op.and]: [
          { estado_envio: 1 },
          {
            updatedAt: {
              [Op.between]: [fechaAyerFormated + " 00:00:00", fechaAyerFormated + " 23:59:59"],
            },
          },
        ],
      },
    });

    historicoObj.cant_no_enviados = await Clientes_auditoria.count({
      where: {
        [Op.and]: [
          { estado_envio: { [Op.ne]: 1 } },
          {
            updatedAt: {
              [Op.between]: [fechaAyerFormated + " 00:00:00", fechaAyerFormated + " 23:59:59"],
            },
          },
        ],
      },
    });

    console.log(historicoObj);

    Historicos_auditoria.create(historicoObj)
      .then((result) => {
        console.log("Se inserto la cantidad de envios de hoy en historico!");
      })
      //.catch((error) => console.log(error.detail));
      .catch((error) => console.log(error.message));
  }

  /**
   *
   *  METODOS
   *
   */

  // app
  //   .route("/api/historicosAuditoria")
  //   .get((req, res) => {
  //     Historicos_auditoria.findAll()
  //       .then((result) => res.json(result))
  //       .catch((error) => {
  //         res.status(402).json({
  //           msg: error.menssage,
  //         });
  //       });
  //   })
  //   .post((req, res) => {
  //     Historicos_auditoria.create(req.body)
  //       .then((result) => res.json(result))
  //       .catch((error) => res.json(error));
  //   });

  // Historicos por rango de fecha
  app.route("/api/historicosAuditoriaFecha").post((req, res) => {
    if (!req.headers.apikey) {
      return res.status(403).send({
        error: "Forbidden",
        message: "Tu petición no tiene cabecera de autorización",
      });
    }

    if (req.headers.apikey === apiKey) {
      let fechaHoy = new Date().toISOString().slice(0, 10);
      let { fecha_desde, fecha_hasta } = req.body;

      if (fecha_desde === "" && fecha_hasta === "") {
        fecha_desde = fechaHoy;
        fecha_hasta = fechaHoy;
      }

      if (fecha_hasta == "") {
        fecha_hasta = fecha_desde;
      }

      if (fecha_desde == "") {
        fecha_desde = fecha_hasta;
      }

      console.log(req.body);

      Historicos_auditoria.findAll({
        where: {
          fecha: {
            [Op.between]: [
              fecha_desde + " 00:00:00",
              fecha_hasta + " 23:59:59",
            ],
          },
        },
      })
        .then((result) => res.json(result))
        .catch((error) => {
          res.status(402).json({
            msg: error.menssage,
          });
        });
    } else {
      return res.status(403).send({
        error: "Forbidden",
        message: "Cabecera de autorización inválida",
      });
    }
  });
};
