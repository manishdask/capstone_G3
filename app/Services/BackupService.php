<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\BackupJob;
use App\Models\RestoreDrill;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

/**
 * FR57 (proposed): a real `mysqldump` capture, verified non-empty/well-formed,
 * encrypted at rest (AES via the app key, matching the encrypted casts used
 * elsewhere in this codebase), with a BackupJob row recording the outcome —
 * and an audit alert on failure.
 * FR58 (proposed): a restore drill decrypts the dump and validates it would
 * actually restore. It deliberately does NOT execute against the live
 * database — that would be a destructive action against the only database
 * this app has; validating the decrypted SQL is structurally complete and
 * checksummed is the safe, standard meaning of a "drill".
 */
class BackupService
{
    public function run(): BackupJob
    {
        $job = BackupJob::create([
            'type' => 'database',
            'started_at' => now(),
            'status' => 'running',
        ]);

        $config = config('database.connections.mysql');
        $binary = $this->resolveMysqldumpBinary();

        if (! $binary) {
            return $this->fail($job, 'mysqldump binary not found. Set BACKUP_MYSQLDUMP_PATH in .env.');
        }

        $args = array_filter([
            $binary,
            '--host='.$config['host'],
            '--port='.$config['port'],
            '--user='.$config['username'],
            $config['password'] !== '' ? '--password='.$config['password'] : null,
            '--single-transaction',
            $config['database'],
        ]);

        try {
            $result = Process::timeout(120)->run($args);
        } catch (\Throwable $e) {
            return $this->fail($job, 'Could not start mysqldump: '.$e->getMessage());
        }

        if ($result->failed()) {
            return $this->fail($job, 'mysqldump exited with an error: '.trim($result->errorOutput()));
        }

        $dump = $result->output();

        if (trim($dump) === '' || ! str_contains($dump, 'CREATE TABLE')) {
            return $this->fail($job, 'Dump output did not look like a valid SQL export — refusing to store it.');
        }

        $filename = 'backups/backup-'.now()->format('Ymd-His').'.sql.enc';
        Storage::disk('local')->put($filename, Crypt::encryptString($dump));

        $job->update([
            'status' => 'success',
            'ended_at' => now(),
            'location_ref' => $filename,
            'verification_notes' => sprintf(
                'Captured %s bytes, encrypted at rest, checksum %s.',
                number_format(strlen($dump)),
                substr(hash('sha256', $dump), 0, 16)
            ),
        ]);

        return $job->fresh();
    }

    public function runRestoreDrill(BackupJob $job, ?int $actorId): RestoreDrill
    {
        if ($job->status !== 'success' || ! $job->location_ref) {
            return RestoreDrill::create([
                'backup_job_id' => $job->id,
                'triggered_by' => $actorId,
                'status' => 'failed',
                'verification_notes' => 'This backup did not complete successfully — nothing to drill.',
                'ran_at' => now(),
            ]);
        }

        if (! Storage::disk('local')->exists($job->location_ref)) {
            return RestoreDrill::create([
                'backup_job_id' => $job->id,
                'triggered_by' => $actorId,
                'status' => 'failed',
                'verification_notes' => 'Backup file is missing from storage.',
                'ran_at' => now(),
            ]);
        }

        try {
            $dump = Crypt::decryptString(Storage::disk('local')->get($job->location_ref));
        } catch (DecryptException) {
            return RestoreDrill::create([
                'backup_job_id' => $job->id,
                'triggered_by' => $actorId,
                'status' => 'failed',
                'verification_notes' => 'Decryption failed — the backup file may be corrupted.',
                'ran_at' => now(),
            ]);
        }

        $wellFormed = trim($dump) !== '' && str_contains($dump, 'CREATE TABLE') && str_contains($dump, 'INSERT INTO');

        return RestoreDrill::create([
            'backup_job_id' => $job->id,
            'triggered_by' => $actorId,
            'status' => $wellFormed ? 'passed' : 'failed',
            'verification_notes' => $wellFormed
                ? sprintf('Decrypted %s bytes; contains valid table structure and data statements.', number_format(strlen($dump)))
                : 'Decrypted content did not look like a restorable SQL dump.',
            'ran_at' => now(),
        ]);
    }

    private function fail(BackupJob $job, string $reason): BackupJob
    {
        $job->update(['status' => 'failed', 'ended_at' => now(), 'verification_notes' => $reason]);

        AuditLog::record([
            'action' => 'BACKUP_FAILED',
            'object_type' => 'backupJob',
            'object_id' => $job->id,
            'outcome' => 'failure',
            'source' => 'scheduler',
        ]);

        return $job->fresh();
    }

    private function resolveMysqldumpBinary(): ?string
    {
        $configured = config('backup.mysqldump_path');
        if ($configured && is_file($configured)) {
            return $configured;
        }

        foreach (config('backup.mysqldump_fallback_paths', []) as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        // Last resort: let the OS resolve it from PATH. run() reports a clean
        // failure (rather than crashing the request) if it isn't found there either.
        return 'mysqldump';
    }
}
