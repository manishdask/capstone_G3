<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id', 'author_staff_id', 'appointment_id', 'record_type',
        'diagnosis', 'treatment_notes', 'content', 'version',
    ];

    /**
     * Clinical narrative fields are encrypted at rest (SRS 6.1: authenticated AES-256-GCM).
     */
    protected function casts(): array
    {
        return [
            'diagnosis' => 'encrypted',
            'treatment_notes' => 'encrypted',
            'content' => 'encrypted',
        ];
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function author()
    {
        return $this->belongsTo(Staff::class, 'author_staff_id');
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class);
    }
}
