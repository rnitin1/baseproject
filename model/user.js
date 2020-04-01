const mongoose = require ('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({

    _id:mongoose.Schema.Types.ObjectId,

    name: {
        type:String,
        index:true,
        default:null,
        trim:true,
        sparse:true,
        required:true
    },

    email:{
        type: String,
        trim: true,
        index: true,
        unique: true,
        required:true
        
    },
    
    password:{
        type:String,
        required:true
        
    },
    resetPasswordToken:String,
    resetPasswordExpire:Date
})

module.exports=mongoose.model('user',userSchema)