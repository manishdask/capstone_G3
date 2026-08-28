<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    const UPDATED_AT = null;

    protected $fillable = [
        'actor_id', 'actor_role', 'action', 'object_type', 'object_id', 'outcome', 'ip_address', 'source',
    ];

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public static function record(array $attributes): self
    {
        return static::create($attributes);
    }
}
