import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDB = async () => {
  try {
    const connecctionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    console.log(
      `\n MongoDB connected !! DB HOST: ${connecctionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection error", error);
    process.exit(1);
    /*process.exit() immediately terminates the Node.js process with an optional exit code.

    Basic Syntax:->
    process.exit(); // exits with code 0 (success)
    process.exit(0); // exits with code 0 (success)
    process.exit(1); // exits with code 1 (failure)
    process.exit(code); // any integer code

    Exit Codes:->
    process.exit(0);   // ✅ Success — everything went fine
    process.exit(1);   // ❌ General error / failure
    process.exit(2);   // ❌ Misuse of shell command
    process.exit(127); // ❌ Command not found
    process.exit(128); // ❌ Invalid exit argument
    process.exit(130); // ❌ Terminated by Ctrl+C (SIGINT)
    */
  }
};

/*


## What's Inside `connectionInstance :->

When you `await mongoose.connect()`, it returns the **Mongoose instance** with connection details. Here's what's inside:
## Log it to see everything

const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

console.log(connectionInstance);                          // entire mongoose object
console.log(connectionInstance.connection);               // most useful part
console.log(connectionInstance.connection.host);          // hostname
console.log(connectionInstance.connection.port);          // port
console.log(connectionInstance.connection.name);          // database name
console.log(connectionInstance.connection.readyState);    // connection state
```


## Most Useful — `connectionInstance.connection` :->

{
  host: 'localhost',           // or 'cluster.mongodb.net' for Atlas
  port: 27017,                 // MongoDB default port
  name: 'myDatabase',         // DB name you connected to
  readyState: 1,              // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting

  // Connection string info
  id: 0,                      // connection id
  collections: {},            // loaded collections
  models: {},                 // registered models on this connection

  // Config options
  options: {
    autoIndex: true,
    autoCreate: true,
    sanitizeFilter: false,
    minPoolSize: 0,
    maxPoolSize: 100,          // max connections in pool
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 0,
    family: 0,
  }
}


## `readyState` Values :->
connectionInstance.connection.readyState;
// 0 → disconnected
// 1 → connected ✅
// 2 → connecting
// 3 → disconnecting


## Full Top-Level Structure :->
connectionInstance = {
  connection: { ... },       // ← main connection object (most useful)
  connections: [ ... ],      // array of all connections
  models: { ... },           // all registered mongoose models
  Schema: [Function],        // mongoose Schema class
  model: [Function],         // mongoose model function
  plugin: [Function],        // global plugin function
  version: '8.x.x',         // mongoose version
}

*/
