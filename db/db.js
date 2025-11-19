const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'tecfix_db', 
  password: 'sankle185', 
  port: 5432,
});

module.exports = pool;