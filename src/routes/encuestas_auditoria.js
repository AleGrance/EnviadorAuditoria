const cron = require("node-cron");
const { Op } = require("sequelize");
const apiKey = "WLZn19UEPUu4EcDUxE94WO9KnjsjVuaX";

module.exports = (app) => {
  const Encuestas_auditoria = app.db.models.Encuestas_auditoria;
  const Clientes_auditoria = app.db.models.Clientes_auditoria;

  /**
   *
   *  METODOS
   *
   */

  // GET: Obtener todas las encuestas. POST: Insertar una nueva encuesta
  app
    .route("/api/Encuestas_auditoria")
    .get((req, res) => {
      if (!req.headers.apikey) {
        return res.status(403).send({
          error: "Forbidden",
          message: "Tu petición no tiene cabecera de autorización",
        });
      }

      if (req.headers.apikey === apiKey) {
        Encuestas_auditoria.findAll({
          include: [
            {
              model: Clientes_auditoria,
            },
          ],
          order: [['createdAt', 'DESC']]
        })
          .then((result) => res.json(result))
          .catch((error) => {
            res.status(402).json({
              msg: error,
            });
          });
      } else {
        return res.status(403).send({
          error: "Forbidden",
          message: "Cabecera de autorización inválida",
        });
      }
    })
    .post((req, res) => {
      if (!req.headers.apikey) {
        return res.status(403).send({
          error: "Forbidden",
          message: "Tu petición no tiene cabecera de autorización",
        });
      }

      if (req.headers.apikey === apiKey) {
        console.log(req.body);
        Encuestas_auditoria.create(req.body)
          .then((result) =>
            res.json({
              status: "success",
              body: result,
            })
          )
          .catch((error) =>
            res.json({
              status: "error",
              body: error,
            })
          );
      } else {
        return res.status(403).send({
          error: "Forbidden",
          message: "Cabecera de autorización inválida",
        });
      }
    });

  // Obtener la encuesta por NRO_DOCUMENTO
  app.route("/api/Encuestas_auditoria/:NRO_DOCUMENTO").get((req, res) => {
    if (!req.headers.apikey) {
      return res.status(403).send({
        error: "Forbidden",
        message: "Tu petición no tiene cabecera de autorización",
      });
    }

    if (req.headers.apikey === apiKey) {
      Encuestas_auditoria.findAll({
        where: req.params,
        include: [
          {
            model: Clientes_auditoria,
          },
        ],
      })
        .then((result) => res.json(result))
        .catch((error) => {
          res.status(404).json({
            msg: error.message,
          });
        });
    } else {
      return res.status(403).send({
        error: "Forbidden",
        message: "Cabecera de autorización inválida",
      });
    }
  });

  // Trae los registros por rango de fecha desde hasta
  app.route("/api/Encuestas_auditoriaFecha").post((req, res) => {
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

      Encuestas_auditoria.findAll({
        where: {
          createdAt: {
            [Op.between]: [fecha_desde + " 00:00:00", fecha_hasta + " 23:59:59"],
          },
        },
        include: [
          {
            model: Clientes_auditoria,
          },
        ],
        order: [["createdAt", "DESC"]],
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

  // Obtener la encuesta por NRO DE CI del cliente
  // app.route("/api/Encuestas_auditoria/cedula/:pregunta1").get((req, res) => {
  //   Encuestas_auditoria.findAll({
  //     where: req.params,
  //     include: [
  //       {
  //         model: Clientes_auditoria,
  //       },
  //     ],
  //   })
  //     .then((result) => res.json(result))
  //     .catch((error) => {
  //       res.status(404).json({
  //         msg: error.message,
  //       });
  //     });
  // });
};
