import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import {verifyAccessToken, verifyRefreshToken} from "../utils/jwt"
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

declare global{
    namespace Express{
        interface Request{
            user?:{
                id: string;
                name: string;
                email: string;
                username: string;
                timezone: string | null;
                bio: string | null;
            }
        }
    }
}

export const authenticate = async(req: Request, res: Response, next: NextFunction) =>{
    try {
        const authHeader = req.headers.authorization

        if(!authHeader || !authHeader.startsWith("Bearer")){
        return res.status(401).json({message: "Access token requried"})
        }

        const token = authHeader.split(" ")[1]

        const payload =  verifyAccessToken(token) as {userId : string}

        const user = await prisma.user.findFirst({
            where: {id: payload.userId},
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                bio: true,
                timezone: true
            }
        })

        if(!user){
            return res.status(401).json({message: "Invalid token - User not found"})
        }

        req.user = user
        next()
    } catch (error) {
        res.status(401).json({message: "Invalid or expired access token"})
    }

}