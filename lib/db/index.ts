import { neon, NeonQueryFunction } from '@neondatabase/serverless'

let sqlInstance: NeonQueryFunction<false, false> | null = null

export function getDb() {
  if (!sqlInstance) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    sqlInstance = neon(connectionString)
  }
  return sqlInstance
}
