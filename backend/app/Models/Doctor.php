<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Doctor extends Model
{
    use HasFactory;

    protected $fillable = [
        'staff_id', 'specialization', 'gender', 'qualification', 'consultation_fee', 'bio', 'rating',
    ];

    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
