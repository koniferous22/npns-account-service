import path from 'path';

export default {
  type: process.env.ACCOUNT_DB_TYPE,
  host: process.env.ACCOUNT_DB_HOST,
  port: parseInt(process.env.ACCOUNT_DB_PORT ?? '', 10),
  username: process.env.ACCOUNT_DB_USERNAME,
  password: process.env.ACCOUNT_DB_PASSWORD,
  database: process.env.ACCOUNT_DB_DATABASE,
  migrations: [path.join(__dirname, 'src/migrations/**/*.ts')],
  entities: [path.join(__dirname, 'src/entities/**/*.ts')],
  cli: {
    migrationsDir: 'src/migrations',
    entitiesDir: 'src/entities'
  }
}
