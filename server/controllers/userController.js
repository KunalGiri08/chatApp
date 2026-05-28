import User from "../models/User";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils";

 

// signup controller function
 export const signup = async (req, res) => {

    const { fullName, email, password, bio } = req.body;

    try {

        if (!fullName || !email || !password || !bio) {
            return res.json({
                success: false,
                message: "All fields are required"
            });
        }

        const user = await User.findOne({ email });

        if (user) {
            return res.json({
                success: false,
                message: "User already exists"
            });
        }

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            bio
        });

        const token = generateToken(newUser._id);

        res.json({
            success: true,
            userData: newUser,
            message: "User created successfully",
            token
        });

    } catch (error) {

        console.log(error.message);

        return res.json({
            success: false,
            message: "An error occurred while creating the user"
        });
    }
}
// login controller function
export const login = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({
                success: false,
                message: "All fields are required"
            });
        }

        const userData = await User.findOne({ email });

        if (!userData) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);

        if (!isPasswordCorrect) {
            return res.json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const token = generateToken(userData._id);

        const user = await User.findOne({ email }).select("-password");

        res.json({
            success: true,
            userData: user,
            message: "User logged in successfully",
            token
        });

    } catch (error) {

        console.log(error.message);

        return res.json({
            success: false,
            message: "An error occurred while logging in the user"
        });
    }
}

export const checkAuth = async (req, res) => {
    res.json({
        success: true,
        user: req.user,
        message: "User is authenticated"
    });
}  