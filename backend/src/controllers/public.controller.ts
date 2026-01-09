import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()


export const getPublicEventType = async(req: Request, res: Response) =>{
    const {username, slug} = req.params

    try {
        const eventType = await prisma.eventType.findFirst({
            where: {
                slug,
                user: {username}
            },
            select:{
                id:true,
                title: true,
                description: true,
                durationMinutes: true,
                dailyLimit: true,
                locationDetails: true,
                locationType: true,
                bufferAfterMinutes: true,
                bufferBeforeMinutes: true,
                color: true,
                user: {
                    select: {
                        name: true,
                        username: true,
                        bio: true,
                        timezone: true
                    }
                },
                availabilityRules:{
                    select: {
                        dayOfWeek: true,
                        startTime: true,
                        endTime: true,
                        dateOverride: true
                    }
                },
                customQuestions: {
                    select: {
                        id: true,
                        questionText: true,
                        questionType: true,
                        options: true,
                        isRequired: true,
                    },
                    orderBy: {
                        id: "asc"
                    }
                },
            },
        })

        if(!eventType){
            return res.status(404).json({message: "Booking page not found."})
        }

        res.status(200).json({eventType})
    } catch (error) {
        res.status(401).json({message: "Failed to fetch booking page"})
    }
}