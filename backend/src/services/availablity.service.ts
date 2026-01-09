import { PrismaClient } from "@prisma/client";
import {DateTime} from "luxon";
import {addMinutes, isWithinInterval, areIntervalsOverlapping} from "date-fns"


const prisma = new PrismaClient()

interface Slot{
    start: Date,
    end: Date
}

export const getAvailableSlots = async(
    eventTypeId: string,
    startDate: Date,
    endDate: Date,
    guestTimezone: string = "UTC",
): Promise <Slot []> =>{
    
    const eventType = await prisma.eventType.findFirst({
        where: {id: eventTypeId},
        include:{availabilityRules: true, user: true}
    })

    if(!eventType) throw new Error("Event not Found")

    const hostTimezone = eventType.user?.timezone || "UTC"

    const existingBookings = await prisma.booking.findMany({
        where: {
            eventTypeId,
            startTime: {gte: startDate},
            endTime: {lte: endDate},
            status: "CONFIRMED"
        },
        select:{
            startTime: true,
            endTime: true
        }
    })
    
    const bookedIntervals = existingBookings.map(b => ({
        start: b.startTime,
        end: b.endTime
    }))

    const slots: Slot[] = []

    let current = DateTime.fromJSDate(startDate).setZone(hostTimezone).startOf("day")
    const end = DateTime.fromJSDate(endDate).setZone(hostTimezone).endOf("day")

    while(current <= end){
        const dayOfWeek = current.weekday

        const rules = eventType.availabilityRules.filter(
            r => r.dayOfWeek === dayOfWeek || r.dateOverride?.toDateString() === current.toJSDate().toDateString()
        )
    }

    //TODO: complete this function
    return slots
}   