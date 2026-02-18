import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ArrowBigLeft } from "lucide-react";

export const CreateNewUser = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        imageUrl: v.string()
    },
    handler: async (ctx, args) => {
        // If User already exist?
        const user = await ctx.db.query('UserTable')
            .filter((q) => q.eq(q.field('email'), args.email))
            .collect();

        if (user?.length == 0) {
            const userData = {
                name: args.name,
                email: args.email,
                imageUrl: args.imageUrl
            }
            //If Not then create New user
            const userId = await ctx.db.insert('UserTable', userData);
            // Return the complete user object with _id
            return {
                _id: userId,
                ...userData
            };
        }

        return user[0];

    }
})