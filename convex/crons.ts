import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

// Check weather alerts daily at 6 AM UTC
crons.daily(
    "check weather alerts",
    { hourUTC: 6, minuteUTC: 0 },
    api.alerts.checkWeatherAlerts
);

// Check budget alerts daily at 12 PM UTC
crons.daily(
    "check budget alerts",
    { hourUTC: 12, minuteUTC: 0 },
    api.alerts.checkBudgetAlerts
);

// Check packing reminders daily at 9 AM UTC
crons.daily(
    "check packing reminders",
    { hourUTC: 9, minuteUTC: 0 },
    api.alerts.checkPackingReminders
);

// Check custom booking reminders hourly
crons.hourly(
    "check custom booking reminders",
    { minuteUTC: 0 }, // Every hour on the hour
    api.alerts.checkCustomBookingReminders
);

// Clean up old weather forecasts weekly (Sunday at 2 AM UTC)
crons.weekly(
    "cleanup old weather forecasts",
    { hourUTC: 2, minuteUTC: 0, dayOfWeek: "sunday" },
    internal.weather.cleanupOldForecasts
);

// Clean up old alerts monthly (1st of month at 3 AM UTC)
crons.monthly(
    "cleanup old alerts",
    { hourUTC: 3, minuteUTC: 0, day: 1 },
    internal.alerts.cleanupOldAlerts
);

export default crons;
