
//axios

export interface ProcessorPayload {
    method:string
    url: string;
    data?: unknown;
    headers?:Record<string, string>
}

// login

export interface LoginResponse {
    status: "success" | "error"
    message: string 
    userDetail? :{
        id:string;
        name:string
        email:string;
        role:"coordinator" | "worker"
    };
    accessJWT? : string
}

 export interface LoginPayload{
    email: string,
    password: string
 }