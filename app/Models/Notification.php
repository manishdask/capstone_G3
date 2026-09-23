<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'recipient_user_id', 'recipient_contact', 'channel', 'template', 'message',
        'related_type', 'related_id', 'status', 'sent_at',
        'read_at', 'failure_reason', 'attempts',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
            'read_at' => 'datetime',
        ];
    }

    /**
     * A notification is unread until read_at is stamped. Delivery status is a
     * separate axis — a sent message is still unread until the user opens it.
     */
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
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
