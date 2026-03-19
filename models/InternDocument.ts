import mongoose, { Schema, Document } from 'mongoose';

export interface IInternDocument extends Document {
  internEmail: string;

  resume?: string;
  aadhar?: string;
  collegeId?: string;
  offerLetter?: string;
  signedOfferLetter?: string;
  noc?: string;
  marksheet10?: string;
  marksheet12?: string;

  createdAt: Date;
  updatedAt: Date;
}

const InternDocumentSchema = new Schema<IInternDocument>(
  {
    internEmail: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    resume: String,
    aadhar: String,
    collegeId: String,
    offerLetter: String,
    signedOfferLetter: String,
    noc: String,
    marksheet10: String,
    marksheet12: String,
  },
  { timestamps: true, strict: false }
);

// Force fresh model on every hot-reload (dev mode)
if (mongoose.models.InternDocument) {
  delete mongoose.models.InternDocument;
}

export default mongoose.model<IInternDocument>('InternDocument', InternDocumentSchema);
