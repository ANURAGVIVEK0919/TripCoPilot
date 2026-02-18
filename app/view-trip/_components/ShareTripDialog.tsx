"use client"

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Copy, Check, Users, Globe, Lock, Link2, UserPlus } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// Simple toast function
const showToast = (title: string, description?: string, variant?: 'default' | 'destructive') => {
    if (variant === 'destructive') {
        alert(`❌ ${title}\n${description || ''}`);
    } else {
        console.log(`✅ ${title}: ${description || ''}`);
    }
};

interface ShareTripDialogProps {
    tripId: string;
    userId: Id<'UserTable'>;
    isOwner: boolean;
}

export default function ShareTripDialog({ tripId, userId, isOwner }: ShareTripDialogProps) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
    const [isPublic, setIsPublic] = useState(false);
    const [allowCloning, setAllowCloning] = useState(false);

    const enableSharing = useMutation(api.tripSharing.enableSharing);
    const disableSharing = useMutation(api.tripSharing.disableSharing);
    const addCollaborator = useMutation(api.tripSharing.addCollaborator);
    const collaborators = useQuery(api.tripSharing.getCollaborators, { tripId });

    const handleEnableSharing = async () => {
        try {
            const result = await enableSharing({
                tripId,
                userId,
                isPublic,
                allowCloning,
            });

            showToast('Sharing enabled', 'Your trip is now shareable!');
        } catch (error) {
            showToast('Error', 'Failed to enable sharing', 'destructive');
        }
    };

    const handleCopyLink = async () => {
        // Get trip details to find shareId
        const shareUrl = `${window.location.origin}/share/${tripId}`;
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        
        showToast('Link copied!', 'Share this link with others');
    };

    const handleAddCollaborator = async () => {
        if (!email) {
            showToast('Email required', 'Please enter an email address', 'destructive');
            return;
        }

        try {
            await addCollaborator({
                tripId,
                userEmail: email,
                role,
                invitedBy: userId,
            });

            showToast('Collaborator added', `${email} has been invited as ${role}`);

            setEmail('');
        } catch (error: any) {
            showToast('Error', error.message || 'Failed to add collaborator', 'destructive');
        }
    };

    if (!isOwner) {
        return (
            <Button variant="outline" size="sm" disabled>
                <Share2 className="h-4 w-4 mr-2" />
                Share
            </Button>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Share Your Trip</DialogTitle>
                    <DialogDescription>
                        Invite others to view or collaborate on your trip
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Shareable Link Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <Link2 className="h-4 w-4" />
                                Shareable Link
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleEnableSharing}
                            >
                                Enable Sharing
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                value={`${window.location.origin}/share/${tripId}`}
                                readOnly
                                className="flex-1"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleCopyLink}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        {/* Privacy Settings */}
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="public"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                    className="rounded"
                                />
                                <Label htmlFor="public" className="cursor-pointer flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    Make Public (appears in explore)
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="cloning"
                                    checked={allowCloning}
                                    onChange={(e) => setAllowCloning(e.target.checked)}
                                    className="rounded"
                                />
                                <Label htmlFor="cloning" className="cursor-pointer">
                                    Allow others to clone this trip
                                </Label>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4" />

                    {/* Invite Collaborators Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Invite Collaborators
                        </h3>

                        <div className="flex gap-2">
                            <Input
                                type="email"
                                placeholder="Enter email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1"
                            />
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                                className="px-3 py-2 border rounded-md"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                            </select>
                            <Button onClick={handleAddCollaborator}>
                                Invite
                            </Button>
                        </div>

                        <div className="text-xs text-gray-500">
                            <strong>Viewer:</strong> Can view trip details<br />
                            <strong>Editor:</strong> Can modify itinerary
                        </div>
                    </div>

                    {/* Collaborators List */}
                    {collaborators && collaborators.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Collaborators ({collaborators.length})
                            </h3>

                            <div className="space-y-2">
                                {collaborators.map((collab: any) => (
                                    <div
                                        key={collab._id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={collab.userImage || '/placeholder.jpg'}
                                                alt={collab.userName}
                                                className="h-8 w-8 rounded-full"
                                            />
                                            <div>
                                                <p className="text-sm font-medium">{collab.userName}</p>
                                                <p className="text-xs text-gray-500">{collab.userEmail}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                {collab.role === 'owner' && '👑 '}
                                                {collab.role === 'editor' && '✏️ '}
                                                {collab.role === 'viewer' && '👀 '}
                                                {collab.role}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
