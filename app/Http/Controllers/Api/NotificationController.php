<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Role;
use App\Services\SmsGateway;
use Illuminate\Http\Request;

/**
 * FR20: the in-app notification surface.
 *
 * Notifications were previously written to the database and never read back by
 * anything — there was no endpoint at all. A user sees only their OWN rows;
 * the recipient id is taken from the session, never from the request.
 */
class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = Notification::where('recipient_user_id', $request->user()->id)
            ->where('channel', 'in_app')
            ->when($request->boolean('unread_only'), fn ($q) => $q->unread())
            ->orderByDesc('created_at');

        $notifications = $query->paginate($request->integer('per_page', 30));

        return response()->json([
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'total' => $notifications->total(),
                'unread' => Notification::where('recipient_user_id', $request->user()->id)
                    ->where('channel', 'in_app')->unread()->count(),
            ],
        ]);
    }

    /** Mark one of the caller's own notifications read. */
    public function markRead(Request $request, Notification $notification)
    {
        if ($notification->recipient_user_id !== $request->user()->id) {
            abort(403);
        }

        $notification->update(['read_at' => now()]);

        return response()->json(['data' => $notification->fresh()]);
    }

    public function markAllRead(Request $request)
    {
        $count = Notification::where('recipient_user_id', $request->user()->id)
            ->where('channel', 'in_app')
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['data' => ['marked' => $count]]);
    }

    /**
     * Delivery health, for administrators.
     *
     * Surfaces exactly what an operator needs to know: how many messages failed
     * per channel, and — when SMS is not set up — the specific environment
     * variables that are missing. Without this the gap is invisible until a
     * patient says they never got a message.
     */
    public function health(Request $request, SmsGateway $sms)
    {
        if (! $request->user()->hasAnyRole([Role::ADMIN, Role::BRANCH_MANAGER])) {
            abort(403);
        }

        $byChannel = Notification::selectRaw('channel, status, COUNT(*) as total')
            ->groupBy('channel', 'status')
            ->get()
            ->groupBy('channel')
            ->map(fn ($rows) => $rows->pluck('total', 'status'));

        return response()->json([
            'data' => [
                'channels' => $byChannel,
                'sms' => [
                    'provider' => $sms->provider(),
                    'configured' => $sms->isConfigured(),
                    'configuration_required' => $sms->configurationGap(),
                ],
                'mail' => [
                    'mailer' => config('mail.default'),
                    'configured' => config('mail.default') !== null,
                    'configuration_required' => config('mail.default') === 'log'
                        ? 'MAIL_MAILER is "log": messages are written to storage/logs and not delivered to real inboxes. Set MAIL_MAILER=smtp with MAIL_HOST, MAIL_PORT, MAIL_USERNAME and MAIL_PASSWORD to send real email.'
                        : null,
                ],
            ],
        ]);
    }
}
