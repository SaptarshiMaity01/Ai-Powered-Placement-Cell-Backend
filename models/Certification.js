import mongoose from 'mongoose';

const certificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true },
  issuer: { type: String, required: true },
  date: { type: String, required: true },
  credentialLink: { type: String },
}, { timestamps: true });

const Certification = mongoose.model('Certification', certificationSchema);

export default Certification;
