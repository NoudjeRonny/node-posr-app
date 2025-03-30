// protecT routes middleware function

export const protectedRoute = (req ,res, next)=>{
if(!req.session.user){
    return res.redirect('/login');
}
next();
}
//guest routes middlewares function
export const guestRoutes = (req,res,next)=>{
    if(req.session.user){
        return res.redirect('/profile');
    }
    next();
}

