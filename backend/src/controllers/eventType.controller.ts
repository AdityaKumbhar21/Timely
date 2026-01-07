import { Request, Response } from "express";
import {z} from "zod";
import { PrismaClient } from "@prisma/client";
import { generateUniqueSlug } from "../services/eventType.service";

const prisma = new PrismaClient()

const eventTypeSchema = z.object({
    title: z.string().min(3).max(100),
    description: z.string().optional(),
    durationMinutes: z.number().int().positive(),
    locationType: z.enum(["IN_PERSON","VIRTUAL" ,"PHONE" ,"CUSTOM"]),
    locationDetails: z.string().nullable().optional(),
    bufferBeforeMinutes: z.number().int().positive().min(0).default(0),
    bufferAfterMinutes: z.number().int().positive().min(0).default(0),
    dailyLimit: z.number().int().positive().nullable().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).default("#3498db")
})


const updateEventTypeSchema = eventTypeSchema.partial().extend({
    title: z.string().min(3).max(100).optional()
})


export const createEventType = async(req: Request, res: Response)=>{
    try {
        const body = eventTypeSchema.parse(req.body)
        const userId = req.user!.id

        const slug = await generateUniqueSlug(body.title, userId)
        const eventType = await prisma.eventType.create({
            data:{
                ...body,
                slug,
                userId
            },
            include:{
                availabilityRules: true,
                customQuestions: true
            }
        })

        res.status(201).json({eventType})
    } catch (error: any) {
        res.status(401).json({message: error.Error.message})
    }
}

export const getEventType = async(req: Request, res: Response) =>{
    try {
        const userId = req.user!.id

        const eventTypes = await prisma.eventType.findMany({
            where: {userId},
            include:{
                availabilityRules: true,
                customQuestions: true,
                _count: {select: {bookings: true}}
            },
            orderBy: {createdAt: "desc"}
        })

        res.status(200).json({eventTypes})
    } catch (error: any) {
        res.status(401).json({message: error.Error.message})
    }
}

export const getEventTypeById = async(req: Request, res: Response) =>{
    try {
        const id = req.params
        const userId = req.user!.id

        const eventType = await prisma.eventType.findFirst({
            where: {id, userId},
            include:{
                availabilityRules: true,
                customQuestions: true
            }
        })

        if(!eventType){
            return res.status(401).json({message: "Event Type Not Found"})
        }

        res.status(200).json(eventType)
    } catch (error: any) {
        res.status(401).json({message: error.Error.message})
    }
}

export const updateEventType = async(req: Request, res: Response) =>{
    try {
        const {id} = req.params
        const body = updateEventTypeSchema.parse(req.body)
        const userId = req.user!.id

        let slug = undefined
        if(body.title){
            slug = await generateUniqueSlug(body.title, userId)

            const existing = await prisma.eventType.findFirst({
                where: {slug, userId, NOT:{id}}
            })

            if(existing){
                return res.status(401).json({message: "Event with same title exists."})
            }
        }


        const updatedEventType = await prisma.eventType.update({
            where: {id, userId},
            data: {
                ...body,
                slug
            }
        })

        res.status(200).json({eventType: updatedEventType})
    } catch (error: any) {
        res.status(401).json({message: error.Error.message})
    }
}

export const deleteEvent = async(req: Request, res: Response) =>{
    const {id} = req.params
    const userId = req.user!.id

    try {
        await prisma.eventType.delete({
            where: {id, userId}
        })

        res.status(200).json({message: "Event Type deleted successfully."})
    } catch (error: any) {
        if(error.code == "P2025"){
            return res.status(404).json({ error: 'Event type not found' });
        }
        res.status(500).json({ error: 'Failed to delete event type' });
    }
}