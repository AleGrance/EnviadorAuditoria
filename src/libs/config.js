// Conexion con MSSQL
import sql from "mssql";

// PostgreSQL
const postgres = {
  database: process.env.PG_DB,
  username: process.env.PG_USER,
  password: process.env.PG_PWD,
  params: {
    dialect: "postgres",
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
  },
};

// MicrosoftSQL
const mssql = {
  user: process.env.MSQL_USER,
  password: process.env.MSQL_PWD,
  database: process.env.MSQL_DB,
  server: process.env.MSQL_HOST,
  port: parseInt(process.env.MSQL_PORT),
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: true, // for azure
    trustServerCertificate: true, // change to true for local dev / self-signed certs
    instanceName: process.env.MSQL_INST,
  },
};

let poolPromise;
async function connectWithRetry() {
  while (true) {
    try {
      poolPromise = await sql.connect(mssql);
      console.log("Conexión exitosa a la base de datos");
      return poolPromise;
    } catch (err) {
      console.error("Error al conectar a la base de datos:", { error: err.message });
      console.log("Reintentando conexión en 10 segundos...");
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Esperar 1 minuto antes de reintentar
    }
  }
}

// Llamar a la función connectWithRetry para establecer la conexión
connectWithRetry().catch((err) => {
  console.error("No se pudo establecer la conexión:", err.message);
  process.exit(1); // Salir de la aplicación en caso de error grave
});

export { postgres, mssql, poolPromise };
