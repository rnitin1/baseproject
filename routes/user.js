const express = require('express');
const router = express.Router();
const passport = require('passport')
const session = require('express-session');
const user = require("../controller/user")

//router.use(express.urlencoded({extended:false}));
//router.use(passport.initialize());
// router.use(session({
//     secret:process.env.SESSION_SESSION,
//     resave:false,
//     saveUninitialized:false,
// }))

//Register 
router.post('/register',user.register)

//login
router.post('/login',passport.authenticate('local',{}),user.login)

//logout
router.delete('/logout',user.logout)

//change password
router.post('/changepassword',user.changepassword)

//forgot password
router.post('/forgotpasswordtoken',user.forgotpasswordtoken)//Sending OTP to user by nodemailer
router.post('/resetpassword',user.resetpassword)//Reseting the password by OTP

//List of users
router.get('/userslist',user.userslist)

// //http request to dashboard
router.get('/',user.homapage)





module.exports=router;