<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BreakGlassSession extends Model
{
    protected $fillable = [
        'user_id', 'patient_id', 'reason', 'granted_at', 'expires_at', 'revoked_at',
        'status', 'reviewed_by', 'reviewed_at', 'review_notes',
    ];

    protected function casts(): array
    {
        return [
            'granted_at' => 'datetime',
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
