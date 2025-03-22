import express from 'express';
import User from '../models/userModel.js';
import Post from '../models/postModel.js';
import bcrypt  from 'bcryptjs';
import nodemailer from 'nodemailer';
import { guestRoutes, protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();
//nodemailer credential
var transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "061f7115930e35",
    pass: "f6457e4ec8b4f6"
  }
});


// login route
router.get('/login', guestRoutes,(req,res)=>{
    res.render('login',{title:'LOGIN PAGE', active:'login'});
});

// route for register page
router.get('/register',guestRoutes,(req,res)=>{
    res.render('register',{title:'REGISTER PAGE', active:'register'});
});


// route for forget password page
router.get('/forget-password',guestRoutes,(req,res)=>{
    res.render('forget-password',{title:'FORGET PASSWORD PAGE', active:'forgot'});
});

// route for reset password page
router.get('/reset-password/:token',guestRoutes,async(req,res)=>{
    const {token} = req.params;
    const user = await User.findOne({ token});
    if(!user){
        req.flash('error','links expire or invalid');
        return res.redirect('/forget-password');
    }

    res.render('reset-password',{title:'RESET PASSWORD PAGE', active:'reset',token});
});
// route for profile page

router.get('/profile',protectedRoute, (req,res)=>{
res.render('profile',{title:'PROFILE PAGE', active:'profile'});
});
// handle user registration

router.post('/register', guestRoutes , async(req,res)=>{
    const {name,email,password} = req.body;
    try{
        const Userexist = await User.findOne({email});
        if(Userexist){
            req.flash('error','user already exists with this email');
         return res.redirect('/register');
        }
        const hashedPassword = await bcrypt.hash(password,10);
        const user = new User({
          name,
          email,
          password:hashedPassword,  
        });
       await user.save();
        req.flash('success','user registered successfully, you can login now!');
        res.redirect('/login');
    }catch(error){
        req.flash('error','Something when wrong try again');
        res.redirect('/register');
    }
})

// handling login  request
router.post('/login', guestRoutes, async(req,res)=>{
   const {email,password} = req.body;
 try {
 const user = await User.findOne({email});
 if(user && await bcrypt.compare(password, user.password)){
    req.session.user = user;
    res.redirect('/profile');
}else{
    req.flash('error','Invalid Credential!');
    res.redirect('/login');
}
 } catch (error) {
    req.flash('error','Something when wrong try again');
    res.redirect('/login');
 }
});

// logout button
router.post('/logout',(req,res)=>{
req.session.destroy();
res.redirect('/login');
});

router.get('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/login');
    });

    // handling forgot password post request
    router.post('/forget-password', async(req,res)=>{
        const {email} = req.body;
        try {
             const user = await User.findOne({email});
             if(!user){

                req.flash('error', 'User not found  with this email');
                return res.redirect('/forget-password');
             }
             const token = Math.random().toString(36).slice(2);
             user.token = token;
             await user.save();

             const info = await transporter.sendMail({
                from:'noudjemambe@gmail.com',//sender address
                to: email, // list of receivers
                subject: "Password Reset", // Subject line
                text: "Reset Your Password?", // plain text body
                html: `<p>click this link to reset your password: <a href='http://localhost:8000/reset-password/${token}'>Reset Password</a><br>Thank You!</p>`, // html body
              });
            if(info.messageId){
                req.flash('success','Password reset link has been send to your email!');
                res.redirect('/forget-password');
            }else{
                req.flash('error','error sending email');
                res.redirect('/forget-password');
            }

        } catch (error) {
         req.flash('error','Something when wrong try again');
         res.redirect('/forget-password');
        }
    });

    // handling the reset password post request 
    router.post("/reset-password", async(req,res)=>{
        const {token,new_password,confirm_new_password } = req.body;
        try {
            const user = await User.findOne({token});
            if(new_password != confirm_new_password){
                req.flash('error','password do not match');
                return redirect(`/reset-password/${token}`);
            }
             

             if(!user){
                req.flash('error','Invalid token!');
                return redirect(`/forget-password`);
            }

            user.password = await bcrypt.hash(new_password,10);
             user.token = null;
             await user.save();
             req.flash('success','password reset successful');
             res.redirect('/login');
             
        } catch (error) {
         req.flash('error','Something when wrong try again');
         res.redirect(`/reset-password/${token}`);
        }
    });


export default router;