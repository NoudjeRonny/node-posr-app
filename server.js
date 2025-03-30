import express from 'express';
import dotenv from 'dotenv';
import connectMongoDB from './db.js';
import authRoutes from './routes/authRoutes.js';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import flash from 'connect-flash';
import postRoute from './routes/postRoute.js';
import nodemailer from 'nodemailer';
import path from 'path';
// import connectMongoDB from './db';

const app = express();
dotenv.config(); // loading the .env file
const port = process.env.PORT || 8001;

//connect to mongodb database
connectMongoDB();
// middlewares
app.use(express.json()); // pass all the request in to json format
app.use(express.urlencoded({extended:false}));
 // make upload directories as static
 app.use('/uploads', express.static(path.join(process.cwd(),'uploads')));
// cookie middleware
app.use(cookieParser(process.env.COOKIE_SECRET));

//session middleware
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    cookie:{
        maxAge:60000*60*24*7 // for one week
    }
})); // for storing authenticated user

// store authenticated user's session data for views
app.use(function(req,res,next){
res.locals.user = req.session.user || null;
next();
});
// flash messages middleware
app.use(flash())

// store flash messages
app.use(function (req,res,next){
    res.locals.message = req.flash();
    next();
})
//////////////////////////////////testing node mailer

// setting ejs view engine
app.set('view engine','ejs');
//seting the Authe routes
app.use('/',authRoutes);
//home route
app.use("/",postRoute);

app.listen(port,()=>{
    console.log(`server is runing on port http://localhost:${port}`);
});