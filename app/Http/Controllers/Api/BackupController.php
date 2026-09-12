<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BackupJob;
use App\Services\BackupService;
use Illuminate\Http\Request;

/** FR57/FR58 (proposed): backup job history + admin-triggered manual run and restore drill. */
class BackupController extends Controller
{
    public function index()
    {
        $jobs = BackupJob::with(['restoreDrills' => fn ($q) => $q->latest('ran_at')])
            ->latest('started_at')
            ->limit(50)
            ->get();

        return response()->json(['data' => $jobs]);
    }

    /** FR57: admin-triggered manual run, on top of the scheduled daily one. */
    public function store(BackupService $backupService)
    {
        $job = $backupService->run();

        return response()->json(['data' => $job], 201);
    }

    /** FR58: verifies a completed backup can actually be restored — never runs against the live database. */
    public function restoreDrill(Request $request, BackupJob $backupJob, BackupService $backupService)
    {
        $drill = $backupService->runRestoreDrill($backupJob, $request->user()->id);

        return response()->json(['data' => $drill], 201);
    }
}
