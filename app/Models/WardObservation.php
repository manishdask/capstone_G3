<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WardObservation extends Model
{
    protected $fillable = [
        'admission_id', 'staff_id', 'observed_at', 'temperature_celsius',
        'pulse_bpm', 'respiratory_rate', 'blood_pressure', 'spo2_percent', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'observed_at' => 'datetime',
        ];
    }

    public function admission()
    {
        return $this->belongsTo(Admission::class);
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
