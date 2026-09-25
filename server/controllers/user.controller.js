import User from "../models/user.js";

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

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    if (updates.phone) {
      const phoneTaken = await User.findOne({
        phone: updates.phone,
        _id: { $ne: req.user._id },
      });

      if (phoneTaken) {
        return res.status(400).json({
          success: false,
          message: "This phone number is already in use",
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      returnDocument: "after",
      runValidators: true,
    }).select("-password");

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

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

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