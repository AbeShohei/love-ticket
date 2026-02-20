"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";

export const sendPush = action({
    args: {
        pushToken: v.string(),
        title: v.string(),
        body: v.string(),
        data: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        // Check if token is valid
        if (!args.pushToken) {
            console.log("No push token, skipping notification:", args.title);
            return;
        }

        const message = {
            to: args.pushToken,
            sound: 'default',
            title: args.title,
            body: args.body,
            data: args.data || {},
        };

        try {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            const result = await response.json();
            console.log('Push notification sent:', result);
        } catch (error) {
            console.error('Error sending push notification:', error);
        }
    },
});
