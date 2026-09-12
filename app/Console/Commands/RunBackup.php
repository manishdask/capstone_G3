<?php

namespace App\Console\Commands;

use App\Services\BackupService;
use Illuminate\Console\Command;

/** FR57 (proposed): `php artisan backup:run` — scheduled in routes/console.php. */
class RunBackup extends Command
{
    protected $signature = 'backup:run';

    protected $description = 'Run an encrypted database backup and verify it completed.';

    public function handle(BackupService $backupService): int
    {
        $job = $backupService->run();

        if ($job->status === 'success') {
            $this->info("Backup #{$job->id} succeeded: {$job->verification_notes}");

            return self::SUCCESS;
        }

        $this->error("Backup #{$job->id} failed: {$job->verification_notes}");

        return self::FAILURE;
    }
}
