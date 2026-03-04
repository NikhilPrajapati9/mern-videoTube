import cors from "cors";
import express from "express";
import cookieParser from "cookies-parser";

const app = express();

app.use(
  cors({
    //origin — Who can access your API
    origin: process.env.CORS_ORIGIN,
    credentials: true, // allows cookies, Authorization headers
    /*
    :=> methods — Which HTTP methods are allowed:->
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], 
     
    :=>allowedHeaders — Which request headers are allowed:->
      allowedHeaders: ['Content-Type', 'Authorization'],   
    
    :=>exposedHeaders — Headers browser can read in response:->
      // By default browser JS can only read basic headers
      // Use exposedHeaders to expose custom ones  
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'], 

    :=>preflightContinue & optionsSuccessStatus :->
       // preflight = browser sends OPTIONS request before actual request
       // to check if CORS is allowed  
       preflightContinue: false,    // default — cors handles OPTIONS automatically
       optionsSuccessStatus: 204,   // default status for OPTIONS response (some use 200)
    
    :=> maxAge — Cache preflight response:->
        maxAge: 86400, // browser caches preflight for 24 hours (in seconds)
                       // reduces OPTIONS requests being sent repeatedly   

    */
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(express.urlencoded({ extended: true, limit: "16kb" })); // convert url data into js object extenent all nested object

app.use(express.static("public"));
app.use(cookieParser());
export { app };
