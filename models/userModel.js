import mongoose from 'mongoose';

const userSchema = new  mongoose.Schema({
    name:{
     type:String,
     required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    token:{type:String},
    createdAt:{
        type:String,
        default: new Date(),
    },
    post:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'post',
    }]
});

const User = mongoose.model('User',userSchema);

export default User;