import {prisma} from "../generated/prisma/client.js"


export const registerUser = async(username: string, email: string, password: string, name: string) =>{
    const existringUser = prisma.user.
}