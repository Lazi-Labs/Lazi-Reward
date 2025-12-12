<?php

namespace App\Http\Controllers;

use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Handle verification result from n8n
     * POST /api/webhook/verification-result
     */
    public function verificationResult(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'status' => 'required|in:approved,rejected',
            'message' => 'nullable|string',
        ]);

        $submission = Submission::where('token', $validated['token'])->first();

        if (!$submission) {
            Log::warning('Webhook received for unknown token', ['token' => $validated['token']]);
            return response()->json(['error' => 'Submission not found'], 404);
        }

        $submission->update([
            'verification_status' => $validated['status'],
            'verification_message' => $validated['message'] ?? null,
        ]);

        Log::info('Verification result received', [
            'token' => $validated['token'],
            'status' => $validated['status'],
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Check verification status (polled by frontend)
     * GET /api/webhook/check-status/{token}
     */
    public function checkStatus(string $token)
    {
        // Validate token format
        if (!preg_match('/^review_[a-zA-Z0-9]{16}$/', $token)) {
            return response()->json(['error' => 'Invalid token'], 400);
        }

        $submission = Submission::where('token', $token)->first();

        if (!$submission) {
            return response()->json(['error' => 'Submission not found'], 404);
        }

        return response()->json([
            'status' => $submission->verification_status ?? 'pending',
            'message' => $submission->verification_message,
        ]);
    }
}
