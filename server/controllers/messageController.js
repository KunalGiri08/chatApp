
import User from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";


export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        // Fetch all users except the current user
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");
        //count of unread messages for each user
        const unseenMessages = {}
        const promises = filteredUsers.map(async (user) => {
            const count = await Message.countDocuments({
                senderId: user._id,
                receiverId: userId,
                seen: false
            });

            if (count > 0) {
                unseenMessages[user._id] = count;
            }
        })
        await Promise.all(promises);
        res.json({
            success: true,
            users: filteredUsers,
            unseenMessages
        });



    } catch (error) {
        console.log(error.message);
        res.json({
            success: false,
            message: "Failed to fetch users for sidebar"
        });

    }
}

//Get all messages between two users
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 });
        await Message.updateMany(
            {
                senderId: selectedUserId,
                receiverId: myId,
                seen: false
            },
            {
                $set: { seen: true }
            });

        res.json({
            success: true,
            messages
        });

    } catch (error) {
        console.log(error.message);
        res.json({
            success: false,
            message: "Failed to fetch messages"
        });
    }
}

//api to mark messages as seen
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(
            id,
            {
                $set: { seen: true }
            }
        )
        res.json({
            success: true,
            message: "Message marked as seen"
        });

    } catch (error) {
        console.log(error.message);
        res.json({
            success: false,
            message: "Failed to mark message as seen"
        });
    }
}



// send message from one user to another
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const recieverId = req.params.id;
        const senderId = req.user._id;
        let imageUrl = "";
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId: recieverId,
            text,
            image: imageUrl
        });

        // Emit the new message to the receiver if they are online
        const receiverSocketId = userSocketMap[recieverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }


        res.json({
            success: true,
            message: "Message sent successfully",
            newMessage
        });

    } catch (error) {
        console.error(error);
        res.json({
            success: false,
            message: "Failed to send message"
        });
    }
}
