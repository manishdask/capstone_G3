<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id', 'requester_staff_id', 'branch_id', 'test_type', 'status', 'requested_at',
    ];

    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
        ];
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function requester()
    {
        return $this->belongsTo(Staff::class, 'requester_staff_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function results()
    {
        return $this->hasMany(LabResult::class);
    }
}
