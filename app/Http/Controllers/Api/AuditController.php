<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Read access to the audit trail AuditMiddleware already writes on every
 * sensitive request (NFR12). Admin-only.
 * FR55 (proposed): richer filters (branch, object, action, date range) + CSV export.
 */
class AuditController extends Controller
{
    public function index(Request $request)
    {
        $query = $this->filtered($request)->with('actor');

        return response()->json($query->latest('created_at')->paginate($request->integer('per_page', 50)));
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $logs = $this->filtered($request)->with('actor')->latest('created_at')->limit(5000)->get();

        return response()->streamDownload(function () use ($logs) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Timestamp', 'Actor', 'Role', 'Action', 'Object Type', 'Object ID', 'Outcome', 'IP Address']);

            foreach ($logs as $log) {
                fputcsv($handle, [
                    $log->created_at->toDateTimeString(),
                    $log->actor?->email ?? 'system/guest',
                    $log->actor_role,
                    $log->action,
                    $log->object_type,
                    $log->object_id,
                    $log->outcome,
                    $log->ip_address,
                ]);
            }

            fclose($handle);
        }, 'sgh-audit-log-'.now()->toDateString().'.csv', ['Content-Type' => 'text/csv']);
    }

    private function filtered(Request $request)
    {
        $query = AuditLog::query();

        $query->when($request->filled('actor_id'), fn ($q) => $q->where('actor_id', $request->integer('actor_id')))
            ->when($request->filled('outcome'), fn ($q) => $q->where('outcome', $request->string('outcome')))
            ->when($request->filled('action'), fn ($q) => $q->where('action', 'like', '%'.$request->string('action').'%'))
            ->when($request->filled('object_type'), fn ($q) => $q->where('object_type', $request->string('object_type')))
            ->when($request->filled('branch_id'), fn ($q) => $q->whereHas('actor', fn ($uq) => $uq->where('branch_id', $request->integer('branch_id'))))
            ->when($request->filled('from'), fn ($q) => $q->where('created_at', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($q) => $q->where('created_at', '<=', $request->date('to')->endOfDay()));

        return $query;
    }
}
