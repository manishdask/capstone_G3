<?php

namespace Database\Seeders;

use App\Models\BackupJob;
use App\Models\RestoreDrill;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

/** FR57/FR58 (proposed) — demo backup history; a real one is produced by `php artisan backup:run`. */
class BackupJobSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::whereHas('roles', fn ($q) => $q->where('name', Role::ADMIN))->first();

        $succeeded = BackupJob::firstOrCreate(
            ['type' => 'database', 'status' => 'success', 'started_at' => now()->subDay()->setTime(2, 0)],
            [
                'ended_at' => now()->subDay()->setTime(2, 4),
                'location_ref' => null,
                'verification_notes' => 'Seeded demo record — run `php artisan backup:run` for a real encrypted dump.',
            ]
        );

        BackupJob::firstOrCreate(
            ['type' => 'database', 'status' => 'failed', 'started_at' => now()->subDays(2)->setTime(2, 0)],
            [
                'ended_at' => now()->subDays(2)->setTime(2, 1),
                'verification_notes' => 'Seeded demo record — mysqldump binary not found on that (hypothetical) host.',
            ]
        );

        if ($admin) {
            RestoreDrill::firstOrCreate(
                ['backup_job_id' => $succeeded->id, 'triggered_by' => $admin->id],
                ['status' => 'passed', 'verification_notes' => 'Seeded demo record.', 'ran_at' => now()->subHours(20)]
            );
        }
    }
}
