import * as mongoose from "mongoose";

export const VerifySchema = new mongoose.Schema({
    type: {
        type: String,
        default: 'emailVerify'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        required: true
    }

}, { timestamps: true })