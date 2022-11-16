import * as mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
    role: {
        type: String,
        default: 'user'
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    }

}, { timestamps: true })