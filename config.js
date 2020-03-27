require("dotenv").config();

const { Pool } = require("pg");
const isProduction = process.env.NODE_ENV === "production";

//const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
const connString =
  "postgres://auzatzkisdsljp:648cbc16f9f7f6a626b6262d4cecac89e23f3462a19d734a94783353a303b0e4@ec2-52-86-33-50.compute-1.amazonaws.com:5432/ddidkg3fq448st?ssl=true";

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : connString,
  //connectionString: connString,
  ssl: isProduction
});

pool.on("connect", () => console.log("connected to db"));

module.exports = { pool };
