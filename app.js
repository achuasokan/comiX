//? importing the required modules
import express from "express";
import session from "express-session";
import nocache from "nocache";
import path from "path";
import morgan from "morgan";
import dotenv from "dotenv";
import {fileURLToPath} from "url";
import connectDB from './config/db.js'
import passport from './config/passport.js'
import expressLayouts from 'express-ejs-layouts';
import flash from 'connect-flash'


//? dotenv config
dotenv.config();

//? database connection
connectDB();

//? get the file path
const __filename=fileURLToPath(import.meta.url);                                                
const __dirname=path.dirname(__filename);                                                       

//? create express app
const app=express();

//? importing the routes
import userRouter from './routes/userRoutes.js'
import adminRouter from './routes/adminRoutes.js'
import googleAuthRouter from './routes/googleAuthRoutes.js'



//? middleware
app.use(express.json());                                                                        
app.use(express.urlencoded({extended:false}));                                                  
app.use(express.static(path.join(__dirname,'public')));                                         
app.use(morgan('dev'));                                                                         

//? set template engine
app.set('view engine','ejs');                                                                  
app.set('views',path.join(__dirname,'views'));                                                

//? Use express-ejs-layouts middleware
app.use(expressLayouts);
app.set('layout', 'layouts/layout');                                                           

//? set cache
app.use(nocache());                                                                           

//? session middleware
app.use(session({                                                                            
    secret:process.env.SESSION_SECRET, 
    resave:false,
    saveUninitialized:false,
    cookie:{maxAge:1000*60*60*24,secure:false},
}))

//? flash middleware
app.use(flash());

app.use((req,res,next)=>{
  res.locals.success=req.flash('success')
  res.locals.error=req.flash('error')
  next()
})

//? passport middleware
app.use(passport.initialize());                                                                
app.use(passport.session());                                                                   
        
//? health check 
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running normally.' });
});

//? routes
app.use('/admin',adminRouter)                                                                  
app.use('/',userRouter)                                                                         
app.use('/',googleAuthRouter)

app.use((req,res, next) => {
  res.status(404).render('user/404',{title:'404 - Page Not Found'})
});



//? exporting the app
export default app