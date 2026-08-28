<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'branch_id',
        'name',
        'username',
        'email',
        'password',
        'status',
        'last_login_at',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_enabled_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            // FR50: secret/recovery codes encrypted at rest (SRS 6.1).
            'two_factor_secret' => 'encrypted',
            'two_factor_recovery_codes' => 'encrypted:array',
            'two_factor_enabled_at' => 'datetime',
        ];
    }

    /** FR50: MFA is mandatory for privileged roles once approved/rolled out. */
    public function requiresMfa(): bool
    {
        return $this->hasAnyRole([Role::ADMIN, Role::BRANCH_MANAGER]);
    }

    public function hasMfaEnabled(): bool
    {
        return $this->two_factor_enabled_at !== null;
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->withPivot(['effective_from', 'effective_to'])
            ->withTimestamps();
    }

    public function staff()
    {
        return $this->hasOne(Staff::class);
    }

    public function patient()
    {
        return $this->hasOne(Patient::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class, 'actor_id');
    }

    public function hasRole(string $roleName): bool
    {
        return $this->roles()->where('name', $roleName)->exists();
    }

    public function hasAnyRole(array $roleNames): bool
    {
        return $this->roles()->whereIn('name', $roleNames)->exists();
    }
}
