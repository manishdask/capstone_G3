<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id', 'medical_record_id', 'prescriber_staff_id', 'status', 'issued_at',
    ];

    protected function casts(): array
    {
        return [
            'issued_at' => 'datetime',
        ];
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function medicalRecord()
    {
        return $this->belongsTo(MedicalRecord::class);
    }

    public function prescriber()
    {
        return $this->belongsTo(Staff::class, 'prescriber_staff_id');
    }

    public function items()
    {
        return $this->hasMany(PrescriptionItem::class);
    }
}
