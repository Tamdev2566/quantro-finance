import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

let pool = null;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
  });
}

export const isPostgres = () => Boolean(pool);

export const query = async (text, params) => {
  if (!pool) throw new Error('Database pool not initialized (DATABASE_URL missing)');
  return pool.query(text, params);
};

export const getClient = async () => {
  if (!pool) throw new Error('Database pool not initialized (DATABASE_URL missing)');
  return pool.connect();
};

export { pool };
export default { pool, query, getClient, isPostgres };
