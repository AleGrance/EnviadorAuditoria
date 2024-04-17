const { Op } = require("sequelize");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
// Conexion con MSSQL
import sql from "mssql";
// Datos de la conexion MSSQL
import { mssql, poolPromise } from "../libs/config";

// Var para la conexion a WWA Free
const wwaUrl = "http://localhost:3008/lead";

// URL del notificador
const wwaUrl_Notificacion = "http://192.168.10.245:3088/lead";

// Datos del Mensaje de whatsapp
let fileMimeTypeMedia = "";
let fileBase64Media = "";
// Mensaje del notificador
let mensajeBody = "";

// Ruta de la imagen JPEG
const imagePath = path.join(__dirname, "..", "img", "img.jpeg");
// Leer el contenido de la imagen como un buffer
const imageBuffer = fs.readFileSync(imagePath);
// Convertir el buffer a base64
const base64String = imageBuffer.toString("base64");
// Mapear la extensión de archivo a un tipo de archivo
const fileExtension = path.extname(imagePath);
const fileType = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
}[fileExtension.toLowerCase()];

fileMimeTypeMedia = fileType;
// El split esta al pedo
fileBase64Media = base64String.split(",")[0];

// Tiempo de retraso de consulta al PGSQL para iniciar el envio. 1 minuto
var tiempoRetrasoPGSQL = 1000 * 60;
// Tiempo entre envios. Cada 15s se realiza el envío a la API free WWA
var tiempoRetrasoEnvios = 15000;

// Blacklist fechas
const blacklist = ["2023-05-02", "2023-05-16", "2023-08-15"];

module.exports = (app) => {
  const Clientes_auditoria = app.db.models.Clientes_auditoria;
  const Users = app.db.models.Users;

  // Ejecutar la funcion de consulta SQL de 24hs Ayer de Martes(2) a Sabados (6) a las 09:00am
  cron.schedule("*/10 7-19 * * 1-6", () => {
    let hoyAhora = new Date();
    let diaHoy = hoyAhora.toString().slice(0, 3);
    let fullHoraAhora = hoyAhora.toString().slice(16, 21);

    // Checkear la blacklist antes de ejecutar la función
    const now = new Date();
    const dateString = now.toISOString().split("T")[0];
    if (blacklist.includes(dateString)) {
      console.log(`La fecha ${dateString} está en la blacklist y no se ejecutará la tarea.`);
      return;
    }

    console.log("Hoy es:", diaHoy, "la hora es:", fullHoraAhora);
    console.log("CRON: Se consulta al CRM Clientes - Auditoria");
    injeccionMsql();
  });

  // Trae los datos del MSSQL - Intenta cada 1 min en caso de error de conexion
  function tryAgain() {
    console.log("Error de conexion con el MSSQL, se intenta nuevamente luego de 1m...");
    setTimeout(() => {
      injeccionMsql();
    }, 1000 * 60);
  }

  // Trae los datos del Firebird
  async function injeccionMsql() {
    console.log("Obteniendo los datos del MSSQL...");

    // Conexión
    try {
      //const pool = await sql.connect(mssql); //Anteriormente utilizada para conectar sólo con los parametros
      setTimeout(async () => {
        const pool = await poolPromise;
        const result = await pool.request().query(`SELECT * FROM Solicitudes
        WHERE solFaseID = 1012
        AND solmosID in (45,52)
        AND solTipoProductoID = 4`);

        console.log("Result:", result.recordset.length);

        const registrosObtenidos = result.recordset;
        const codigoPais = "595";

        registrosObtenidos.forEach((element) => {
          let e = {
            NRO_DOCUMENTO: element.solCI,
            NOMBRE: element.solNombres,
            APELLIDO: element.solApellidos,
            RUC: element.solruc,
            TELEFONO_UNO:
              element.solTel1.length == 10 ? element.solTel1.replace("0", codigoPais) : null,
            TELEFONO_DOS:
              element.solTel2.length == 10 ? element.solTel2.replace("0", codigoPais) : null,
            TELEFONO_TRES:
              element.solCel1.length == 10 ? element.solCel1.replace("0", codigoPais) : null,
          };

          // Para test
          // let e = {
          //   NRO_DOCUMENTO: element.solCI,
          //   NOMBRE: element.solNombres,
          //   APELLIDO: element.solApellidos,
          //   RUC: element.solruc,
          //   TELEFONO_DOS: 595986153301,
          // };

          // Poblar PGSQL
          Clientes_auditoria.create(e)
            //.then((result) => res.json(result))
            .catch((error) => console.log(error.message));
        });
      }, 6000);
    } catch (error) {
      console.log("Error en conexión SQL: ", { msg: error.code });
      console.log(error);
      tryAgain();
    }
  }

  //injeccionMsql();

  // Inicia los envios - Consulta al PGSQL
  let losRegistros = [];
  function iniciarEnvio() {
    console.log("Los envios iniciaran en 1 min...");

    setTimeout(() => {
      Clientes_auditoria.findAll({
        where: { estado_envio: 0 },
        order: [["createdAt", "DESC"]],
      })
        .then((result) => {
          losRegistros = result;
          console.log("Enviando encuesta auditoria:", losRegistros.length);
        })
        .then(() => {
          enviarMensaje();
        })
        .catch((error) => {
          res.status(402).json({
            msg: error.menssage,
          });
        });
    }, tiempoRetrasoPGSQL);
  }

  // Iniciar al arrancar la API
  iniciarEnvio();

  // Reintentar envio si la API WWA falla
  function retry() {
    console.log("Se va a intentar enviar nuevamente luego de 2m ...");
    setTimeout(() => {
      iniciarEnvio();
    }, 1000 * 60);
  }

  // Envia los mensajes
  let retraso = () => new Promise((r) => setTimeout(r, tiempoRetrasoEnvios));
  async function enviarMensaje() {
    console.log("Inicia el recorrido del for para enviar los turnos auditoria");
    try {
      for (let i = 0; i < losRegistros.length; i++) {
        try {
          const nroDocumento = losRegistros[i].NRO_DOCUMENTO;

          const mensajeCompleto = `Hola 😁 Sr/a ${losRegistros[i].NOMBRE}
*¡Desde Odontos queremos darle la Bienvenida y confirmar sus datos!*

Ingrese al link para completar su encuesta https://encuestas.odontos.com.py/encuesta-app/bienvenida/${losRegistros[i].NRO_DOCUMENTO}

Para cualquier consulta que tengas, por favor, añádenos en tus contactos al 0214129000 Servicio de atención al cliente vía WhatsApp y llamada.       
`;

          const dataBody = {
            message: mensajeCompleto,
            phone: losRegistros[i].TELEFONO_DOS
              ? losRegistros[i].TELEFONO_DOS
              : losRegistros[i].TELEFONO_TRES,
            mimeType: "",
            data: "",
            fileName: "",
            fileSize: "",
          };

          const response = await axios.post(wwaUrl, dataBody, { timeout: 1000 * 60 });
          // Procesar la respuesta aquí...
          const data = response.data;

          if (data.responseExSave.id) {
            console.log("Enviado - OK");
            // Se actualiza el estado a 1
            const body = {
              estado_envio: 1,
            };

            Clientes_auditoria.update(body, {
              where: { NRO_DOCUMENTO: nroDocumento },
            })
              //.then((result) => res.json(result))
              .catch((error) => {
                res.status(412).json({
                  msg: error.message,
                });
              });
          }

          if (data.responseExSave.unknow) {
            console.log("No Enviado - unknow");
            // Se actualiza el estado a 3
            const body = {
              estado_envio: 3,
            };

            Clientes_auditoria.update(body, {
              where: { NRO_DOCUMENTO: nroDocumento },
            })
              //.then((result) => res.json(result))
              .catch((error) => {
                res.status(412).json({
                  msg: error.message,
                });
              });
          }

          if (data.responseExSave.error) {
            console.log("No enviado - error");
            const errMsg = data.responseExSave.error.slice(0, 17);
            if (errMsg === "Escanee el código") {
              console.log("Error 104: ", errMsg);
              // Vacia el array de los turnos para no notificar por cada turno cada segundo
              losRegistros = [];
              throw new Error(`Error en sesión en respuesta de la solicitud Axios - ${errMsg}`);
            }
            // Sesion cerrada o desvinculada. Puede que se envie al abrir la sesion o al vincular
            if (errMsg === "Protocol error (R") {
              console.log("Error 105: ", errMsg);
              // Vacia el array de los turnos para no notificar por cada turno cada segundo
              losRegistros = [];
              throw new Error(`Error en sesión en respuesta de la solicitud Axios - ${errMsg}`);
            }
            // El numero esta mal escrito o supera los 12 caracteres
            if (errMsg === "Evaluation failed") {
              updateEstatusERROR(nroDocumento, 106);
              //console.log("Error 106: ", data.responseExSave.error);
            }
          }
        } catch (error) {
          console.log(error);
          // Manejo de errores aquí...
          if (error.code === "ECONNABORTED") {
            console.error("La solicitud tardó demasiado y se canceló", error.code);
            notificarSesionOff("Error02 de conexión con la API: " + error.code);
          } else {
            console.error("Error de conexión con la API: ", error.code);
            notificarSesionOff("Error02 de conexión con la API: " + error.code);
          }
          // Lanzar una excepción para detener el bucle
          losRegistros = [];
          throw new Error(`"Error de conexión en la solicitud Axios - ${error.code}`);
        }

        // Esperar 15 segundos antes de la próxima iteración
        await retraso();
      }
      console.log("Fin del envío");
      // Se vuelve a consultar al PGSQL
      iniciarEnvio();

    } catch (error) {
      console.error("Error en el bucle principal:", error.message);
      // Manejar el error del bucle aquí
    }
  }

  // Update estado en caso de error
  function updateEstatusERROR(nroDocumento, cod_error) {
    // Se actualiza el estado segun el errors
    const body = {
      estado_envio: cod_error,
    };

    Clientes_auditoria.update(body, {
      where: { NRO_DOCUMENTO: nroDocumento },
    })
      //.then((result) => res.json(result))
      .catch((error) => {
        res.status(412).json({
          msg: error.message,
        });
      });
  }

  /**
   *  NOTIFICADOR DE ERRORES
   */
  let retrasoNotificador = () => new Promise((r) => setTimeout(r, 5000));

  let numerosNotificados = [
    { NOMBRE: "Alejandro", NUMERO: "595986153301" },
    { NOMBRE: "Alejandro Corpo", NUMERO: "595974107341" },
    //{ NOMBRE: "Juan Corpo", NUMERO: "595991711570" },
  ];

  async function notificarSesionOff(error) {
    for (let item of numerosNotificados) {
      console.log(item);

      mensajeBody = {
        message: `*Error en la API - EnviadorAuditoria*
${error}`,
        phone: item.NUMERO,
        mimeType: "",
        data: "",
        fileName: "",
        fileSize: "",
      };

      // Envia el mensaje
      axios
        .post(wwaUrl_Notificacion, mensajeBody, { timeout: 10000 })
        .then((response) => {
          const data = response.data;

          if (data.responseExSave.id) {
            console.log("**Notificacion de ERROR Enviada - OK");
          }

          if (data.responseExSave.error) {
            console.log("**Notificacion de ERROR No enviado - error");
            console.log("**Verificar la sesion local: " + wwaUrl_Notificacion);
          }
        })
        .catch((error) => {
          console.error("**Ocurrió un error - Notificacion de ERROR No enviado:", error.code);
          console.log("**Verificar la sesion local: " + wwaUrl_Notificacion);
        });

      // Espera 5s
      await retrasoNotificador();
    }

    // Reintentar el envio luego de 1m
    retry();
  }

  /*
    Metodos
  */

  // app
  //   .route("/Clientes_auditoria")
  //   .get((req, res) => {
  //     Clientes_auditoria.findAll({
  //       order: [["createdAt", "DESC"]],
  //     })
  //       .then((result) => res.json(result))
  //       .catch((error) => {
  //         res.status(402).json({
  //           msg: error.menssage,
  //         });
  //       });
  //   })
  //   .post((req, res) => {
  //     //console.log(req.body);
  //     Clientes_auditoria.create(req.body)
  //       .then((result) => res.json(result))
  //       .catch((error) => res.json(error));
  //   });

  // // Trae los turnos que tengan en el campo estado_envio = 0
  // app.route("/Clientes_auditoriaPendientes").get((req, res) => {
  //   Clientes_auditoria.findAll({
  //     where: { estado_envio: 0 },
  //     order: [["FECHA_CREACION", "ASC"]],
  //     //limit: 5
  //   })
  //     .then((result) => res.json(result))
  //     .catch((error) => {
  //       res.status(402).json({
  //         msg: error.menssage,
  //       });
  //     });
  // });

  // // Trae los turnos que ya fueron notificados hoy
  // app.route("/Clientes_auditoriaNotificados").get((req, res) => {
  //   // Fecha de hoy 2022-02-30
  //   let fechaHoy = new Date().toISOString().slice(0, 10);

  //   Clientes_auditoria.count({
  //     where: {
  //       [Op.and]: [
  //         { estado_envio: 1 },
  //         {
  //           updatedAt: {
  //             [Op.between]: [fechaHoy + " 00:00:00", fechaHoy + " 23:59:59"],
  //           },
  //         },
  //       ],
  //     },
  //     //order: [["FECHA_CREACION", "DESC"]],
  //   })
  //     .then((result) => res.json(result))
  //     .catch((error) => {
  //       res.status(402).json({
  //         msg: error.menssage,
  //       });
  //     });
  // });

  // // Trae la cantidad de turnos enviados por rango de fecha desde hasta
  // app.route("/Clientes_auditoriaNotificadosFecha").post((req, res) => {
  //   let fechaHoy = new Date().toISOString().slice(0, 10);
  //   let { fecha_desde, fecha_hasta } = req.body;

  //   if (fecha_desde === "" && fecha_hasta === "") {
  //     fecha_desde = fechaHoy;
  //     fecha_hasta = fechaHoy;
  //   }

  //   if (fecha_hasta == "") {
  //     fecha_hasta = fecha_desde;
  //   }

  //   if (fecha_desde == "") {
  //     fecha_desde = fecha_hasta;
  //   }

  //   console.log(req.body);

  //   Clientes_auditoria.count({
  //     where: {
  //       [Op.and]: [
  //         { estado_envio: 1 },
  //         {
  //           updatedAt: {
  //             [Op.between]: [fecha_desde + " 00:00:00", fecha_hasta + " 23:59:59"],
  //           },
  //         },
  //       ],
  //     },
  //     //order: [["createdAt", "DESC"]],
  //   })
  //     .then((result) => res.json(result))
  //     .catch((error) => {
  //       res.status(402).json({
  //         msg: error.menssage,
  //       });
  //     });
  // });

  // app
  //   .route("/Clientes_auditoria/:id_turno")
  //   .get((req, res) => {
  //     Clientes_auditoria.findOne({
  //       where: req.params,
  //       include: [
  //         {
  //           model: Users,
  //           attributes: ["user_fullname"],
  //         },
  //       ],
  //     })
  //       .then((result) => res.json(result))
  //       .catch((error) => {
  //         res.status(404).json({
  //           msg: error.message,
  //         });
  //       });
  //   })
  //   .put((req, res) => {
  //     Clientes_auditoria.update(req.body, {
  //       where: req.params,
  //     })
  //       .then((result) => res.json(result))
  //       .catch((error) => {
  //         res.status(412).json({
  //           msg: error.message,
  //         });
  //       });
  //   })
  //   .delete((req, res) => {
  //     //const id = req.params.id;
  //     Clientes_auditoria.destroy({
  //       where: req.params,
  //     })
  //       .then(() => res.json(req.params))
  //       .catch((error) => {
  //         res.status(412).json({
  //           msg: error.message,
  //         });
  //       });
  //   });
};
