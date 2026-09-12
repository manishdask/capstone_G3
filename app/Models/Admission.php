<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Admission extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id', 'branch_id', 'bed_id', 'transferred_from_id', 'admitting_staff_id',
        'admitted_at', 'discharged_at', 'status', 'discharge_summary',
    ];

    protected function casts(): array
    {
        return [
            'admitted_at' => 'datetime',
            'discharged_at' => 'datetime',
        ];
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function bed()
    {
        return $this->belongsTo(Bed::class);
    }

    public function admittingStaff()
    {
        return $this->belongsTo(Staff::class, 'admitting_staff_id');
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    /** FR52: the admission leg (previous bed) this one continues from, if transferred. */
    public function transferredFrom()
    {
        return $this->belongsTo(Admission::class, 'transferred_from_id');
    }

    public function transferredTo()
    {
        return $this->hasOne(Admission::class, 'transferred_from_id');
    }

    /** FR54: daily ward observations recorded during this bed-stay. */
    public function observations()
    {
        return $this->hasMany(WardObservation::class);
    }
}
