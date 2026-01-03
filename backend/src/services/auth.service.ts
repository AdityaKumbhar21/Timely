import argon2 from "argon2"
import { PrismaClient } from "@prisma/client"
import { randomBytes } from "node:crypto"
import { sendPasswordResetEmail, sendVerificationEmail } from "./email.service"
import { generateAccessToken, generateRefresToken } from "../utils/jwt"
import jwt from "jsonwebtoken"

const prisma = new PrismaClient()


export const registerUser = async(username: string, email: string, password: string, name: string) =>{
    const existringUser = await prisma.user.findFirst({
        where: { OR : [{email}, {username}]}
    })

    if (existringUser) {
        throw new Error("Email or username already exists.")
    }

    const passwordHash = await argon2.hash(password)
    const verificationCode = randomBytes(3).toString("hex").toUpperCase()

    const user = await prisma.user.create({
        data: {
            email,
            username,
            passwordHash,
            name,
            verificationCode
        }
    })

    await sendVerificationEmail(email, name, verificationCode)

    return user
}

export const verifyEmail = async(email: string, code: string) => {
    const user = await prisma.user.findUnique({
        where: {email}
    })

    if(!user || user.verificationCode !== code || user.isVerified){
        throw new Error("Invalid or expired verification code")
    }

    return await prisma.user.update({
        where: {id: user.id},
        data: {
            isVerified: true,
            verificationCode: null
        }
    })

}

export const loginUser = async(identifier: string, password: string) =>{
    const user = await prisma.user.findFirst({
        where: {OR: [
            {email: identifier.toLowerCase()},
            {username: identifier}
        ]}
    })

    if(!user){
        throw new Error("User not Found")
    }

    const isPasswordValid = argon2.verify(user.passwordHash, password)

    if(!isPasswordValid){
        throw new Error("Invalid Credentials")
    }

    if(!user.isVerified){
        throw new Error("Please verify your email first")
    }


    const accessToken = generateAccessToken(user.id)
    const refreshToken = generateRefresToken(user.id)

    await prisma.user.update({
        where: {id: user.id},
        data: {refreshToken}
    })

    return {user, accessToken, refreshToken}
}

export const forgotPassword = async(identifier: string) =>{
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                {email: identifier.toLowerCase()},
                {username: identifier}
            ]
        }
    })

    if(!user) return

    const token = randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 3600000)

    await prisma.user.update({
        where: {id: user.id},
        data:{
            passwordResetToken: token, passwordResetExpires: expires
        }
    })

    await sendPasswordResetEmail(user.email, token)
}

export const resetPassword = async(token: string, newPassword: string) =>{
    const user = await prisma.user.findFirst({
        where: {
            passwordResetToken: token,
            passwordResetExpires: {gt: new Date()}
        }
    })

    if(!user) {
        throw new Error("Invalid or expired token")
    }

    const passwordHash = await argon2.hash(newPassword)

    return await prisma.user.update({
        where: {id: user.id},
        data: {
            passwordHash,
            passwordResetExpires: null,
            passwordResetToken: null
        }
    })


}

export const refreshAccessToken = async(refreshToken: string) =>{
    const user = await prisma.user.findFirst({
        where: {refreshToken}
    })

    if (!user) {
        throw new Error("Invalid refresh token")
    }

    try {
        const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKE_SECRET!)
        return generateAccessToken((payload as any).userId)

    } catch (error) {
        throw new Error("Invalid refresh token")
    }
}

