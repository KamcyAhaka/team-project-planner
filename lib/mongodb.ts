import { MongoClient, Db } from "mongodb";

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // Allow global var declarations across HMR in dev mode
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Returns the MongoClient promise, initializing connection lazily on demand.
 */
export function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'Invalid/Missing environment variable: "MONGODB_URI". Please set MONGODB_URI in your environment or .env file.'
    );
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      client = new MongoClient(uri, options);
      clientPromise = client.connect();
    }
    return clientPromise;
  }
}

/**
 * Helper function to retrieve the active MongoDB database instance.
 */
export async function getDb(dbName?: string): Promise<Db> {
  const mongoClient = await getClientPromise();
  return mongoClient.db(dbName);
}

export default getClientPromise;
