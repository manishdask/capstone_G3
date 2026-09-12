<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'branch_id', 'global_patient_id', 'first_name', 'last_name',
        'date_of_birth', 'gender', 'contact_number', 'email', 'address',
        'allergies', 'emergency_contact_name', 'emergency_contact_phone', 'status',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            // Encrypted at rest (SRS 6.1) — allergy data is sensitive health information.
            'allergies' => 'encrypted',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function medicalRecords()
    {
        return $this->hasMany(MedicalRecord::class);
    }

    public function admissions()
    {
        return $this->hasMany(Admission::class);
    }

    public function labOrders()
    {
        return $this->hasMany(LabOrder::class);
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function consents()
    {
        return $this->hasMany(Consent::class);
    }

    public function dataRequests()
    {
        return $this->hasMany(DataRequest::class);
    }

    public function feedback()
    {
        return $this->hasMany(Feedback::class);
    }

    public function fullName(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }
}
