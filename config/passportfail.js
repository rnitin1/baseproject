const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User=require('../model/user')


function initialize(passport,getUserByEmail,getUserById) {

    const authenticateUser = async (email,password,done)=>{
        console.log("passedEmail  ",email, "passedPassword ")

        const user = getUserByEmail(email)
        console.log("ffff  ", email)
        if (user==null) {
            return done(null,false,{message:`No user with this email`})
        }else{

            

                try {
                    if (await bcrypt.compare(password,user.password)) {
                        // console.log(password);
                        
                        return done(null,user) 

                    }
                    else{

                        return done(null,false,{message:`Password incorrect`})

                    }
                } catch (err){
            
                    return done(err)

                }
            }
    }


    passport.use(new LocalStrategy(({
        usernameField:'email',
        passwordField:'password'
}),authenticateUser))

passport.serializeUser((user,done)=>{
    done(null,user.id)
})
passport.deserializeUser((id,done)=>{
    done(null,getUserById(id))
})
    
}

module.exports=initialize;
