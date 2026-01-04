import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import z from "zod";

const prisma = new PrismaClient()


const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    bio: z.string().min(1).optional(),
    timezone: z.string().optional()
})

export const getMe = (req: Request, res: Response) =>{
    res.json({user: req.user})
}

export const updateProfile = async(req: Request, res: Response) => {
    try {
        const body = updateProfileSchema.parse(req.body)

        const updatedUser = await prisma.user.update({
            where: {id: req.user!.id},
            data: body,
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                bio: true,
                timezone: true,
            }
        })

        res.json({user: updatedUser})
        
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.message });
        }
        res.status(500).json({ error: 'Failed to update profile' });
  
    }
}