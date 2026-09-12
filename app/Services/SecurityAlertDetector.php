<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Role;

/**
 * FR56 (proposed): automated alerts computed live from the audit trail —
 * no separate alerts table, since audit_logs is already the persisted
 * source of truth and a materialized copy would just go stale.
 */
class SecurityAlertDetector
{
    private const FAILED_LOGIN_WINDOW_HOURS = 24;

    private const FAILED_LOGIN_THRESHOLD = 3;

    private const PRIVILEGED_CHANGE_WINDOW_HOURS = 24;

    private const UNUSUAL_ACCESS_WINDOW_HOURS = 1;

    private const UNUSUAL_ACCESS_THRESHOLD = 5;

    private const NON_PRIVILEGED_ACTIONS = ['LOGIN_ATTEMPT', 'LOGOUT', 'MFA_LOGIN_SUCCESS', 'MFA_VERIFY_FAILED'];

    public function detect(): array
    {
        return [
            'repeated_failed_logins' => $this->repeatedFailedLogins(),
            'privileged_changes' => $this->privilegedChanges(),
            'unusual_record_access' => $this->unusualRecordAccess(),
        ];
    }

    private function repeatedFailedLogins(): array
    {
        return AuditLog::query()
            ->selectRaw('actor_id, ip_address, COUNT(*) as attempts, MAX(created_at) as latest_at')
            ->where('action', 'LOGIN_ATTEMPT')
            ->where('outcome', 'failure')
            ->where('created_at', '>=', now()->subHours(self::FAILED_LOGIN_WINDOW_HOURS))
            ->groupBy('actor_id', 'ip_address')
            ->havingRaw('COUNT(*) >= ?', [self::FAILED_LOGIN_THRESHOLD])
            ->orderByDesc('attempts')
            ->get()
            ->toArray();
    }

    private function privilegedChanges(): array
    {
        return AuditLog::query()
            ->with('actor')
            ->whereIn('actor_role', [Role::ADMIN, Role::BRANCH_MANAGER])
            ->whereNotIn('action', self::NON_PRIVILEGED_ACTIONS)
            ->where('created_at', '>=', now()->subHours(self::PRIVILEGED_CHANGE_WINDOW_HOURS))
            ->latest('created_at')
            ->limit(50)
            ->get()
            ->toArray();
    }

    private function unusualRecordAccess(): array
    {
        return AuditLog::query()
            ->join('users', 'users.id', '=', 'audit_logs.actor_id')
            ->selectRaw('audit_logs.actor_id, users.name as actor_name, users.email as actor_email, COUNT(DISTINCT audit_logs.object_id) as distinct_records')
            ->where('audit_logs.object_type', 'patient')
            ->where('audit_logs.outcome', 'success')
            ->where('audit_logs.created_at', '>=', now()->subHours(self::UNUSUAL_ACCESS_WINDOW_HOURS))
            ->groupBy('audit_logs.actor_id', 'users.name', 'users.email')
            ->havingRaw('COUNT(DISTINCT audit_logs.object_id) >= ?', [self::UNUSUAL_ACCESS_THRESHOLD])
            ->orderByDesc('distinct_records')
            ->get()
            ->toArray();
    }
}
