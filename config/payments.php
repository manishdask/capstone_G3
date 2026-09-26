<?php

// FR40 (payment gateway) configuration. All credentials come from the
// environment — never hardcode a secret in source. The default provider is
// "sandbox": a pure simulation that needs no credentials and is what the app
// runs against until real Stripe test keys are supplied. Switching to Stripe
// is configuration-only (set PAYMENT_GATEWAY_PROVIDER=stripe + keys below).
return [
    // Gateway backend: "sandbox" (no credentials, simulation only) or "stripe"
    // (real Stripe test-mode via PaymentIntents).
    'provider' => env('PAYMENT_GATEWAY_PROVIDER', 'sandbox'),

    // Stripe SECRET key (sk_test_...) — used only server-side to create and
    // confirm PaymentIntents and to issue refunds. Never exposed to the client.
    // STRIPE_SECRET (the conventional name, also in config/services.php) wins;
    // PAYMENT_GATEWAY_KEY is kept so existing server .env files still work.
    'secret_key' => env('STRIPE_SECRET') ?: env('PAYMENT_GATEWAY_KEY'),

    // Stripe webhook signing secret (whsec_...) — reserved for future
    // asynchronous webhook reconciliation. Not required by the synchronous
    // confirm() flow used today.
    'webhook_secret' => env('PAYMENT_GATEWAY_SECRET'),

    // Stripe PUBLISHABLE key (pk_test_...) — safe to send to the browser; the
    // Stripe.js Elements card field is initialised with it so raw card details
    // are tokenized client-side and never touch the server.
    'publishable_key' => env('STRIPE_KEY') ?: env('PAYMENT_GATEWAY_PUBLISHABLE'),

    // ISO 4217 currency code for Stripe charges.
    'currency' => env('PAYMENT_GATEWAY_CURRENCY', 'aud'),
];
