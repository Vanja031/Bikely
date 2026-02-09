import mongoose from "mongoose";
import bcrypt from "bcrypt";

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["admin"], default: "admin" },
  },
  { timestamps: true }
);

adminSchema.methods.verifyPassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

adminSchema.statics.createOrUpdateDefaultAdmin = async function ({
  email,
  password,
  name = "System Admin",
}) {
  if (!email || !password) return;

  const existing = await this.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.name = name;
    await existing.save();
    return existing;
  }

  return this.create({ email, passwordHash, name });
};

export const Admin = mongoose.model("Admin", adminSchema);

