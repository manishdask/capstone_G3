<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'lab_order_id', 'technician_staff_id', 'result_details', 'file_path',
        'verified_by', 'verified_at', 'released_at',
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
            'released_at' => 'datetime',
            // Encrypted at rest (SRS 6.1); the file itself lives outside the public webroot.
            'result_details' => 'encrypted',
        ];
    }

    public function labOrder()
    {
        return $this->belongsTo(LabOrder::class);
    }

    public function technician()
    {
        return $this->belongsTo(Staff::class, 'technician_staff_id');
    }

    public function verifier()
    {
        return $this->belongsTo(Staff::class, 'verified_by');
    }
}
