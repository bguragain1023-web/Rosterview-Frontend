
import { createContext, useContext, useState } from 'react'
import type { IUser } from '../types/types';



interface UserContextType {
    user: IUser | undefined;
    setUser: React.Dispatch<React.SetStateAction<IUser | undefined>>;
}



const UserContext = createContext<UserContextType | undefined>(undefined);
export const UserProvider = ({children }: {children:React.ReactNode}) =>{

const [user, setUser] = useState<IUser| undefined>(undefined)



  return (
    <UserContext.Provider
    value= {{
        user, setUser
    }}
    >
        {children}
        </UserContext.Provider>
  )
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error ('UseUser must be within the UserProvider')
        
    }
    return context;
}