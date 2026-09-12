<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PatientDuplicateFlag extends Model
{
    protected $fillable = [
        'patient_id', 'matched_patient_id', 'score', 'status', 'reviewed_by', 'reviewed_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    public function matchedPatient()
    {
        return $this->belongsTo(Patient::class, 'matched_patient_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
