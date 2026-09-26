<?php

return [

    /*
    |--------------------------------------------------------------------------
    | SMS provider
    |--------------------------------------------------------------------------
    |
    | Which gateway SmsGateway dispatches through.
    |
    |   null    — no provider configured (the default). Nothing is sent and
    |             nothing pretends to have been sent: every SMS notification is
    |             recorded as FAILED with the reason below, so the gap is
    |             visible in the app and in the notifications table rather than
    |             looking like a delivered message.
    |   log     — writes the message to the Laravel log. For local development
    |             only. Still recorded as `sent`, because it genuinely reached
    |             the configured destination (the log).
    |   twilio  — real delivery through Twilio's REST API. Requires sid, token
    |             and from below.
    |
    | Set SMS_GATEWAY_PROVIDER=twilio plus the three credentials to go live.
    |
    */

    'provider' => env('SMS_GATEWAY_PROVIDER') ?: null,

    'sid' => env('SMS_GATEWAY_SID'),

    'token' => env('SMS_GATEWAY_TOKEN'),

    /** The sending number, in E.164 format (e.g. +61400000000). */
    'from' => env('SMS_GATEWAY_FROM'),

    /** Seconds to wait on the provider before giving up. */
    'timeout' => (int) env('SMS_GATEWAY_TIMEOUT', 10),

];
