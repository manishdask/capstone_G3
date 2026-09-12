<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AiService;
use Illuminate\Http\Request;

/**
 * FR46 (proposed): non-clinical AI chatbot. The heavy lifting lives in
 * AiService (provider call, privacy gate, escalation, provenance) — this
 * controller just validates the inbound message and shapes the response.
 */
class AiChatController extends Controller
{
    public function __construct(private readonly AiService $ai)
    {
    }

    public function chat(Request $request)
    {
        $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'model' => ['nullable', 'string', 'max:120'],
        ]);

        $result = $this->ai->answer($request->string('message'), [
            'model' => $request->string('model')->value() ?: null,
        ]);

        return response()->json(['data' => $result]);
    }
}