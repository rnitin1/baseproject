const express = require('express');
const router = express.Router();
const passport = require('passport')
const session = require('express-session');
const bcrypt = require('bcrypt');
const joi = require('joi')
const User = require('../model/user');
const crypto =require('crypto')
const nodemailer = require('nodemailer')
const async = require('async');
const mongoose = require('mongoose')


//middlewares
router.use(express.urlencoded({extended:false}));
router.use(passport.initialize());
router.use(session({
    secret:process.env.SESSION_SESSION,
    resave:false,
    saveUninitialized:false,
}))



//Register 
router.post('/register',checkNotAuthenticate,async (req,res)=>{
    User.findOne({email:req.body.email},async(err,user)=>{
        if(user){
            return res.send("User already have account")
        
        }else {
            let {error} = validateData(req.body) // equals to result.error
            if(error ) return res.status(404).send(error.details[0].message);

            try{
                const hashPassword =await bcrypt.hash(req.body.password,10);
                const user= new User({
                    _id:new mongoose.Types.ObjectId,
                    name: req.body.name,
                    email:req.body.email,
                    password:hashPassword,
                    
                })
                user.save()
                        .then(result=>console.log(result))
                        .catch(err=>console.log(err))

                res.send(user)
            }
            catch (err) {
                console.log('====Error',err);
                
                res.send(err)

            }
 
        }
    })

})

//login
router.post('/login',checkNotAuthenticate,passport.authenticate('local',{}),
(req,res)=>{
   res.send(`Welcome ${req.user.name}`)
   
})

//logout
router.delete('/logout',(req,res,next)=>{
    req.logOut();
    return res.send('Logged out')
    //res.render('login')
})

//change password
router.post('/changepassword',(req,res,next)=>{
    sess=req.session;

    //checking whether in session
    if (sess.passport.user.email) {
        // validating change password 
        const validateChangepassword = (user)=>{
            const schema = {
                newpassword:joi.string().min(6).regex(/^[a-zA-Z0-9!@#$%&*]{3,25}$/),
                password:joi.string(),
                confirmpassword:joi.string()
            }
            return joi.validate(user,schema)
        }
        let {error}=validateChangepassword(req.body);//object distucturing(result.error)
        if(error ) return res.status(404).send(error.details[0].message);
    
        const oldPassword=req.body.password;
        const newPassword=req.body.newpassword;
        const confirmPassword=req.body.confirmpassword;


        User.findOne({'email':sess.passport.user.email},async (err,user)=>{
            //console.log('testing 2',req.body)

            if(user !=null){
                //comparing password
                await bcrypt.compare(oldPassword,user.password,async (err,res)=>{
                    if (res) {
                        //confirming password
                        if (newPassword==confirmPassword) {
                            await bcrypt.hash(newPassword,10,(err,hash)=>{
                                user.password=hash;
                                console.log('newpassword',user.password);
                                
                                user.save((err,user)=>{
                                    if (err) {
                                        return console.log(err);
                                        
                                    } else {
                                        console.log('Your password has been changed');
                                        
                                    }
                                })
                            })
                        }
                    }
                    
                })
            }

        })

        
    }

    
})

//forgot password


//-------------Sending OTP to user by nodemailer
router.post('/forgotpasswordtoken',(req,res,next)=>{
    async.waterfall([
        (done)=>{
            //creating token or OTP
            crypto.randomBytes(2,(err,buf)=>{
                let token = buf.toString('hex');
                done(err,token)
            })
        },
        //Checking whether mail exists or not
        (token,done)=>{
            User.findOne({email:req.body.email},(err,user)=>{
                if (!user) {
                    return res.send('No user with this Email')
                    
                    
                }else{
                    //assigning token to user
                    user.resetPasswordToken=token;
                    user.resetPasswordExpire=Date.now()+3600000;//hour
                }
                user.save((err)=>{
                    done(err,token,user)
                })
            })
        },
        //Initializing nodemailer
        (token,user,done)=>{
            const smtpTransport = nodemailer.createTransport({
                service:'Gmail',
                auth:{
                    user:'nitinrana000111@gmail.com',
                    pass:process.env.GMAILPW
                }
            })
            const mailOptions = {
                to:user.email,
                from: 'nitinrana000111@gmail.com',
                subject:"Password reset OTP",
                text:'OTP : '+token
            }
            smtpTransport.sendMail(mailOptions,(err)=>{
                console.log('mail sent');
                res.send('OTP sent')
                return done(err)
            })
        }
    ],
    (err)=>{
        if (err) {
            //res.send(err)
            return next(err)
            
        }
    })

})


// ----------------Reseting the password by OTP
router.post('/resetpassword',(req,res,next)=>{
    async.waterfall([
        (done)=>{
            //checking OTP 
            User.findOne({resetPasswordToken:req.body.token,
                resetPasswordExpire:{$gt:Date.now()}},
                (err,user)=>{
                    if (!user) {
                        return res.send(`OTP is invalid or has expired ${err}`)
                    } else {
                        if (req.body.password===req.body.confirmpassword) {
                            //user.setPassword(req.body.newpassword,(err)=>{
                                user.resetPasswordToken=undefined;
                                user.resetPasswordExpire=undefined;
                                bcrypt.hash(req.body.password,10,(err,hash)=>{
                                    user.password=hash;

                                    user.save((err,user)=>{
                                        if (err) {
                                            return res.send(err)
                                        }
                                        res.send('Password changed successfully ')
                                    })
                                })
                           // })
                        }else{
                            res.send('Password did not match')
                        }
                    }
                })
        }
    ])
})

//List of users
router.get('/userslist',(req,res,next)=>{
    User.find({},(err,user)=>{
        if(err){
            next (err)
        }else{
            res.send(user)
        }
    })
    
    
})
// //http request to dashboard
router.get('/',checkAuthenticate,(req,res)=>{
    res.status(200).send('You have to logout first')
})


//checking authentication

function checkAuthenticate(req,res,next) {
    if(req.isAuthenticated()){
        return next()
    }else{
        return res.redirect('/login')
    }
}


function checkNotAuthenticate(req,res,next) {
    if(req.isAuthenticated()){
        return res.redirect('/')
    }else{
        return next()
    }
}


//validation Schema
const validateData = (user)=>{
    const schema = {
        name:joi.string().min(3),
        email:joi.string().email().trim(),
        password:joi.string().regex(/^[a-zA-Z0-9!@#$%&*]{3,25}$/).min(6)

    }
    return joi.validate(user,schema)
}


module.exports=router;