<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataRequest extends Model
{
    protected $fillable = [
        'patient_id', 'type', 'details', 'identity_verified', 'status',
        'assigned_to', 'decision_notes', 'decided_by', 'decided_at',
    ];

    protected function casts(): array
    {
        return [
            'identity_verified' => 'boolean',
            'decided_at' => 'datetime',
        ];
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function decider()
    {
        return $this->belongsTo(User::class, 'decided_by');
    }
}
