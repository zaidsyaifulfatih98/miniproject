import { Users } from "../../generated/prisma/browser";
import prisma from "../configs/pool-coonection.config";
import bycrypt from "bcrypt"
import { v4 as uuidv4 } from "uuid"
export const percobaanService = {
    async register ({
        email,
        password,
        full_name,
        birth_date,
        gender,
        address,
        role
    }: Pick<Users, 'email' | 'password' | 'full_name' | 'birth_date' | 'address' | 'gender' | 'role' >){
         
        const findEmailbyid = await prisma.users.findFirst({
            where : {email}
        })

        if (findEmailbyid) throw new Error('Email is already registered')

        const hashedPassword = await bycrypt.hash(password, 10)
        const referral_code = uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase()

        await prisma.users.create({
        data : {
            email, 
            password : hashedPassword, 
            full_name, 
            address,
            birth_date,
            gender,
            role,
            referral_code
        }           
    })

    }

}