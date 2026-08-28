<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BackupJob extends Model
{
    protected $fillable = [
        'type', 'started_at', 'ended_at', 'status', 'location_ref', 'verification_notes',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    /** FR58 (proposed): restore drills exercised against this backup. */
    public function restoreDrills()
    {
        return $this->hasMany(RestoreDrill::class);
    }
}
