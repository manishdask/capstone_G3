<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id', 'doctor_staff_id', 'branch_id', 'appointment_date',
        'start_time', 'end_time', 'status', 'reason', 'cancellation_reason', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'date',
        ];
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Staff::class, 'doctor_staff_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function medicalRecords()
    {
        return $this->hasMany(MedicalRecord::class);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }
}
