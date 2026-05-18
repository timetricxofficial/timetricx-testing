import mongoose, { Schema, Document } from "mongoose";

export interface IAttempt {
  attemptNo: number;
  time: string; // IST Time string
  status: "success" | "partial" | "fail";
  confidence?: number;
}

export interface ISession {
  scheduledAt: string; // IST DateTime string
  nextRetryAt?: string; // IST DateTime string
  finalStatus: "pending" | "success" | "suspicious" | "missed";
  interruptedReason?: string;
  attempts: IAttempt[];
}

export interface IFaceVerificationLog extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  date: string; // YYYY-MM-DD (IST)
  sessions: ISession[];
}

const AttemptSchema = new Schema<IAttempt>({
  attemptNo: { type: Number, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ["success", "partial", "fail"], required: true },
  confidence: { type: Number },
});

const SessionSchema = new Schema<ISession>({
  scheduledAt: { type: String, required: true },
  nextRetryAt: { type: String },
  finalStatus: { 
    type: String, 
    enum: ["pending", "success", "suspicious", "missed"], 
    default: "pending" 
  },
  interruptedReason: { type: String },
  attempts: [AttemptSchema],
});

const FaceVerificationLogSchema = new Schema<IFaceVerificationLog>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userEmail: { type: String, required: true },
  date: { type: String, required: true },
  sessions: [SessionSchema],
}, { timestamps: true });

// Delete cached model to force schema refresh (development only)
if (mongoose.models.FaceVerificationLog) {
    delete mongoose.models.FaceVerificationLog;
}


// Index for faster queries
FaceVerificationLogSchema.index({ userEmail: 1, date: 1 });

export const FaceVerificationLog = mongoose.models.FaceVerificationLog || 
  mongoose.model<IFaceVerificationLog>("FaceVerificationLog", FaceVerificationLogSchema);
