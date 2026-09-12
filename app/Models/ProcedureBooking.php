<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * FR37: a procedure (imaging, minor procedure, etc.) booked as part of a
 * visit/admission. Priced from the branch `services` list when the visit's
 * invoice is generated.
 */
class ProcedureBooking extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id', 'appointment_id', 'branch_id', 'name',
        'requested_by', 'status', 'performed_at',
    ];

    protected function casts(): array
    {
        return [
            'performed_at' => 'datetime',
        ];
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function requester()
    {
        return $this->belongsTo(Staff::class, 'requested_by');
    }
}