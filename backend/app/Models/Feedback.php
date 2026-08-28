<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    const UPDATED_AT = null;

    protected $fillable = [
        'patient_id', 'branch_id', 'doctor_staff_id', 'comment', 'rating', 'sentiment', 'reviewed_by',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Staff::class, 'doctor_staff_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
