//importing the required modules
import express from "express";
import session from "express-session";
import nocache from "nocache";
import path from "path";
import morgan from "morgan";
import dotenv from "dotenv";
import {fileURLToPath} from "url";
import connectDB from './config/db.js'
import passport from './config/passport.js'

//dotenv config
dotenv.config();

//database connection
connectDB();

//get the file path
const __filename=fileURLToPath(import.meta.url);                                                
const __dirname=path.dirname(__filename);                                                       

//create express app
const app=express();

// importing the routes
import userRouter from './routes/userRoutes.js'
import adminRouter from './routes/adminRoutes.js'


//middleware
app.use(express.json());                                                                        //parse json
app.use(express.urlencoded({extended:false}));                                                  //parse urlencoded
app.use(express.static(path.join(__dirname,'public')));                                         //set public directory
app.use(morgan('dev'));                                                                         //use morgan

//set template engine
app.set('view engine','ejs');                                                                  //set view engine
app.set('views',path.join(__dirname,'views'));                                                //set views directory

app.use(nocache());                                                                           //prevent caching

//session middleware
app.use(session({                                                                            
    secret:process.env.SESSION_SECRET, 
    resave:false,
    saveUninitialized:false,
    cookie:{maxAge:1000*60*60*24,secure:false},
}))

//passport middleware
app.use(passport.initialize());                                                                //initialize passport
app.use(passport.session());                                                                   //session middleware
        
// routes
app.use('/admin',adminRouter)                                                                  //admin routes
app.use('/',userRouter)                                                                         //user routes


//exporting the app
export default app