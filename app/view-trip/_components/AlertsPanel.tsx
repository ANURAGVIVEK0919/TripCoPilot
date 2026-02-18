'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
    AlertCircle,
    CloudRain,
    Package,
    DollarSign,
    FileText,
    Bell,
    X,
    Clock,
    CheckCircle2,
    Settings,
    ChevronRight,
} from 'lucide-react';

interface AlertsPanelProps {
    userId: Id<'UserTable'>;
    tripId: string;
}

export default function AlertsPanel({ userId, tripId }: AlertsPanelProps) {
    const [showPreferences, setShowPreferences] = useState(false);
    
    // Get trip alerts
    const alerts = useQuery(api.alerts.getTripAlerts, { userId, tripId });
    
    // Get user preferences
    const preferences = useQuery(api.alerts.getAlertPreferences, { userId });
    
    // Mutations
    const markRead = useMutation(api.alerts.markAlertRead);
    const dismiss = useMutation(api.alerts.dismissAlert);
    const snooze = useMutation(api.alerts.snoozeAlert);
    const updatePreferences = useMutation(api.alerts.updateAlertPreferences);

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'weather':
                return <CloudRain className="w-5 h-5" />;
            case 'packing':
                return <Package className="w-5 h-5" />;
            case 'budget':
                return <DollarSign className="w-5 h-5" />;
            case 'document':
                return <FileText className="w-5 h-5" />;
            case 'activity':
                return <Bell className="w-5 h-5" />;
            default:
                return <AlertCircle className="w-5 h-5" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200';
            case 'warning':
                return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200';
            case 'info':
                return 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200';
            default:
                return 'bg-gray-50 dark:bg-gray-950 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200';
        }
    };

    const handleDismiss = async (alertId: Id<'TravelAlerts'>) => {
        await dismiss({ alertId });
    };

    const handleSnooze = async (alertId: Id<'TravelAlerts'>, hours: number) => {
        await snooze({ alertId, snoozeHours: hours });
    };

    const handleMarkRead = async (alertId: Id<'TravelAlerts'>) => {
        await markRead({ alertId });
    };

    const handleUpdatePreference = async (key: string, value: any) => {
        await updatePreferences({
            userId,
            [key]: value,
        });
    };

    if (!alerts || !preferences) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const unreadCount = alerts.filter((a: any) => !a.isRead).length;
    const criticalCount = alerts.filter((a: any) => a.severity === 'critical').length;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Travel Alerts
                        </h3>
                    </div>
                    {unreadCount > 0 && (
                        <span className="px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-full">
                            {unreadCount} new
                        </span>
                    )}
                    {criticalCount > 0 && (
                        <span className="px-2 py-1 text-xs font-semibold text-white bg-orange-600 rounded-full">
                            {criticalCount} urgent
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setShowPreferences(!showPreferences)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                    <Settings className="w-4 h-4" />
                    <span>Preferences</span>
                </button>
            </div>

            {/* Preferences Panel */}
            {showPreferences && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                        Alert Preferences
                    </h4>
                    <div className="space-y-3">
                        {/* Alert Types */}
                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.weatherAlerts}
                                    onChange={(e) => handleUpdatePreference('weatherAlerts', e.target.checked)}
                                    className="rounded text-blue-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Weather Alerts</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.packingReminders}
                                    onChange={(e) => handleUpdatePreference('packingReminders', e.target.checked)}
                                    className="rounded text-blue-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Packing Reminders</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.budgetAlerts}
                                    onChange={(e) => handleUpdatePreference('budgetAlerts', e.target.checked)}
                                    className="rounded text-blue-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Budget Alerts</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.activityReminders}
                                    onChange={(e) => handleUpdatePreference('activityReminders', e.target.checked)}
                                    className="rounded text-blue-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Activity Reminders</span>
                            </label>
                        </div>

                        {/* Budget Thresholds */}
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Budget Alert Thresholds (%)
                            </label>
                            <div className="flex items-center space-x-2">
                                {[80, 90, 100].map(threshold => (
                                    <label key={threshold} className="flex items-center space-x-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preferences.budgetThresholds?.includes(threshold)}
                                            onChange={(e) => {
                                                const newThresholds = e.target.checked
                                                    ? [...(preferences.budgetThresholds || []), threshold]
                                                    : (preferences.budgetThresholds || []).filter(t => t !== threshold);
                                                handleUpdatePreference('budgetThresholds', newThresholds);
                                            }}
                                            className="rounded text-blue-600"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{threshold}%</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Packing Reminder Days */}
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Packing Reminders (days before trip)
                            </label>
                            <div className="flex items-center space-x-2">
                                {[7, 3, 1].map(days => (
                                    <label key={days} className="flex items-center space-x-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preferences.packingReminderDays?.includes(days)}
                                            onChange={(e) => {
                                                const newDays = e.target.checked
                                                    ? [...(preferences.packingReminderDays || []), days]
                                                    : (preferences.packingReminderDays || []).filter(d => d !== days);
                                                handleUpdatePreference('packingReminderDays', newDays);
                                            }}
                                            className="rounded text-blue-600"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{days} day{days !== 1 ? 's' : ''}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Alerts List */}
            {alerts.length === 0 ? (
                <div className="text-center py-12">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        All Clear!
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        No active alerts for this trip. We'll notify you of any important updates.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {alerts.map((alert: any) => (
                        <div
                            key={alert._id}
                            className={`rounded-lg border p-4 ${getSeverityColor(alert.severity)} ${!alert.isRead ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                    <div className={`p-2 rounded-lg ${
                                        alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-900' :
                                        alert.severity === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' :
                                        'bg-blue-100 dark:bg-blue-900'
                                    }`}>
                                        {getAlertIcon(alert.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                {alert.title}
                                            </h4>
                                            {!alert.isRead && (
                                                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded">
                                                    NEW
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                            {alert.message}
                                        </p>
                                        {alert.actionRequired && (
                                            <div className="flex items-start space-x-2 mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                                <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5" />
                                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    {alert.actionRequired}
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                                            <span>{new Date(alert.createdAt).toLocaleString()}</span>
                                            <span className="capitalize">• {alert.type} alert</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center space-x-1 ml-2">
                                    {!alert.isRead && (
                                        <button
                                            onClick={() => handleMarkRead(alert._id)}
                                            className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition"
                                            title="Mark as read"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleSnooze(alert._id, 24)}
                                        className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition"
                                        title="Snooze for 24 hours"
                                    >
                                        <Clock className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDismiss(alert._id)}
                                        className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition"
                                        title="Dismiss"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
