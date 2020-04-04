if (process.env.NODE_ENV !=='production') {
    require('dotenv').config()
}

const express = require('express');
const app = express();
const passport = require('passport')
const session = require('express-session');
const flash = require('express-flash');
const path =require('path')
const mongoose = require('mongoose')
const methodOverride = require('method-override')
const initializePassport = require('./config/passport')
const User = require('./model/user');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDocs = require('./config/userSwagger.json');

//routes
const user = require('./routes/user')
app.use('/user',user)


//Initializing swagger
app.use('/documentation',swaggerUi.serve,swaggerUi.setup(swaggerJsDocs))

//passport verification
initializePassport(
    passport,
    email=> User.findOne({email:email
    }))

//connection to mongodb
mongoose.connect('mongodb://localhost/users'
        ,{useNewUrlParser:true
        ,useUnifiedTopology:true})





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




const port = process.env.Port || 3000;

app.listen(port,()=>console.log(`server is running at port ${port}.....`))
