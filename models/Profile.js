import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  name: String,
  email: String,
  phone: String,
  profilePicture: String,
  resumeLink: String,
  linkedinUrl: String,
  githubUrl: String,
  portfolioUrl: String,
},
{
    timestamps: true,
  });


const Profile = mongoose.model('Profile', ProfileSchema);
export default Profile;