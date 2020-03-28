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
const User = require('./model/user');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDocs = require('./config/userSwagger.json');


//Initializing swagger

// const swaggerOptions = {
//     swaggerDefinition : {
//         info : {
//             title:"User form",
//             description:"Login/Register form",
//             contact :{
//                 name:"Nitin",
//             },
//             servers:['http://localhost:3000']
//         }
        
//     },
//     apis:['server.js']
// }

//const swaggerDoc = swaggerJsDocs(swaggerOptions);
app.use('/documentation',swaggerUi.serve,swaggerUi.setup(swaggerJsDocs))
//connection to mongodb

mongoose.connect('mongodb://localhost/users'
        ,{useNewUrlParser:true
        ,useUnifiedTopology:true})



//passport verification

initializePassport(
    passport,
    email=> User.findOne({email:email
    })
    //id=>user.find(user =>user.id===id)
    )



//app.set('views','./views');
app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')
app.use(express.urlencoded({extended:false}));
app.use(flash())
app.use(session({
    secret:process.env.SESSION_SESSION,
    resave:false,
    saveUninitialized:false,
    

}))
app.use(passport.initialize());

app.use(passport.session());
app.use(methodOverride('_method'))

//Routes

//http request to dashboard
app.get('/',checkAuthenticate,(req,res)=>{
    //res.render('index',{name: req.user.name})
    res.status(200).send('logged in successfully')
    //session.email=req.user.email

})


//Register the user


app.get('/register',checkNotAuthenticate,(req,res)=>{
    res.render('register',/*{name:'Nitin'}*/)
})


app.post('/register',checkNotAuthenticate,async (req,res)=>{



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

        //res.header('something')
        //res.redirect('/login')
        //res.flash('Successfully registered')
   console.log(user);

    }
    catch (err) {
        console.log('====Error',err);
        
        res.send(err)

    }
 
})




//login

// /**
//  * @swagger
//  * /login:
//  *  post:
//  *    description: User Login page
//  *    responses:
//  *      '200':
//  *        description: A successful response
//  */

app.get('/login',checkNotAuthenticate,(req,res,next)=>{
    res.render('login')
})

app.post('/login',checkNotAuthenticate,passport.authenticate('local',{
    successRedirect:'/',
    failureRedirect:'/login',
    failureFlash:true,
    successFlash:"Welcome"
}

))

//logout

app.delete('/logout',(req,res,next)=>{
    req.logOut()
    //res.render('login')
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
//change password 


app.get('/changepassword',(req,res)=>{
    //let sess=req.session
    //if (sess.passport.email) {
        res.render('changepassword')
        
    //} else {
     //    res.send('session not maintained')
    //}
    
})
 

app.post('/changepassword',(req,res,next)=>{
    sess=req.session;

    console.log('above',req.body);
    console.log(sess);
    
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
    

        console.log('testing ',req.body)
        


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
                                        console.log(user,'Your password has been changed');
                                        
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







const port = process.env.Port || 3000;

app.listen(port,()=>console.log(`server is running at port ${port}.....`))

