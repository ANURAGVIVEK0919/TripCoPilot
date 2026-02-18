import { createContext } from "react";
import { Id } from "@/convex/_generated/dataModel";

export type UserDetail = {
    _id: Id<"UserTable">;
    name: string;
    email: string;
    imageUrl: string;
    subscription?: string;
}

export type UserDetailContextType = {
    userDetail: UserDetail | null;
    setUserDetail: React.Dispatch<React.SetStateAction<UserDetail | null>>;
}

export const UserDetailContext = createContext<UserDetailContextType | null>(null);