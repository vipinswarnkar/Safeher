import User from "../models/user.js";
import bcrypt from "bcrypt";

// Get Profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Update Profile
export const updateProfile = async (req, res) => {

  try {

    const { name, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        phone,
      },
      {
        new: true,
      }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile Updated",
      user,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const changePassword = async (req, res) => {

  try {

    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {

      return res.status(400).json({
        success:false,
        message:"Old Password Incorrect",
      });

    }

    user.password = newPassword;

    await user.save();

    return res.status(200).json({
      success:true,
      message:"Password Changed Successfully",
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success:false,
      message:"Internal Server Error",
    });

  }

};