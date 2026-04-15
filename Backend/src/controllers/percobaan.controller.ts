import { Request, Response, NextFunction } from "express"
import { register } from "node:module"
import { percobaanService } from "../services/percobaan.service"
export const percobaanController = {
    async  register (req: Request, res : Response , next:NextFunction ){
        try {
            const user = await percobaanService.register(req?.body)

            res.status(201).json({
                success : true, 
                message : 'create user successfully',
                data : user
            })

        }catch (error:any){
            console.log(error)
            res.status(401).json({
                success : false, 
                message : 'error',
                data : error.massage
            })
        }
    }, 
    
}