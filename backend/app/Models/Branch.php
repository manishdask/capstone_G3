<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'state', 'address', 'contact_number', 'email', 'capacity', 'status',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function staff()
    {
        return $this->hasMany(Staff::class);
    }

    public function patients()
    {
        return $this->hasMany(Patient::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function beds()
    {
        return $this->hasMany(Bed::class);
    }

    public function medicines()
    {
        return $this->hasMany(Medicine::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
