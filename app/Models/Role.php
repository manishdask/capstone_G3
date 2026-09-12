<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    public const ADMIN = 'Admin';
    public const BRANCH_MANAGER = 'Branch Manager';
    public const DOCTOR = 'Doctor';
    public const NURSE = 'Nurse';
    public const RECEPTIONIST = 'Receptionist';
    public const PATIENT = 'Patient';
    public const LAB_TECHNICIAN = 'Lab Technician';
    public const PHARMACIST = 'Pharmacist';

    public const ALL = [
        self::ADMIN, self::BRANCH_MANAGER, self::DOCTOR, self::NURSE,
        self::RECEPTIONIST, self::PATIENT, self::LAB_TECHNICIAN, self::PHARMACIST,
    ];

    protected $fillable = ['name', 'description'];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_roles')
            ->withPivot(['effective_from', 'effective_to'])
            ->withTimestamps();
    }
}
