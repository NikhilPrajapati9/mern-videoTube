import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
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

// Routes
import likeRouter from "./routes/like.routes.js";
import userRouter from "./routes/user.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";

app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);

export { app };
