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
    posts:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Post',
    }]
});

const User = mongoose.model('User',userSchema);

export default User;