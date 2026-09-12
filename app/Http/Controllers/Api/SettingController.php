<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

/** FR59 (proposed): admin-editable system settings — every change is captured by the standard `audit` middleware. */
class SettingController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Setting::orderBy('key')->get()]);
    }

    public function update(Request $request, Setting $setting)
    {
        $data = $request->validate([
            'value' => ['required', 'string'],
        ]);

        if ($setting->type === 'number' && ! is_numeric($data['value'])) {
            abort(422, 'This setting expects a numeric value.');
        }

        if ($setting->type === 'boolean' && ! in_array($data['value'], ['true', 'false'], true)) {
            abort(422, 'This setting expects true or false.');
        }

        $setting->update([
            'value' => $data['value'],
            'updated_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $setting]);
    }
}
