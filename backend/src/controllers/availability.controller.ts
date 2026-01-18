import { Request, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { getAvailableSlots } from "../services/availablity.service";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const prisma = new PrismaClient();

export const getAvailabilty = async(req: Request, res: Response)=>{
    const {eventTypeId} = req.params
    const {startDate, endDate, timezone} = req.query

    try {
        if(!startDate || !endDate){
            return res.status(400).json({message: "Start Date and End Date is required (YYYY-MM-DD)"})
        }

        const guestTimezone = (timezone as string) || "UTC"
        
        const slotsArray = await getAvailableSlots(
            eventTypeId,
            new Date(startDate as string), 
            new Date(endDate as string) , 
            guestTimezone) 

        // Transform slots array into grouped format: { "2026-01-18": ["09:00", "09:30", ...] }
        const slots: { [date: string]: string[] } = {}
        
        for (const slot of slotsArray) {
            const zonedStart = toZonedTime(slot.start, guestTimezone)
            const dateKey = format(zonedStart, 'yyyy-MM-dd')
            const timeValue = format(zonedStart, 'HH:mm')
            
            if (!slots[dateKey]) {
                slots[dateKey] = []
            }
            slots[dateKey].push(timeValue)
        }

        res.json({slots})
    } catch (error: any) {
        if (error.message === "Event not Found") {
            return res.status(404).json({message: error.message})
        }
        res.status(500).json({message: error.message || "Failed to fetch availability"})
    }
}

// Availability Rules Schema
// dayOfWeek: 1 = Monday, 2 = Tuesday, ..., 7 = Sunday (Luxon weekday convention)
const availabilityRuleSchema = z.object({
    dayOfWeek: z.number().int().min(1).max(7),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
})

const availabilityRulesArraySchema = z.array(availabilityRuleSchema)

export const getAvailabilityRules = async(req: Request, res: Response) => {
    try {
        const {id} = req.params
        const userId = req.user!.id

        const eventType = await prisma.eventType.findFirst({
            where: {id, userId},
            include: {availabilityRules: true}
        })

        if(!eventType) {
            return res.status(404).json({message: "Event Type Not Found"})
        }

        res.status(200).json({availabilityRules: eventType.availabilityRules})
    } catch (error: any) {
        res.status(500).json({message: error.message || "Failed to fetch availability rules"})
    }
}

export const setAvailabilityRules = async(req: Request, res: Response) => {
    try {
        const {id} = req.params
        const userId = req.user!.id
        const rules = availabilityRulesArraySchema.parse(req.body.rules)

        // Verify ownership
        const eventType = await prisma.eventType.findFirst({
            where: {id, userId}
        })

        if(!eventType) {
            return res.status(404).json({message: "Event Type Not Found"})
        }

        // Delete existing rules and create new ones in a transaction
        await prisma.$transaction([
            prisma.availabilityRule.deleteMany({
                where: {eventTypeId: id}
            }),
            prisma.availabilityRule.createMany({
                data: rules.map(rule => ({
                    eventTypeId: id,
                    dayOfWeek: rule.dayOfWeek,
                    startTime: rule.startTime,
                    endTime: rule.endTime
                }))
            })
        ])

        // Fetch updated rules
        const updatedRules = await prisma.availabilityRule.findMany({
            where: {eventTypeId: id},
            orderBy: {dayOfWeek: 'asc'}
        })

        res.status(200).json({availabilityRules: updatedRules})
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid input', details: error.message })
        }
        res.status(500).json({message: error.message || "Failed to update availability rules"})
    }
}