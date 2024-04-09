const postgres = {
  // PostgreSQL
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
    instanceName: process.env.MSQL_INST
  },
};

export {postgres, mssql}
