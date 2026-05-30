import mongoose from "mongoose";

// Define the message schema
const messageSchema = new mongoose.Schema({
    senderId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiverId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text:{
        type: String,
    },
    image:{
        type: String,
    },
    seen:{
        type: Boolean,
        default: false
    }
    
},{timestamps: true});

// Create the message model
const Message = mongoose.model('Message', messageSchema);

export default Message;