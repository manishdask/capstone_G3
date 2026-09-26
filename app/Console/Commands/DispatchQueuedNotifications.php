<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Services\NotificationDispatcher;
use Illuminate\Console\Command;

/**
 * Delivers notifications that are still sitting unsent.
 *
 * Two uses:
 *  - the backlog left by the old code, which wrote `queued` rows that nothing
 *    ever read;
 *  - retrying messages that failed for a transient reason (mail server down,
 *    SMS provider not configured at the time) once the cause is fixed.
 *
 * Safe to run repeatedly: a row that succeeds moves to `sent` and is not
 * picked up again.
 */
class DispatchQueuedNotifications extends Command
{
    protected $signature = 'notifications:dispatch
                            {--retry-failed : also retry notifications that previously failed}
                            {--limit=500 : maximum rows to attempt in one run}';

    protected $description = 'Deliver notifications still queued (or previously failed) and record the outcome';

    public function handle(NotificationDispatcher $dispatcher): int
    {
        $statuses = $this->option('retry-failed') ? ['queued', 'failed'] : ['queued'];

        $pending = Notification::whereIn('status', $statuses)
            ->orderBy('id')
            ->limit((int) $this->option('limit'))
            ->get();

        if ($pending->isEmpty()) {
            $this->info('Nothing to deliver.');

            return self::SUCCESS;
        }

        $this->info("Attempting {$pending->count()} notification(s)…");

        foreach ($pending as $notification) {
            $dispatcher->deliver($notification);
        }

        $fresh = Notification::whereIn('id', $pending->pluck('id'))->get();
        $sent = $fresh->where('status', 'sent')->count();
        $failed = $fresh->where('status', 'failed');

        $this->info("Delivered: {$sent}");

        if ($failed->isNotEmpty()) {
            $this->warn("Failed: {$failed->count()}");

            foreach ($failed->groupBy('failure_reason') as $reason => $rows) {
                $this->line("  {$rows->count()} x {$reason}");
            }
        }

        return self::SUCCESS;
    }
}
