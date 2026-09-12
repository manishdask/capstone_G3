<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RestoreDrill extends Model
{
    protected $fillable = [
        'backup_job_id', 'triggered_by', 'status', 'verification_notes', 'ran_at',
    ];

    protected function casts(): array
    {
        return [
            'ran_at' => 'datetime',
        ];
    }

    public function backupJob()
    {
        return $this->belongsTo(BackupJob::class);
    }

    public function triggeredBy()
    {
        return $this->belongsTo(User::class, 'triggered_by');
    }
}
