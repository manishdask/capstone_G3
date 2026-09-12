<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    use HasFactory;

    protected $table = 'staff';

    protected $fillable = [
        'user_id', 'branch_id', 'staff_type', 'designation', 'registration_no', 'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function doctor()
    {
        return $this->hasOne(Doctor::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'doctor_staff_id');
    }

    public function authoredMedicalRecords()
    {
        return $this->hasMany(MedicalRecord::class, 'author_staff_id');
    }

    public function feedback()
    {
        return $this->hasMany(Feedback::class, 'doctor_staff_id');
    }
}
