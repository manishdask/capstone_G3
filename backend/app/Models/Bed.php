<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bed extends Model
{
    use HasFactory;

    protected $fillable = ['branch_id', 'ward', 'room_number', 'bed_number', 'status'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function admissions()
    {
        return $this->hasMany(Admission::class);
    }
}
