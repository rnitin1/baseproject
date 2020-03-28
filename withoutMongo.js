if (process.env.NODE_ENV !=='production') {
    require('dotenv').config()
}

const express = require('express');
const app = express();
const passport = require('passport')
const session = require('express-session');
const flash = require('express-flash');
const bcrypt = require('bcrypt');
const path =require('path')
const joi = require('joi')
const initializePassport = require('./config/passport')
const methodOverride = require('method-override')
const mongoose = require('mongoose')


//connection to mongodb

mongoose.connect('mongodb://localhost/users'
        ,{useNewUrlParser:true
        ,useUnifiedTopology:true})



//passport verification
initializePassport(
    passport,
    email=>users.find(user =>user.email===email),
    id=>users.find(user =>user.id===id)
    )
    
    


const users = [];


//app.set('views','./views');
app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')
app.use(express.urlencoded({extended:false}));
app.use(flash())
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false

}))
app.use(passport.initialize());

app.use(passport.session());
app.use(methodOverride('_method'))



//http request to dashboard
app.get('/',checkAuthenticate,(req,res)=>{
    res.render('index',{name: req.user.name})
})

//Register the user


app.get('/register',checkNotAuthenticate,(req,res)=>{
    res.render('register',/*{name:'Nitin'}*/)
})

app.post('/register',checkNotAuthenticate,async (req,res)=>{
    try{
        const hashPassword =await bcrypt.hash(req.body.password,10);
        users.push({
            id:Date.now().toString(),
            name: req.body.name,
            email:req.body.email,
            password:hashPassword,
        });
        //res.header('something')
        res.redirect('/login')
        //res.flash('Successfully registered')

    }
    catch{
        res.redirect('/register')

    }
    console.log(users);
 
})


//login

app.get('/login',checkNotAuthenticate,(req,res,next)=>{
    res.render('login')
})

app.post('/login',checkNotAuthenticate,passport.authenticate('local',{
    successRedirect:'/',
    failureRedirect:'/login',
    failureFlash:true
}
))

//logout

app.delete('/logout',(req,res,next)=>{
    req.logOut()
    res.render('login')
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



const validateData = (user)=>{
    const schema = {
        Name:joi.string().min(3).required(),
        Email:joi.string().email().trim().required(),
        Password:joi.string().regex(/^[a-zA-Z0-9!@#$%&*]{3,25}$/).min(6).required()

    }
}
//change password 
//forgot password

const port = process.env.Port || 3000;
app.listen(port,()=>console.log(`server is running at port ${port}.....`))