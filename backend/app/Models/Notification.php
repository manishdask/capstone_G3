<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'recipient_user_id', 'recipient_contact', 'channel', 'template', 'message',
        'related_type', 'related_id', 'status', 'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }

    public function related()
    {
        return $this->morphTo();
    }
}
