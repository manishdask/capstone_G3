<?php

// Server-side key file (optional). The team can't edit the live .env (it is
// instructor-managed), so Stripe TEST keys may instead live in stripe_keys.php
// at the Laravel root: outside public/ (not web-reachable) and git-ignored
// (never committed). It returns ['key' => 'pk_test_…', 'secret' => 'sk_test_…',
// 'provider' => 'stripe']. For the KEYS, .env wins over this file. For the
// PROVIDER switch the file wins: it exists precisely because the team cannot
// change the server .env, which may still carry PAYMENT_GATEWAY_PROVIDER=sandbox.
$stripeKeyFile = dirname(__DIR__).'/stripe_keys.php';
$stripeFileKeys = is_file($stripeKeyFile) ? (array) require $stripeKeyFile : [];
$stripeSecret = env('STRIPE_SECRET') ?: env('PAYMENT_GATEWAY_KEY') ?: ($stripeFileKeys['secret'] ?? null);

// FR40 (payment gateway) configuration. All credentials come from the
// environment (or the key file above) — never hardcode a secret in source. The default provider is
// "sandbox": a pure simulation that needs no credentials and is what the app
// runs against until real Stripe test keys are supplied. Switching to Stripe
// is configuration-only (set PAYMENT_GATEWAY_PROVIDER=stripe + keys below).
return [
    // Gateway backend: "sandbox" (no credentials, simulation only) or "stripe"
    // (real Stripe test-mode via PaymentIntents).
    // Unset → "stripe" whenever a secret key is configured, otherwise "sandbox",
    // so adding STRIPE_KEY/STRIPE_SECRET to a .env is enough to go live in test
    // mode. An explicit PAYMENT_GATEWAY_PROVIDER=sandbox still forces sandbox.
    'provider' => $stripeFileKeys['provider'] ?? env('PAYMENT_GATEWAY_PROVIDER', $stripeSecret ? 'stripe' : 'sandbox'),

    // Stripe SECRET key (sk_test_...) — used only server-side to create and
    // confirm PaymentIntents and to issue refunds. Never exposed to the client.
    // STRIPE_SECRET (the conventional name, also in config/services.php) wins;
    // PAYMENT_GATEWAY_KEY is kept so existing server .env files still work.
    'secret_key' => $stripeSecret,

    // Stripe webhook signing secret (whsec_...) — reserved for future
    // asynchronous webhook reconciliation. Not required by the synchronous
    // confirm() flow used today.
    'webhook_secret' => env('PAYMENT_GATEWAY_SECRET'),

    // Stripe PUBLISHABLE key (pk_test_...) — safe to send to the browser; the
    // Stripe.js Elements card field is initialised with it so raw card details
    // are tokenized client-side and never touch the server.
    'publishable_key' => env('STRIPE_KEY') ?: env('PAYMENT_GATEWAY_PUBLISHABLE') ?: ($stripeFileKeys['key'] ?? null),

    // ISO 4217 currency code for Stripe charges.
    'currency' => env('PAYMENT_GATEWAY_CURRENCY', 'aud'),
];
