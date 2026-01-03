import {Request, Response} from "express"
import {z} from "zod"
import {
    registerUser, 
    loginUser, 
    forgotPassword, 
    verifyEmail, 
    resetPassword, 
    refreshAccessToken
} from "../services/auth.service"

const registerSchema = z.object({
    username: z.string().min(3),
    email: z.email(),
    password: z.string().min(6),
    name: z.string().min(2)
})

const loginSchema = z.object({
    identifier: z.string().min(3),
    password: z.string().min(1)
})



export const register = async(req: Request, res: Response) =>{
    try {
        const {username, email, password, name} = registerSchema.parse(req.body)
        const user = await registerUser(username, email, password, name)
        res.status(201).json({
            message: "User created. Check your email to verify"
        })
    }
    catch(error: any){
        res.status(401).json({error: error.message})
    }
}

export const verify = async(req: Request, res: Response) =>{
    try {
        const {email, code} = req.query 
        await verifyEmail(email as string, code as string)
        res.json({message: "Email verified."})

    } catch (error: any) {
        res.status(401).json({message: error.message})
    }
}

export const login = async(req: Request, res: Response) =>{
    try {
        const {identifier, password} = loginSchema.parse(req.body)

        const {user, accessToken, refreshToken} = await loginUser(identifier, password)

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: 30 * 24 * 60 * 60 * 1000
        })

        res.json({
            message: "Login Successful",
            accessToken,
            user :{
                id: user.id,
                email: user.email,
                username: user.username,
                name: user.name,
                timezone: user.timezone,
                bio: user.bio
            }
        })
    } catch (error: any) {
        res.status(401).json({error: error.message})
    }
}


export const forgot = async(req: Request, res: Response) =>{
    try {
        const {email} = z.object({
            email: z.string().email()
        }).parse(req.body)

        await forgotPassword(email)
        res.json({message: "If email exists, reset link sent."})

    } catch (error: any) {
        res.status(401).json({message: error.message})
    }
}

export const reset = async(req: Request, res: Response) =>{
    try {
        const {token, password} = z.object({
            token: z.string(),
            password: z.string().min(6)
        }).parse(req.body)

        await resetPassword(token, password)
        res.json({message: "Password reset successful."})

    } catch (error: any) {
        res.status(401).json({message: error.message})
    }
}

export const refresh = async(req: Request, res: Response) =>{
    try {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) throw new Error('No refresh token')
        
        const accessToken = await refreshAccessToken(refreshToken)
        res.json({accessToken})
    } catch (error: any) {
        res.status(401).json({ error: 'Invalid refresh token' });
  }
}

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
};