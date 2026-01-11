import { Request, Response } from "express";
import { getAvailableSlots } from "../services/availablity.service";

export const getAvailabilty = async(req: Request, res: Response)=>{
    const {eventTypeId} = req.params
    const {startDate, endDate, timezone} = req.query

    try {
        if(!startDate || !endDate){
            return res.status(400).json({message: "Start Date and End Date is required (YYYY-MM-DD)"})
        }

        const slots = await getAvailableSlots(
            eventTypeId,
            new Date(startDate as string), 
            new Date(endDate as string) , 
            (timezone as string) || "UTC") 

        res.json({slots})
    } catch (error: any) {
        if (error.message === "Event not Found") {
            return res.status(404).json({message: error.message})
        }
        res.status(500).json({message: error.message || "Failed to fetch availability"})
    }
}