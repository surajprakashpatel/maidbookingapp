'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useApp } from '@/lib/app-context';
import { broadcastNotification } from '@/lib/services/notificationService';
import { Bell, CheckCheck, Send, Megaphone, Loader2, Users, User, Shield } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function AdminNotificationsPage() {
  const { notifications, markRead, markAllRead, unreadCount, showToast } = useApp();

  // Broadcast state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [targetAudience, setTargetAudience] = useState<'all' | 'customers' | 'maids'>('all');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'system' | 'account' | 'booking'>('system');
  const [sending, setSending] = useState(false);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showToast('error', 'Missing Information', 'Please provide both title and message for broadcast.');
      return;
    }

    setSending(true);
    const result = await broadcastNotification(
      targetAudience,
      broadcastTitle.trim(),
      broadcastMessage.trim(),
      broadcastType
    );
    setSending(false);

    if (result.success) {
      showToast('success', 'Broadcast Dispatched!', `Sent announcement to ${result.count} registered accounts.`);
      setShowBroadcastModal(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
    } else {
      showToast('error', 'Broadcast Failed', result.error || 'Could not send broadcast.');
    }
  };

  return (
    <AppShell
      role="admin"
      headerProps={{
        title: 'Platform Notifications',
        showNotifications: false,
        actions: (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={markAllRead}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-600)' }}
              >
                <CheckCheck size={16} /> Mark read
              </button>
            )}
            <Button
              size="sm"
              onClick={() => setShowBroadcastModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 rounded-xl shadow-xs"
            >
              <Megaphone className="size-3.5" /> Broadcast Announcement
            </Button>
          </div>
        ),
      }}
    >
      <div className="animate-fade-in space-y-4">
        {/* Banner */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Megaphone className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Broadcast Announcements</h2>
              <p className="text-xs text-slate-500">Send platform-wide alerts, service updates, or promotional notices to users.</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowBroadcastModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
          >
            Create New Broadcast
          </Button>
        </div>

        {/* Notifications List */}
        <div>
          <h2 className="text-sm font-bold text-slate-800 mb-2">Admin Activity Log</h2>

          {notifications.length === 0 ? (
            <div className="empty-state bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <div className="empty-state-icon mb-2"><Bell size={36} style={{ color: 'var(--gray-400)' }} /></div>
              <div className="empty-state-title text-sm font-bold text-slate-800">No notifications yet</div>
              <p className="text-xs text-slate-400 mt-1">Platform events and user interactions will appear here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-xs">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 ${!n.read ? 'bg-blue-50/30' : ''}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    !n.read ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Bell className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs ${!n.read ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                        {n.title}
                      </span>
                      {!n.read && <span className="size-2 rounded-full bg-blue-600 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Broadcast Modal */}
        <Dialog open={showBroadcastModal} onOpenChange={setShowBroadcastModal}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="size-5 text-blue-600" /> Broadcast Platform Announcement
              </DialogTitle>
              <DialogDescription className="text-xs">
                Send an immediate in-app push notification to registered users.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSendBroadcast} className="space-y-4 pt-2">
              {/* Target Audience */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Target Audience</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'all', label: 'All Users', icon: Users },
                    { key: 'customers', label: 'Customers', icon: User },
                    { key: 'maids', label: 'Maids', icon: Shield },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTargetAudience(key as 'all' | 'customers' | 'maids')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        targetAudience === key
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="size-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Notification Title *</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Festival Special: Flat 15% Off"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="rounded-xl h-10 text-xs sm:text-sm"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Message Content *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the full announcement text for users..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none font-medium text-slate-900"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowBroadcastModal(false)} className="flex-1 rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={sending} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold gap-1.5">
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <><Send className="size-4" /> Send Now</>}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div className="h-6" />
      </div>
    </AppShell>
  );
}

