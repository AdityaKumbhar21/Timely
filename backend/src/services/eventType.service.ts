import { PrismaClient } from "@prisma/client";
import slugify from "slugify";


const prisma = new PrismaClient()

export const generateUniqueSlug = async(title: string, userId: string): Promise<string> =>{
    let slug = slugify(title, {lower: true, strict: true})
    let uniqueSlug = slug
    let counter = 1

    while(await prisma.eventType.findFirst({where: {userId, slug: uniqueSlug}})){
        uniqueSlug = `${slug}-${counter}`
        counter ++
    }

    return uniqueSlug
}